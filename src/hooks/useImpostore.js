import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import {
  abbandonaPartita,
  apriVoto,
  chiudiAccusa,
  avanzaTurno,
  avviaPartita,
  chiediRivelazione,
  chiudiPartita,
  tentaColpo,
  creaPartita,
  daRiga,
  leggiPartita,
  leggiSchedeDeiGiri,
  leggiStorico,
} from '../lib/partiteImpostore.js'
import { leggiVoti } from '../lib/voti.js'
import { descriviErrore } from '../lib/errori.js'

// Una partita per volta, la piu' recente. Il turno deve essere lo stesso
// su otto telefoni nello stesso momento, altrimenti parlano in due
// insieme: qui il realtime non e' un lusso, e' il gioco.
export function useImpostore(membroId) {
  const [partita, setPartita] = useState(null)
  const [voto, setVoto] = useState(null)
  const [storico, setStorico] = useState([])
  // Le schede di tutti i giri d'accusa. Servono solo al finale, e solo
  // per una ragione: la rivelazione deve annunciare gli stessi nomi che
  // `paga` sta accreditando. Senza, chi aveva indovinato al primo giro
  // prenderebbe i punti senza comparire fra i premiati — e la volta
  // prima e' successo il contrario, che e' quello che ha fatto nascere
  // `raccontaFinale`.
  const [schedeDeiGiri, setSchedeDeiGiri] = useState([])
  const [stato, setStato] = useState('caricamento')
  const [errore, setErrore] = useState(null)
  // Quando il colpo di coda l'ha scritto un altro prima di te. Non e' un
  // errore — non e' andato storto niente — ma va detto, e non puo'
  // sparire da solo: e' l'unica spiegazione del perche' il finale parla
  // di una parola che non hai scritto tu.
  const [arrivatoSecondo, setArrivatoSecondo] = useState(null)
  const vivo = useRef(true)

  const caricaVoto = useCallback(async (votoId) => {
    if (!votoId) {
      setVoto(null)
      return
    }
    const [trovato] = await leggiVoti([votoId])
    if (vivo.current) setVoto(trovato ?? null)
  }, [])

  useEffect(() => {
    vivo.current = true

    leggiPartita()
      .then(async (p) => {
        if (!vivo.current) return
        setPartita(p)
        setStato('pronto')
        if (p?.votoId) await caricaVoto(p.votoId)
      })
      .catch((e) => {
        if (!vivo.current) return
        setErrore(descriviErrore(e))
        setStato('guasto')
      })

    const canale = supabase
      .channel('impostore')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'impostore_games' },
        ({ new: riga }) => {
          const nuova = daRiga(riga)
          if (!nuova) return
          setPartita((precedente) => {
            // Arriva anche l'eco delle partite vecchie: si tiene solo
            // quella in mano, o una piu' recente.
            if (precedente && nuova.id !== precedente.id) {
              return Date.parse(nuova.creataIl) > Date.parse(precedente.creataIl)
                ? nuova
                : precedente
            }
            return nuova
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'votes' },
        ({ new: riga }) =>
          setVoto((precedente) =>
            precedente && riga.id === precedente.id
              ? {
                  ...precedente,
                  conteggi: riga.tally,
                  hannoVotato: riga.voted ?? [],
                  schede: riga.ballots ?? {},
                  chiusoIl: riga.closed_at,
                }
              : precedente
          )
      )
      .subscribe()

    return () => {
      vivo.current = false
      supabase.removeChannel(canale)
    }
  }, [caricaVoto])

  // Quando la partita apre il voto su un altro telefono, qui arriva solo
  // l'id: le schede vanno chieste.
  useEffect(() => {
    const quale = partita?.stato === 'preparazione' ? partita?.votoAperturaId : partita?.votoId

    // ⚠️ Quando il voto in mano non e' piu' quello della partita, si
    // butta. Prima restava, e faceva danni veri: chiuso un giro
    // d'accusa, chiudiAccusa azzera il vote_id e la partita torna
    // "in-corso" — ma sul telefono l'oggetto del giro appena finito
    // restava li'. Finito il giro dopo, nella finestra fra "si apre il
    // voto" e "arrivano le schede" la schermata mostrava il voto
    // VECCHIO: risultava "hai gia' votato", risultavano tutti dentro, e
    // compariva "Rivela". Chi lo toccava chiudeva il giro nuovo con le
    // schede del giro prima, e mandava fuori qualcuno per un voto che in
    // quel giro nessuno aveva espresso.
    //
    // Al primissimo giro era anche peggio: restava in mano il voto
    // d'apertura, e la schermata d'accusa mostrava due tessere intestate
    // a "Qualcuno" — le opzioni '1' e '2'.
    if (!quale || quale !== voto?.id) setVoto(null)
    if (quale && quale !== voto?.id) caricaVoto(quale)
  }, [partita?.stato, partita?.votoAperturaId, partita?.votoId, voto?.id, caricaVoto])

  const nuova = useCallback(async (giocatori, variante) => {
    setErrore(null)
    setArrivatoSecondo(null)
    try {
      const p = await creaPartita({ giocatori, variante })
      setPartita(p)
      setVoto(null)
      return p
    } catch (e) {
      setErrore(descriviErrore(e))
      return null
    }
  }, [])

  // Finito il voto d'apertura, si sorteggia e si parte. Lo fa il primo
  // telefono che se ne accorge, e la funzione sul database lascia
  // passare uno solo: due che sorteggiano insieme darebbero due partite
  // diverse alla stessa gente.
  const avvia = useCallback(
    async (quanti) => {
      if (!partita) return
      setErrore(null)
      try {
        setPartita(await avviaPartita(partita, quanti))
      } catch (e) {
        setErrore(descriviErrore(e))
      }
    },
    [partita]
  )

  const avanti = useCallback(async () => {
    if (!partita) return
    setErrore(null)
    try {
      setPartita(await avanzaTurno(partita))
    } catch (e) {
      setErrore(descriviErrore(e))
    }
  }, [partita])

  const avviaVoto = useCallback(async () => {
    if (!partita || partita.votoId) return
    setErrore(null)
    try {
      setPartita(await apriVoto(partita))
    } catch (e) {
      setErrore(descriviErrore(e))
    }
  }, [partita])

  const abbandona = useCallback(async () => {
    if (!partita) return
    setErrore(null)
    try {
      setPartita(await abbandonaPartita(partita))
    } catch (e) {
      setErrore(descriviErrore(e))
    }
  }, [partita])

  const chiedi = useCallback(async () => {
    if (!partita) return
    setErrore(null)
    try {
      setPartita(await chiediRivelazione(partita, membroId))
    } catch (e) {
      setErrore(descriviErrore(e))
    }
  }, [partita, membroId])

  // Rivelare chiude il giro d'accusa, e da li' la partita fa una di tre
  // cose: va al colpo di coda, finisce, o riparte coi superstiti perche'
  // il gruppo ha eliminato un innocente.
  const rivela = useCallback(async () => {
    if (!partita) return
    setErrore(null)
    try {
      setPartita(await chiudiAccusa(partita, voto))
    } catch (e) {
      setErrore(descriviErrore(e))
    }
  }, [partita, voto])

  const tenta = useCallback(
    async (parola) => {
      if (!partita) return
      setErrore(null)
      try {
        const dopo = await tentaColpo(partita, membroId, parola)

        // ⚠️ Con due impostori beccati nello stesso giro tentano in due, e
        // vale la prima parola che arriva. La funzione del database, se il
        // tentativo c'e' gia', restituisce la riga com'e' senza sollevare
        // niente: chi arrivava secondo scriveva la sua parola, premeva "È
        // questa", e si ritrovava il finale calcolato su quella di un
        // altro senza che nessuno gli dicesse perche'. La corsa va bene —
        // sono una squadra e il primo decide per tutti e due — il silenzio
        // no.
        if (dopo.tentatoDa && dopo.tentatoDa !== membroId) {
          setArrivatoSecondo({ chi: dopo.tentatoDa, parola: dopo.tentativo })
        }

        setPartita(await chiudiPartita(dopo, voto))
      } catch (e) {
        setErrore(descriviErrore(e))
      }
    },
    [partita, membroId, voto]
  )

  // Se il tentativo arriva da un altro telefono, la partita si chiude
  // comunque: chi la vede passare a 'colpo' con il tentativo dentro
  // sistema il finale per tutti.
  const chiudi = useCallback(async () => {
    if (!partita) return
    try {
      setPartita(await chiudiPartita(partita, voto))
    } catch (e) {
      setErrore(descriviErrore(e))
    }
  }, [partita, voto])

  // I giri passati si leggono quando la partita arriva al finale, non a
  // ogni turno: e' l'unico momento in cui servono. I campi si estraggono
  // prima perche' l'oggetto `partita` cambia identita' a ogni messaggio
  // del realtime, e rileggerli a ogni battito sarebbe una query di
  // troppo ogni volta che qualcuno preme "fatto".
  const partitaId = partita?.id
  const statoPartita = partita?.stato
  const creataIl = partita?.creataIl
  const votoAperturaId = partita?.votoAperturaId

  useEffect(() => {
    if (statoPartita !== 'colpo' && statoPartita !== 'finita') {
      setSchedeDeiGiri([])
      return undefined
    }
    let vivo2 = true
    leggiSchedeDeiGiri({ id: partitaId, creataIl, votoAperturaId })
      .then((s) => vivo2 && setSchedeDeiGiri(s))
      // Se non si riesce a leggerli, il finale racconta solo l'ultimo
      // giro: meno della verita', mai il contrario. I punti invece li
      // conta `paga`, che se fallisce non chiude la partita.
      .catch(() => {})
    return () => {
      vivo2 = false
    }
  }, [partitaId, statoPartita, creataIl, votoAperturaId])

  // Lo storico si rilegge quando una partita finisce: e' l'unico momento
  // in cui puo' essere cambiato.
  useEffect(() => {
    let vivo2 = true
    leggiStorico()
      .then((s) => vivo2 && setStorico(s))
      .catch(() => {})
    return () => {
      vivo2 = false
    }
  }, [partita?.id, partita?.stato])

  return {
    partita,
    voto,
    schedeDeiGiri,
    storico,
    stato,
    errore,
    arrivatoSecondo,
    nuova,
    avanti,
    avviaVoto,
    avvia,
    abbandona,
    chiedi,
    rivela,
    tenta,
    chiudi,
    setVoto,
  }
}

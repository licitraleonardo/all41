import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import {
  apriVoto,
  avanzaTurno,
  chiediRivelazione,
  chiudiPartita,
  creaPartita,
  daRiga,
  leggiPartita,
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
  const [stato, setStato] = useState('caricamento')
  const [errore, setErrore] = useState(null)
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
    if (partita?.votoId && partita.votoId !== voto?.id) caricaVoto(partita.votoId)
  }, [partita?.votoId, voto?.id, caricaVoto])

  const nuova = useCallback(async (giocatori, variante) => {
    setErrore(null)
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

  const chiedi = useCallback(async () => {
    if (!partita) return
    setErrore(null)
    try {
      setPartita(await chiediRivelazione(partita, membroId))
    } catch (e) {
      setErrore(descriviErrore(e))
    }
  }, [partita, membroId])

  const rivela = useCallback(async () => {
    if (!partita) return
    setErrore(null)
    try {
      setPartita(await chiudiPartita(partita, voto?.schede ?? {}))
    } catch (e) {
      setErrore(descriviErrore(e))
    }
  }, [partita, voto?.schede])

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

  return { partita, voto, storico, stato, errore, nuova, avanti, avviaVoto, chiedi, rivela, setVoto }
}

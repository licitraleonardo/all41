import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { supabaseConfigurato, assicuraSessione } from './lib/supabase.js'
import {
  aggiornaMembro,
  creaMembro,
  segnaVisita,
  trovaPerCodice,
  trovaPerId,
  leggiMembri,
} from './lib/membri.js'
import { dimenticaMemberId, memberIdSalvato, salvaMemberId } from './lib/sessione.js'
import { negliAppunti, negliAppuntiQuandoPronto } from './lib/appunti.js'
import { descriviErrore } from './lib/errori.js'
import { sembraRete } from './lib/cache.js'
import { eScaduta } from './lib/scadenza.js'
import { chiudiScaduti } from './lib/voti.js'
import { risolviProposte } from './lib/proposte.js'
import { allApertura, forseSottoZero } from './lib/regole.js'
import { leggiRecordPecora, risolviRecordPecora } from './lib/recordPecora.js'
import Onboarding from './components/Onboarding.jsx'
import Toast from './components/Toast.jsx'

import Profilo from './components/Profilo.jsx'
import ModificaProfilo from './components/ModificaProfilo.jsx'
import Itinerario from './components/Itinerario.jsx'
import Gruppo from './components/Gruppo.jsx'
import Album from './components/Album.jsx'
import Gioco from './components/Gioco.jsx'
import Altro from './components/Altro.jsx'
import BarraTab from './components/BarraTab.jsx'
import NuvolettaAllan from './components/NuvolettaAllan.jsx'
import Riparo from './components/Riparo.jsx'
import Targhetta from './components/Targhetta.jsx'
import { useSoundboard } from './hooks/useSoundboard.js'
import { useScoperte } from './hooks/useScoperte.js'
import { useDerisione } from './hooks/useDerisione.js'
import { useProposteAperte } from './hooks/useProposteAperte.js'
import { useConnessione } from './hooks/useConnessione.js'
import { useRinfrescaPosizione } from './hooks/useRinfrescaPosizione.js'
import { useNonLetto } from './hooks/useNonLetto.js'
import { useMvp } from './hooks/useMvp.js'
import { useSfideDama } from './hooks/useSfideDama.js'
import { useSchedaRicordata } from './hooks/useSchedaRicordata.js'
import { CHIAVE_TAB, CHIAVE_VISTA, VISTE_CON_CRONOLOGIA } from './lib/navigazione.js'
import { useLeggiDaLeggere } from './hooks/useLeggiDaLeggere.js'
import { risolviDama } from './lib/puntiDama.js'
import Celebrazione from './components/Celebrazione.jsx'
import Derisione from './components/Derisione.jsx'
import BannerProposta from './components/BannerProposta.jsx'
import { useSosAperti } from './hooks/useSosAperti.js'
import { useAvvisoRapido } from './hooks/useAvvisoRapido.js'
import { useDatiVecchi } from './hooks/useDatiVecchi.js'
import { riallineaIscrizione } from './lib/notifiche.js'
import { vaMostrato } from './lib/avvisiRapidi.js'
import BannerPosizione from './components/BannerPosizione.jsx'
import StrisciaSOS from './components/StrisciaSOS.jsx'
import BannerRapido from './components/BannerRapido.jsx'
import BannerFeedback from './components/BannerFeedback.jsx'
import FoglioFeedback from './components/FoglioFeedback.jsx'
import { useFeedback } from './hooks/useFeedback.js'
import StrisciaOffline from './components/StrisciaOffline.jsx'
import BannerSfida from './components/BannerSfida.jsx'
import BannerTestamento from './components/BannerTestamento.jsx'
import Pecora from './components/Pecora.jsx'
// Quattordici secondi di pixel art su canvas: pesa, e serve solo a chi
// non e' ancora entrato. Chi apre l'app col profilo gia' salvato non la
// scarica nemmeno. Stessa scelta della mappa con Leaflet.
const Intro = lazy(() => import('./components/Intro.jsx'))

// Iniettati a build time da vite.config.js — servono a capire quale deploy
// si sta guardando.
// Come si chiama ogni scheda quando bisogna dire che si e' rotta.
const NOMI_TAB = {
  oggi: 'Il programma',
  gruppo: 'La chat',
  foto: 'L’album',
  gioco: 'Il gioco',
  altro: 'Questa sezione',
}


export default function App() {
  const [vista, setVista] = useState('avvio')
  // Ricaricare non deve riportare a "Oggi": chi tira giu' per aggiornare
  // sta guardando un tab preciso e vuole quello, aggiornato. Il tab vive
  // in sessionStorage e non in localStorage: dura il tempo della scheda,
  // cosi' riaprire l'app domani riparte comunque dal programma del giorno.
  // ⚠️ Anche il tab passa dallo stesso posto delle sotto-schede: e' quello
  // che permette al tasto indietro di rifare la strada Oggi -> Gioco ->
  // Dama al contrario. Prima era uno `useState` con sessionStorage a
  // mano, e la cronologia non lo vedeva.
  // ⚠️ `ricorda: false`: ricaricando si torna nel viaggio, non sulla
  // propria foto. La cronologia serve lo stesso — è tutto il punto.
  const [vistaInCronologia, setVistaInCronologia] = useSchedaRicordata(
    CHIAVE_VISTA,
    'dentro',
    VISTE_CON_CRONOLOGIA,
    { ricorda: false }
  )

  const [tab, setTab] = useSchedaRicordata(CHIAVE_TAB, 'oggi', [
    'oggi',
    'gruppo',
    'foto',
    'gioco',
    'altro',
  ])

  // Il tasto indietro ha cambiato la vista: si applica. Solo fra le tre
  // che stanno in cronologia — da un guasto o dall'ingresso non si esce
  // tornando indietro.
  useEffect(() => {
    if (!VISTE_CON_CRONOLOGIA.includes(vista)) return
    if (vista === vistaInCronologia) return
    setVista(vistaInCronologia)
  }, [vistaInCronologia, vista])

  const [membro, setMembro] = useState(null)
  const [errore, setErrore] = useState(null)
  const [inCorso, setInCorso] = useState(false)
  // Vive qui e non dentro una schermata: deve poter comparire mentre la
  // schermata che l'ha chiesto si sta smontando — è il caso dell'uscita.
  const [toast, setToast] = useState(null)

  // L'intro si vede al primo accesso e quando si esce, non a ogni
  // ricaricamento della schermata d'ingresso: quattordici secondi sono
  // un bel regalo la prima volta e una tassa la terza. Il segnalibro sta
  // in sessionStorage e lo cancella `esci`, che e' l'altro momento in
  // cui va rivista.
  const [introFinita, setIntroFinita] = useState(() => {
    try {
      return sessionStorage.getItem('all41.intro') === 'vista'
    } catch {
      return true
    }
  })

  const chiudiIntro = useCallback(() => {
    try {
      sessionStorage.setItem('all41.intro', 'vista')
    } catch {
      // Navigazione privata: la rivedra'. Non e' un motivo per bloccarsi.
    }
    setIntroFinita(true)
  }, [])

  // Sta qui e non nella Chat Rapida: il suono lanciato da un altro deve
  // sentirsi qualunque tab sia aperta.
  const { disponibili: suoniDisponibili } = useSoundboard(membro?.id)

  // Una Legge scoperta si celebra su tutti i telefoni, qualunque tab sia
  // aperta: è il momento di paga di tutto il sistema di punti.
  const { celebrazione, chiudi: chiudiCelebrazione } = useScoperte(vista === 'dentro')

  // Chi si propone punti da solo lo scopre tutto il gruppo, subito e
  // dovunque sia: il momento va visto mentre succede.
  const { derisione, chiudi: chiudiDerisione } = useDerisione(
    vista === 'dentro',
    membro?.id
  )

  // Quando torna il segnale si riprova da soli: chi era offline non deve
  // accorgersi del momento giusto per premere un bottone.
  const inLinea = useConnessione()
  // ⚠️ L'altra meta' del «sto guardando roba vecchia»: la rete c'e' ma non
  // risponde, quindi `inLinea` dice di si' e sotto sotto si sta servendo
  // la copia. Vedi il commento in StrisciaOffline.
  const datiVecchi = useDatiVecchi()
  const eraOffline = useRef(false)

  useEffect(() => {
    if (!inLinea) {
      eraOffline.current = true
      return
    }
    if (eraOffline.current && vista === 'guasto') {
      eraOffline.current = false
      window.location.reload()
    }
  }, [inLinea, vista])

  // L'MVP della giornata finita si fissa alla prima apertura dopo
  // mezzanotte, e i coriandoli partono su tutti i telefoni: sta qui e non
  // nel tab Gioco perché non si deve dipendere da dove stavi guardando.
  const mvp = useMvp(membro?.id, vista === 'dentro')

  // I pallini stanno qui perché devono accendersi mentre guardi
  // un'altra scheda: se vivessero dentro la chat, la chat dovrebbe
  // restare aperta per accorgersi dei messaggi nuovi.
  const nonLetto = useNonLetto(membro?.id, vista === 'dentro')

  // Le proposte aperte vivono qui e non dentro una scheda: il banner deve
  // raggiungerti su qualunque tab, come la celebrazione delle Leggi.
  const proposte = useProposteAperte(vista === 'dentro' ? membro?.id : null)

  // "La tua posizione è ferma lì da tre ore, la aggiorno?" — solo a chi
  // l'ha già condivisa almeno una volta, e solo quando è vecchia davvero.
  const posizione = useRinfrescaPosizione(membro?.id, vista === 'dentro')
  // ⚠️ Qui e non dentro la chat: un SOS lo devono vedere anche i sette
  // che in quel momento stanno guardando le foto.
  const sos = useSosAperti()
  const avviso = useAvvisoRapido(membro?.id, vista === 'dentro')
  const feedback = useFeedback()

  // ⚠️ A ogni apertura si rimette a posto l'iscrizione alle notifiche.
  //
  // Il browser puo' averne una che sul nostro database non c'e' — prima
  // volta andata a meta', database svuotato, o il telefono che l'ha
  // rigenerata da solo. In quei casi l'app diceva «✓ Accese» e non
  // arrivava niente, e l'unico tasto era «Spegni». Vedi il commento in
  // `lib/notifiche.js`.
  useEffect(() => {
    if (vista !== 'dentro' || !membro?.id) return
    riallineaIscrizione(membro.id)
  }, [vista, membro?.id])

  // ⚠️ Chi si è preso la cima. In quel posto ci sta una cosa sola: sono
  // tutti `position: fixed; top: 0`, quindi due insieme si coprono a
  // vicenda e chi legge ne vede uno solo — senza sapere che ce n'era un
  // altro sotto.
  //
  // L'ordine è per quanto in fretta scade quello che dicono: un SOS non
  // scade affatto, «si riparte fra 5 minuti» scade in cinque minuti, una
  // proposta di punti in un'ora, una Legge scoperta aspetta domani.
  const sosInCima = sos.aperti.length > 0
  const avvisoInCima =
    !sosInCima && vaMostrato({ azione: avviso.azione, ioId: membro?.id, tab })
  const inCima = sosInCima || avvisoInCima

  // Le sfide a dama arrivano mentre guardi le foto: il banner deve
  // raggiungerti dovunque, come le proposte di punti.
  const sfideDama = useSfideDama(vista === 'dentro' ? membro?.id : null)
  // La partita da aprire accettando: il tab Gioco la riceve e ci atterra
  // dentro, cosi' "Vediamo" porta alla scacchiera e non a un elenco.
  const [damaDaAprire, setDamaDaAprire] = useState(null)

  // Le Leggi scoperte e non ancora lette: la celebrazione coi coriandoli
  // dura sei secondi e scatta solo alla prima scoperta del gruppo, quindi
  // chi in quel momento aveva il telefono in tasca non le vede mai.
  const daLeggere = useLeggiDaLeggere(vista === 'dentro' ? membro?.id : null, vista === 'dentro')
  const [leggeDaAprire, setLeggeDaAprire] = useState(null)

  const apriLegge = useCallback(
    (leggeId) => {
      daLeggere.zittisci()
      setLeggeDaAprire(leggeId)
      setTab('gioco')
      try {
        sessionStorage.setItem('scheda.gioco', 'testamento')
      } catch {
        // pazienza: si atterra sulla classifica, la Legge resta col pallino
      }
    },
    [daLeggere]
  )

  const accettaSfida = useCallback((partitaId) => {
    setDamaDaAprire(partitaId)
    setTab('gioco')
    try {
      sessionStorage.setItem('scheda.gioco', 'dama')
    } catch {
      // pazienza: si atterra sulla classifica e la partita si apre lo stesso
    }
  }, [])
  const [membriPerId, setMembriPerId] = useState({})

  useEffect(() => {
    if (vista !== 'dentro') return
    leggiMembri()
      .then((elenco) => setMembriPerId(Object.fromEntries(elenco.map((m) => [m.id, m]))))
      .catch(() => {})
  }, [vista])

  useEffect(() => {
    if (!supabaseConfigurato) {
      setVista('nonConfigurato')
      return
    }

    let annullato = false

    async function avvia() {
      try {
        // Senza rete la sessione anonima non si può creare, e non è un
        // motivo per restare fuori: se il profilo è già stato letto una
        // volta, da qui in poi si va avanti con le copie locali.
        //
        // ⚠️ Vale anche quando la rete c'è ma non risponde. Prima la
        // condizione era solo `navigator.onLine !== false`, che con una
        // tacca di segnale dice "sono online": la sessione scadeva, l'errore
        // veniva rilanciato, e la schermata restava su «Un attimo.» —
        // mentre profilo, programma e documenti erano già in `localStorage`
        // due righe più sotto. Chi arriva qui in quello stato non ha
        // nemmeno un tasto da toccare, e riaprire l'app rifà la stessa
        // attesa.
        //
        // Una sessione che non arriva non impedisce di guardare quello che
        // si è già scaricato: impedisce di scrivere, e lo si scopre quando
        // si prova a scrivere.
        try {
          await assicuraSessione()
        } catch (e) {
          const senzaRisposta = eScaduta(e) || sembraRete(e, navigator.onLine !== false)
          if (!senzaRisposta) throw e
        }

        const id = memberIdSalvato()
        if (!id) {
          if (!annullato) setVista('onboarding')
          return
        }

        const trovato = await trovaPerId(id)
        if (annullato) return

        if (!trovato) {
          // Profilo cancellato dal database: si riparte da capo.
          dimenticaMemberId()
          setVista('onboarding')
          return
        }

        setMembro(trovato)
        setVista('dentro')
        segnaVisita(trovato.id).catch(() => {})

        // Chi apre l'app alle quattro di notte lo sta facendo apposta.
        allApertura(trovato.id).catch(() => {})

        // Senza un server, un sondaggio scaduto alle 23:59 mentre tutti
        // dormono resterebbe appeso per sempre: lo chiude chi apre l'app.
        chiudiScaduti().catch(() => {})

        // ⚠️ Da qui in giù si DECIDE, non si guarda: si assegnano punti
        // che hanno una `dedupeKey` e non si revocano. Quindi tutte queste
        // letture sono `.fresca()`, che non ripiega sulla copia locale.
        //
        // Con la copia, il primo telefono che apriva l'app con una tacca
        // di segnale decideva sui dati di ieri sera — e chiudeva la
        // questione per tutti: il +3 del record della Pecora a chi era in
        // testa quando è stata scattata la copia, il quorum di una
        // proposta contato su un gruppo più piccolo di quello vero, il
        // «sotto zero» a chi nel frattempo era già risalito.
        //
        // Se non riescono a leggere fresco non decidono, e riprovano alla
        // prossima apertura. È già il modello del progetto: lo muove il
        // primo che apre l'app. Rimandare di due ore non costa niente,
        // sbagliare costa per sempre.
        leggiMembri
          .fresca()
          .then(async (elenco) => {
            await risolviProposte(elenco.map((m) => m.id))
            // I punteggi si muovono risolvendo le proposte: chi è finito
            // sotto zero si guarda dopo, non prima — e va riletto fresco,
            // o si guarda proprio la fotografia di prima che si
            // muovessero.
            await forseSottoZero(await leggiMembri.fresca())
          })
          .catch(() => {})

        // Il record della pecora di ieri vale +3 (Legge XX), e quello di
        // fine viaggio +5 (XXV). Nessuno è sveglio a mezzanotte a
        // chiudere la giornata: la chiude il primo che apre l'app.
        // ⚠️ `sheep-trip` non ha la data nella chiave: si assegna una volta
        // sola per tutto il viaggio, quindi su una copia vecchia si
        // sbaglierebbe una volta sola e per sempre.
        leggiRecordPecora
          .fresca()
          .then((righe) => risolviRecordPecora(righe))
          .catch(() => {})

        // Il campione di dama di ieri: stesso schema, lo assegna il
        // primo che apre l'app il giorno dopo. La tabella puo' non
        // esserci ancora, e non e' un guasto.
        Promise.all([leggiMembri.fresca(), import('./lib/partiteDama.js')])
          .then(([elenco, dama]) =>
            dama.leggiPartite().then((partite) =>
              risolviDama(partite, elenco.map((m) => m.id))
            )
          )
          .catch(() => {})
      } catch (e) {
        if (annullato) return
        setErrore(descriviErrore(e))
        setVista('guasto')
      }
    }

    avvia()
    return () => {
      annullato = true
    }
  }, [])

  const entra = useCallback(async ({ nome, avatarStyle, telefono = null }) => {
    setInCorso(true)
    setErrore(null)

    // AUTH-2. La copia si dichiara PRIMA della rete e non dopo: il
    // codice nasce insieme al profilo, cioè dopo un giro di richieste, e
    // a quel punto su iPhone il permesso di copiare è già scaduto —
    // Safari lo concede solo dentro il gesto appena fatto. Passando una
    // Promise, il permesso resta aperto finché non si risolve.
    //
    // Niente await qui davanti, o l'attivazione scade prima di arrivarci.
    let daiIlCodice
    const codicePronto = new Promise((r) => {
      daiIlCodice = r
    })
    const copiaFatta = negliAppuntiQuandoPronto(codicePronto)

    try {
      // Stesso motivo di `recupera`: senza sessione l'inserimento viene
      // rifiutato dalle regole di sicurezza, e `descriviErrore` traduce
      // quel rifiuto in «Rilancia supabase/schema.sql» — che manda a
      // cercare il problema nel database quando il problema è il segnale.
      try {
        await assicuraSessione()
      } catch (e) {
        daiIlCodice('')
        setErrore(
          eScaduta(e) || sembraRete(e, navigator.onLine !== false)
            ? 'La rete non risponde: il profilo non è stato creato. Riprova fra un momento.'
            : descriviErrore(e)
        )
        return
      }

      const nuovo = await creaMembro({ nome, avatarStyle, telefono })
      daiIlCodice(nuovo.codice)
      salvaMemberId(nuovo.id)
      setMembro(nuovo)

      // Dentro l'app, senza schermate intermedie: lo dice AUTH-3.
      setVista('dentro')

      // Il toast dice la verità: se la copia non è riuscita — contesto
      // non sicuro, permesso negato — il codice si scrive lo stesso,
      // perché è l'unica cosa che riporta dentro.
      copiaFatta
        .then((riuscita) =>
          setToast(
            riuscita
              ? `Codice copiato — ${nuovo.codice}`
              : `Il tuo codice è ${nuovo.codice}. Segnatelo: senza non si rientra.`
          )
        )
        .catch(() => setToast(`Il tuo codice è ${nuovo.codice}. Segnatelo.`))
    } catch (e) {
      daiIlCodice('')
      setErrore(descriviErrore(e))
    } finally {
      setInCorso(false)
    }
  }, [])

  const recupera = useCallback(async (codice) => {
    setInCorso(true)
    setErrore(null)
    try {
      // ⚠️ La sessione PRIMA della ricerca, e il suo guasto raccontato per
      // quello che è.
      //
      // Senza sessione anonima le regole di sicurezza non fanno vedere
      // nessuna riga: la ricerca non fallisce, torna zero righe. E zero
      // righe, qui sotto, diventavano «Non ti trovo. Controlla il codice.»
      // detto a chi il codice ce l'ha giusto.
      //
      // È la frase peggiore che l'app potesse dire, perché la reazione
      // naturale è aprire «Registrati» e rifare il profilo: otto persone
      // diventano nove, i saldi delle Spese si dividono per nove, e la
      // classifica si spezza su due identità che non si ricongiungono più.
      // Un problema di rete travestito da colpa dell'utente.
      try {
        await assicuraSessione()
      } catch (e) {
        setErrore(
          eScaduta(e) || sembraRete(e, navigator.onLine !== false)
            ? 'Il codice va bene, è la rete che non risponde. Riprova fra un momento.'
            : descriviErrore(e)
        )
        return
      }

      const trovato = await trovaPerCodice(codice)
      if (!trovato) {
        setErrore('Non ti trovo. Controlla il codice.')
        return
      }
      salvaMemberId(trovato.id)
      setMembro(trovato)
      setVista('dentro')
      segnaVisita(trovato.id).catch(() => {})
    } catch (e) {
      setErrore(descriviErrore(e))
    } finally {
      setInCorso(false)
    }
  }, [])

  const salvaModifiche = useCallback(
    async ({ nome, avatarStyle }) => {
      setInCorso(true)
      setErrore(null)
      try {
        const aggiornato = await aggiornaMembro(membro.id, { nome, avatarStyle })
        setMembro(aggiornato)
        setVista('profilo')
      } catch (e) {
        setErrore(descriviErrore(e))
      } finally {
        setInCorso(false)
      }
    },
    [membro]
  )

  // AUTH-1. Il codice si copia da solo uscendo, e il messaggio sopravvive
  // alla schermata che lo mostrava: `esci` la smonta nello stesso istante,
  // quindi un avviso dichiarato dentro Profilo non si vedrebbe mai.
  //
  // Il testo si costruisce prima di azzerare `membro`, che subito dopo è
  // null. E la copia parte dentro il gesto, senza await davanti.
  const esci = useCallback(() => {
    const codice = membro?.codice
    if (!codice) {
      dimenticaMemberId()
      setMembro(null)
      setErrore(null)
      setVista('onboarding')
      return
    }

    // Il codice resta scritto nel messaggio anche quando la copia
    // riesce: la schermata di conferma non c'è più, quindi questa è
    // l'ultima occasione di vederlo prima che il dispositivo se lo
    // dimentichi.
    negliAppunti(codice)
      .then((riuscita) =>
        setToast(
          riuscita
            ? `Codice copiato — ${codice}`
            : `Il tuo codice è ${codice}. Senza non si rientra.`
        )
      )
      .catch(() => setToast(`Il tuo codice è ${codice}. Senza non si rientra.`))

    dimenticaMemberId()
    setMembro(null)
    setErrore(null)
    setVista('onboarding')

    // Uscendo si torna alla copertina: e' l'altro momento in cui l'intro
    // ha senso, perche' si sta ricominciando da capo.
    try {
      sessionStorage.removeItem('all41.intro')
    } catch {
      // pazienza
    }
    setIntroFinita(false)
  }, [membro])

  // ⚠️ Il profilo passa dalla cronologia, il resto no.
  //
  // Toccando la foto del profilo il tasto indietro non tornava nel
  // viaggio: usciva dall'app. Adesso `profilo` e `modifica` lasciano una
  // voce, come fanno i tab.
  //
  // Le altre viste no, ed è voluto: `avvio`, `guasto`, `onboarding` e
  // `nonConfigurato` non sono posti dove si va, sono stati in cui l'app
  // si trova. Tornare indietro dentro un guasto è peggio che non tornare.
  function vaiA(prossima) {
    setErrore(null)
    if (VISTE_CON_CRONOLOGIA.includes(prossima)) setVistaInCronologia(prossima)
    setVista(prossima)
  }

  // L'app vera è a tutta pagina e su fondo chiaro: sta fuori dal
  // contenitore centrato e scuro delle schermate d'ingresso.
  if (vista === 'dentro') {
    return (
      <>
        {/* Ogni scheda dentro la sua rete: se una si rompe, le altre
            quattro restano in piedi. Senza, una svista in una schermata
            faceva pagina bianca su tutta l'app — ed e' successo davvero.
            La chiave sul tab rimonta la rete cambiando scheda, cosi'
            tornandoci si riprova invece di trovare il cartello. */}
        <Riparo key={tab} nome={NOMI_TAB[tab]}>
          {tab === 'oggi' && (
            <Itinerario membro={membro} onProfilo={() => vaiA('profilo')} />
          )}
          {tab === 'gruppo' && (
            <Gruppo
              membro={membro}
              suoniDisponibili={suoniDisponibili}
              nonLetto={nonLetto.dettaglio}
              onVisto={nonLetto.segna}
            />
          )}
          {tab === 'foto' && <Album membro={membro} />}
          {tab === 'gioco' && (
            <Gioco
              membro={membro}
              proposteAperte={proposte.aperte}
              onVotaProposta={proposte.vota}
              nonLetto={nonLetto.dettaglio}
              onVisto={nonLetto.segna}
              conteggiMvp={mvp.conteggi}
              damaDaAprire={damaDaAprire}
              onDamaAperta={() => setDamaDaAprire(null)}
              leggeDaAprire={leggeDaAprire}
              onLeggeAperta={() => setLeggeDaAprire(null)}
            />
          )}
          {tab === 'altro' && <Altro membro={membro} />}
        </Riparo>
        <BarraTab attivo={tab} onCambia={setTab} novita={nonLetto.novita} />

        {/* Banner, nuvolette e coriandoli in una rete che tace: sono
            tutte cose in piu', e una che si rompe deve sparire invece di
            prendersi lo schermo con un cartello d'errore. La barra dei
            tab resta fuori, perche' senza quella non si va da nessuna
            parte. */}
        <Riparo zitto>
          {/* Qui resta solo Oggi, che non ha sotto-schede. Gli altri
              quattro tab montano la nuvoletta al loro interno: lo stato
              della sotto-scheda vive lì, e i quindici step dello spec
              parlano di sotto-schede, non di tab. */}
          {tab === 'oggi' && <NuvolettaAllan membroId={membro?.id} passo="oggi" />}
        </Riparo>

        <StrisciaOffline attiva={!inLinea} copia={datiVecchi} />

        {/* ⚠️ Fuori dal `Riparo` degli altri e prima di tutti: se si
            rompesse qualcosa nel banner delle proposte, l'SOS deve
            restare a schermo lo stesso. E in cima ci sta lui: una
            proposta di punti scade in un'ora, una sfida a dama aspetta,
            uno che si è perso no. */}
        <Riparo zitto>
          <StrisciaSOS
            aperti={sos.aperti}
            nome={(id) => membriPerId[id]?.nome ?? 'Qualcuno'}
            onRientrato={sos.rientrato}
          />
        </Riparo>

        {/* Subito sotto l'SOS, e sopra le proposte: una proposta di punti
            scade in un'ora, «si riparte fra 5 minuti» scade in cinque
            minuti. Se ne mostra uno solo, e chi è già nel Gruppo non lo
            vede — ce l'ha davanti. */}
        <Riparo zitto>
          {avvisoInCima && (
            <BannerRapido
              azione={avviso.azione}
              nome={membriPerId[avviso.azione?.autoreId]?.nome}
              onMostra={() => {
                setTab('gruppo')
                avviso.zittisci()
              }}
              onDopo={avviso.zittisci}
            />
          )}
        </Riparo>

        <Riparo zitto>
          {/* Uno solo alla volta in cima, e la precedenza è delle
              proposte: quelle scadono in un'ora, la posizione può
              aspettare la prossima apertura. Due banner fissi nello
              stesso posto si coprirebbero a vicenda.

              E tutti si tolgono di mezzo quando c'è un SOS aperto. */}
          {!inCima && inLinea && posizione.daChiedere && proposte.daDecidere.length === 0 && (
            <BannerPosizione
              mia={posizione.mia}
              onAggiorna={posizione.aggiorna}
              onNo={posizione.no}
              onNonOra={posizione.nonOra}
            />
          )}
          {/* Senza rete il voto non partirebbe: il banner si toglie
              invece di restare lì con due bottoni che falliscono. Torna
              da solo col segnale, e intanto quel posto lo occupa la
              striscia. */}
          <BannerProposta
            proposte={inLinea && !inCima ? proposte.daDecidere : []}
            membri={membriPerId}
            onVota={proposte.vota}
            onRimanda={proposte.rimanda}
          />

          {/* Uno solo in cima alla volta, e la precedenza e' delle
              proposte: quelle scadono in un'ora, una sfida a dama
              aspetta. */}
          {!inCima && inLinea && proposte.daDecidere.length === 0 && (
            <BannerSfida
              sfide={sfideDama.daAccettare}
              membri={membriPerId}
              onAccetta={accettaSfida}
              onRimanda={sfideDama.rimanda}
            />
          )}

          {/* Ultimo della fila: una Legge scoperta puo' aspettare piu' di
              una proposta che scade e di una sfida lanciata adesso. E non
              si mostra a chi sta gia' guardando il Testamento. */}
          {!inCima &&
            inLinea &&
            proposte.daDecidere.length === 0 &&
            sfideDama.daAccettare.length === 0 &&
            tab !== 'gioco' && (
              <BannerTestamento
                leggi={daLeggere.daAnnunciare}
                onApri={apriLegge}
                onDopo={daLeggere.zittisci}
              />
            )}

          {/* ⚠️ Ultimo della fila, e con la coda di condizioni piu' lunga
              di tutte: un feedback aspetta l'SOS, gli avvisi rapidi, le
              proposte, le sfide e il Testamento. E' l'unica cosa in cima
              che non ha nessuna fretta: se coprisse qualcosa che ne ha,
              avrebbe fatto danno. */}
          {!inCima &&
            inLinea &&
            proposte.daDecidere.length === 0 &&
            sfideDama.daAccettare.length === 0 &&
            daLeggere.daAnnunciare.length === 0 &&
            feedback.daChiedere &&
            !feedback.aperto && (
              <BannerFeedback onScrivi={feedback.apri} onDopo={feedback.dopo} />
            )}
        </Riparo>

        <Riparo zitto>
          {feedback.aperto && (
            <FoglioFeedback membroId={membro?.id} dove={tab} onChiudi={feedback.chiudi} />
          )}
        </Riparo>

        <Riparo zitto>
          <Celebrazione celebrazione={celebrazione} onChiudi={chiudiCelebrazione} />

          {mvp.festa && (
            <Celebrazione
              celebrazione={{
                mvp: {
                  nome: membriPerId[mvp.festa.membroId]?.nome ?? 'Qualcuno',
                  saldo: mvp.festa.saldo,
                  quante: mvp.conteggi[mvp.festa.membroId] ?? 1,
                },
              }}
              onChiudi={mvp.chiudi}
            />
          )}
          <Derisione derisione={derisione} onChiudi={chiudiDerisione} />
        </Riparo>

        {/* Fuori dal Riparo: entrando col profilo appena creato il toast
            porta il codice di accesso, ed è l'unica cosa che riporta
            dentro. Non è un di più che può sparire in silenzio. */}
        <Toast messaggio={toast} onChiudi={() => setToast(null)} />
      </>
    )
  }

  return (
    <main className="schermata">
      {vista === 'avvio' && <p className="allan">Un attimo.</p>}

      {vista === 'nonConfigurato' && <NonConfigurato />}

      {/* Senza rete non è un guasto, ed è inutile dare la colpa a
          Supabase: l'app si è aperta lo stesso. Qui non ci si arriva
          quasi più — con una copia dei dati si entra nell'app vera — ma
          chi apre senza rete e senza aver mai scaricato niente trova
          almeno Al da far saltare. */}
      {vista === 'guasto' && !inLinea && (
        <div className="pannello">
          <h1 className="titolo">Niente rete.</h1>
          <p className="allan">Mi annoio.</p>
          <Pecora compatta />
          <p className="istruzioni">
            L&rsquo;app c&rsquo;è, i dati no. Torna il segnale e riprende da sola.
          </p>
        </div>
      )}

      {vista === 'guasto' && inLinea && (
        <div className="pannello">
          <h1 className="titolo">Non funziona</h1>
          <p className="errore">{errore}</p>
          <button
            type="button"
            className="primario"
            onClick={() => window.location.reload()}
          >
            Riprova
          </button>
        </div>
      )}

      {/* Il codice si inserisce dentro l'onboarding e non in una
          schermata a parte: `onRecupera` entra davvero invece di
          navigare da qualche altra parte. */}
      {/* ⚠️ Non si monta finche' l'intro non e' finita. Prima l'ingresso
          si disegnava sotto e l'intro gli arrivava sopra mezzo secondo
          dopo — il tempo di scaricare il componente, che e' caricato
          pigro — e si vedeva lampeggiare la schermata del codice prima
          della copertina. */}
      {vista === 'onboarding' && introFinita && (
        <Onboarding
          onEntra={entra}
          onRecupera={recupera}
          inCorso={inCorso}
          errore={errore}
        />
      )}

      {vista === 'profilo' && (
        <Profilo
          membro={membro}
          onModifica={() => vaiA('modifica')}
          onEsci={esci}
          onIndietro={() => vaiA('dentro')}
        />
      )}

      {vista === 'modifica' && (
        <ModificaProfilo
          membro={membro}
          onSalva={salvaModifiche}
          onAnnulla={() => vaiA('profilo')}
          inCorso={inCorso}
          errore={errore}
        />
      )}

      {/* Sopra tutto: e' una copertina, non una schermata dell'app.
          Copre da sola con position:fixed, quindi puo' stare qui in
          fondo senza spostare niente. */}
      {vista === 'onboarding' && !introFinita && (
        <Suspense fallback={<div className="intro-attesa" />}>
          <Intro onFine={chiudiIntro} />
        </Suspense>
      )}

      <Toast messaggio={toast} onChiudi={() => setToast(null)} />

      <Targhetta />
    </main>
  )
}

function NonConfigurato() {
  return (
    <div className="pannello">
      <h1 className="titolo">Manca la configurazione</h1>
      <p className="allan">
        Non ho le chiavi di Supabase, quindi non posso fare niente.
      </p>
      <p className="istruzioni">
        Servono <code>VITE_SUPABASE_URL</code> e{' '}
        <code>VITE_SUPABASE_ANON_KEY</code>: in locale nel file{' '}
        <code>.env.local</code>, sul deploy nelle Environment Variables di
        Vercel.
      </p>
    </div>
  )
}


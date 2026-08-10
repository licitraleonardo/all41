import { useEffect, useState } from 'react'
import './ChiediNotifiche.css'
import {
  comeStaMesso,
  disiscriviti,
  installataSullaHome,
  iscriviti,
  notifichePossibili,
  statoIscrizione,
  suAndroid,
  suIPhone,
} from '../lib/notifiche.js'

// ⚠️ Ogni motivo ha la sua frase, e ognuna dice cosa fare.
//
// Prima c'era un «Non è andata. Riprova.» per tutto. Sembrava gentile ed
// era inutile: chi lo leggeva non sapeva se fosse colpa sua, del telefono
// o dell'app, e chi l'ha scritta ha dovuto chiedere «cosa dice
// esattamente?» invece di leggerlo da qui.
const MOTIVI = {
  'non-installata':
    'Su iPhone devi prima mettere l’app sulla schermata home: tasto condividi, «Aggiungi a Home». Da Safari non si può proprio.',
  // ⚠️ Su Android questa frase mandava nel posto sbagliato, e l'ho visto
  // succedere: nelle informazioni dell'app c'è scritto «Notifiche:
  // Consentite», quindi sembra tutto a posto e non si capisce più niente.
  //
  // Sono due permessi diversi. Quello dell'app dice che il telefono può
  // mostrare notifiche; quello che manca è il permesso **del sito**, che
  // il browser tiene per conto suo e che vale anche dentro l'app
  // installata. Si tocca solo da lì.
  denied: null, // lo compone il componente: cambia da telefono a telefono
  default: 'Hai chiuso il cartello senza rispondere. Riprova e premi «Consenti».',
  impossibile: 'Questo browser non sa mandare notifiche.',
  'non configurato': 'Manca la chiave delle notifiche. È una cosa da sistemare qui, non sul tuo telefono.',
  'iscrizione-vuota': 'Il telefono non ha dato un indirizzo valido. Prova a chiudere e riaprire l’app.',
}

// «Fatti avvisare»: il permesso per le notifiche.
//
// ⚠️ Sta in una schermata dove uno ci arriva apposta, e non è un cartello
// a sorpresa la prima sera.
//
// Su iOS il permesso si può chiedere **solo da un tocco**, mai da solo —
// quindi un tasto ci vuole comunque. Ma la ragione vera è un'altra: il
// permesso delle notifiche si concede una volta sola nella vita. Chi
// dice di no perché gli è saltato addosso mentre stava facendo altro non
// se lo rivede più, e per riaprirlo deve andare nelle impostazioni del
// telefono. Un no dato di fretta vale per tutto il viaggio.
//
// Per lo stesso motivo qui sotto c'è scritto **cosa arriva**: un permesso
// concesso senza sapere cosa aspettarsi si revoca alla terza notifica.
// Dove si riaccendono, con le parole del telefono che uno ha in mano.
function spiegaBlocco() {
  if (suAndroid()) {
    return 'Le hai bloccate per questo sito. Apri all41.vercel.app in Chrome, tocca l’icona a sinistra dell’indirizzo → Autorizzazioni → Notifiche → Consenti. Poi torna qui. ⚠️ Non è la voce «Notifiche» nelle informazioni dell’app: quella è un’altra cosa ed è già a posto.'
  }
  if (suIPhone()) {
    return 'Le hai bloccate. Impostazioni → Notifiche → All For One, e riaccendile.'
  }
  return 'Le hai bloccate per questo sito. Si riaccendono dalle impostazioni del browser, alla voce di questo indirizzo.'
}

export default function ChiediNotifiche({ membroId }) {
  // ⚠️ Lo stato e' «sono iscritto?», non «ho dato il permesso?».
  //
  // Confonderli aveva bloccato tutto: il permesso resta concesso per
  // sempre, quindi il tasto diceva «Spegni» anche a chi non era iscritto
  // per niente — e non c'era piu' nessun modo di iscriversi. Premere
  // Spegni non cambiava niente, perche' il permesso restava. Un vicolo
  // cieco, e senza nemmeno un messaggio che lo dicesse.
  const [stato, setStato] = useState('spente')
  const [inCorso, setInCorso] = useState(false)
  const [esito, setEsito] = useState(null)
  // La riga tecnica: compare solo quando qualcosa non va, e si fotografa.
  const [diagnostica, setDiagnostica] = useState(null)

  const rileggi = () => statoIscrizione().then(setStato)
  useEffect(() => {
    rileggi()
  }, [])

  if (!notifichePossibili()) {
    return (
      <p className="notifiche-nota">
        Questo browser non sa mandare notifiche. Su iPhone funzionano solo con l’app messa
        sulla schermata home.
      </p>
    )
  }

  async function accendi() {
    setInCorso(true)
    setEsito(null)
    try {
      const r = await iscriviti(membroId)
      await rileggi()
      if (!r.ok) setDiagnostica(await comeStaMesso())
      if (r.ok) {
        setEsito(null)
      } else if (r.motivo === 'database') {
        // Il messaggio del database per esteso: e' l'unico caso in cui il
        // problema sta da questa parte, e serve leggerlo.
        setEsito('Il database ha rifiutato: ' + (r.dettaglio ?? 'motivo sconosciuto'))
      } else if (r.motivo === 'denied') {
        // Lo stato si mette a mano e non si rilegge: `Notification.permission`
        // non sempre si aggiorna subito dopo un rifiuto, e la riga «Spente»
        // accanto a un messaggio che dice «bloccate» si contraddicono da
        // sole. È successo, e in una schermata così non ci si capisce più
        // niente.
        setStato('bloccate')
        setEsito(spiegaBlocco())
      } else {
        setEsito(MOTIVI[r.motivo] ?? `Non è andata (${r.motivo}).`)
      }
    } catch (e) {
      // ⚠️ Anche qui il motivo vero. Su iPhone `subscribe` fallisce con
      // messaggi precisi, e nasconderli vuol dire non poter capire niente
      // a distanza.
      setEsito(`Non è andata: ${e?.name ?? 'errore'} — ${e?.message ?? ''}`)
    } finally {
      setInCorso(false)
    }
  }

  async function spegni() {
    setInCorso(true)
    try {
      await disiscriviti()
      await rileggi()
      setEsito('Spente. Puoi riaccenderle da qui quando vuoi.')
    } catch {
      setEsito('Non è andata. Riprova.')
    } finally {
      setInCorso(false)
    }
  }

  return (
    <div className="notifiche">
      <div className="notifiche-testo">
        <strong>Fatti avvisare</strong>
        {/* Cosa arriva, prima di chiederlo. Chi accetta senza saperlo
            revoca alla terza notifica. */}
        <small>
          SOS e «si riparte» sempre. Messaggi e vocali: <strong>una notifica sola</strong> e
          poi più niente, finché non riapri.
        </small>
      </div>

      {stato === 'accese' ? (
        <button type="button" className="notifiche-tasto spento" onClick={spegni} disabled={inCorso}>
          {inCorso ? '…' : 'Spegni'}
        </button>
      ) : (
        <button type="button" className="notifiche-tasto" onClick={accendi} disabled={inCorso}>
          {inCorso ? '…' : 'Accendi'}
        </button>
      )}

      {/* Come sta messo adesso, detto in due parole. Un tasto da solo non
          basta: «Accendi» non dice se sei spento o se non hai mai
          provato. */}
      <p className="notifiche-stato">
        {stato === 'accese'
          ? '✓ Accese su questo telefono'
          : stato === 'bloccate'
            ? '✕ Bloccate dal telefono'
            : '○ Spente su questo telefono'}
      </p>

      {esito ? (
        <p className="notifiche-esito">{esito}</p>
      ) : stato === 'bloccate' ? (
        <p className="notifiche-esito">{spiegaBlocco()}</p>
      ) : null}

      {diagnostica && <p className="notifiche-diagnostica">{diagnostica}</p>}

      {/* ⚠️ Detto PRIMA di premere, e non dopo aver fallito: su iPhone
          fuori dall'app installata il permesso non si puo' nemmeno
          chiedere, il cartello non compare, e sembra che il tasto sia
          rotto. */}
      {suIPhone() && !installataSullaHome() ? (
        <p className="notifiche-esito">
          Sei nel browser, non nell’app. Su iPhone le notifiche funzionano solo dall’app
          messa sulla schermata home: tasto condividi, «Aggiungi a Home».
        </p>
      ) : suIPhone() ? (
        <p className="notifiche-nota">
          Su iPhone arrivano solo se hai messo l’app sulla schermata home.
        </p>
      ) : null}
    </div>
  )
}

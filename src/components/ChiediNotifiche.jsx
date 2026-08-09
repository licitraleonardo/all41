import { useEffect, useState } from 'react'
import './ChiediNotifiche.css'
import {
  disiscriviti,
  installataSullaHome,
  iscriviti,
  notifichePossibili,
  statoNotifiche,
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
  denied:
    'Le hai bloccate. Si riaccendono dalle impostazioni del telefono, alla voce di questo sito.',
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
export default function ChiediNotifiche({ membroId }) {
  const [stato, setStato] = useState('impossibile')
  const [inCorso, setInCorso] = useState(false)
  const [esito, setEsito] = useState(null)

  useEffect(() => setStato(statoNotifiche()), [])

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
      setStato(statoNotifiche())
      if (r.ok) {
        setEsito(null)
      } else if (r.motivo === 'database') {
        // Il messaggio del database per esteso: e' l'unico caso in cui il
        // problema sta da questa parte, e serve leggerlo.
        setEsito('Il database ha rifiutato: ' + (r.dettaglio ?? 'motivo sconosciuto'))
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
      setEsito('Spente. Il permesso resta, si riaccendono da qui.')
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

      {stato === 'granted' ? (
        <button type="button" className="notifiche-tasto spento" onClick={spegni} disabled={inCorso}>
          {inCorso ? '…' : 'Spegni'}
        </button>
      ) : (
        <button type="button" className="notifiche-tasto" onClick={accendi} disabled={inCorso}>
          {inCorso ? '…' : 'Accendi'}
        </button>
      )}

      {esito && <p className="notifiche-esito">{esito}</p>}

      {/* ⚠️ Detto PRIMA di premere, e non dopo aver fallito: su iPhone
          fuori dall'app installata il permesso non si puo' nemmeno
          chiedere, il cartello non compare, e sembra che il tasto sia
          rotto. */}
      {suIPhone() && !installataSullaHome() ? (
        <p className="notifiche-esito">
          Sei nel browser, non nell’app. Su iPhone le notifiche funzionano solo dall’app
          messa sulla schermata home: tasto condividi, «Aggiungi a Home».
        </p>
      ) : (
        <p className="notifiche-nota">
          Su iPhone arrivano solo se hai messo l’app sulla schermata home.
        </p>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import './ChiediNotifiche.css'
import { disiscriviti, iscriviti, notifichePossibili, statoNotifiche } from '../lib/notifiche.js'

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
      if (!r.ok && r.motivo === 'denied') {
        // Detto com'è: il tasto non può più fare niente, e insistere
        // sarebbe una bugia.
        setEsito('Le hai bloccate. Si riaccendono dalle impostazioni del telefono.')
      } else if (!r.ok) {
        setEsito('Non è andata. Riprova.')
      }
    } catch {
      setEsito('Non è andata. Riprova.')
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

      {/* ⚠️ Detto qui e non solo nel resoconto: su iPhone senza l'app
          sulla home non arriva niente, e chi non lo sa crede che sia
          rotta. */}
      <p className="notifiche-nota">
        Su iPhone arrivano solo se hai messo l’app sulla schermata home.
      </p>
    </div>
  )
}

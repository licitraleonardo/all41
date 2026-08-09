import { useState } from 'react'
import { useAltezzaBanner } from '../hooks/useAltezzaBanner.js'
import { oraDellaCopia } from '../hooks/useDatiVecchi.js'
import './StrisciaOffline.css'

// Senza rete l'app non è più vuota: mostra l'ultima cosa che aveva già
// scaricato. Questa striscia serve a dirlo — una classifica di ieri
// scambiata per quella di adesso è peggio di nessuna classifica.
//
// Dice anche che quello che scrivi non parte: è l'altra metà
// dell'informazione, e senza si prova tre volte prima di capirlo.
//
// ⚠️ E ci sono DUE modi di guardare roba vecchia, non uno.
//
// Il primo è l'aereo mode, e si vedeva già. Il secondo è quello comune in
// Sardegna: la rete c'è, `navigator.onLine` dice *sono online*, ma le
// letture non rispondono e sotto sotto l'app serve la copia. Lì non
// compariva niente, e la copia passava per roba di adesso.
//
// Sono due messaggi diversi perché le due situazioni chiedono due cose
// diverse: in aereo mode non ha senso riprovare, con una tacca sì.
export default function StrisciaOffline({ attiva, copia }) {
  const [riquadro, setRiquadro] = useState(null)
  const vecchi = !attiva && copia ? oraDellaCopia(copia.quando) : null
  useAltezzaBanner(riquadro, attiva || Boolean(vecchi))

  if (!attiva && !vecchi) return null

  return (
    <div
      className={attiva ? 'striscia-offline' : 'striscia-offline lenta'}
      role="status"
      ref={setRiquadro}
    >
      <span className="striscia-pallino" aria-hidden="true" />
      {attiva ? (
        <p className="striscia-testo">
          Niente rete.
          <span className="striscia-sotto">Roba vecchia, e quello che scrivi non parte.</span>
        </p>
      ) : (
        <p className="striscia-testo">
          Dati {vecchi}.
          <span className="striscia-sotto">La rete non risponde: si riprova da sola.</span>
        </p>
      )}
    </div>
  )
}

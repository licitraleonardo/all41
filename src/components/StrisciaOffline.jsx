import { useState } from 'react'
import { useAltezzaBanner } from '../hooks/useAltezzaBanner.js'
import './StrisciaOffline.css'

// Senza rete l'app non è più vuota: mostra l'ultima cosa che aveva già
// scaricato. Questa striscia serve a dirlo — una classifica di ieri
// scambiata per quella di adesso è peggio di nessuna classifica.
//
// Dice anche che quello che scrivi non parte: è l'altra metà
// dell'informazione, e senza si prova tre volte prima di capirlo.
export default function StrisciaOffline({ attiva }) {
  const [riquadro, setRiquadro] = useState(null)
  useAltezzaBanner(riquadro, attiva)

  if (!attiva) return null

  return (
    <div className="striscia-offline" role="status" ref={setRiquadro}>
      <span className="striscia-pallino" aria-hidden="true" />
      <p className="striscia-testo">
        Niente rete.
        <span className="striscia-sotto">
          Roba vecchia, e quello che scrivi non parte.
        </span>
      </p>
    </div>
  )
}

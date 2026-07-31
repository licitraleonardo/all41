import { useState } from 'react'
import { MOTIVI_SOS } from '../config/azioni.js'

// Testi piani, nessuna battuta, nessuna emoji decorativa: è l'unica
// funzione di sicurezza dell'app. Due tap per inviare, così non parte da
// solo in tasca, ma nessun limite e nessuna penalità, mai.
export default function FoglioSOS({ onInvia, onAnnulla, inCorso }) {
  const [motivo, setMotivo] = useState('')
  const [libero, setLibero] = useState('')

  const scelto = libero.trim() || motivo
  const puoInviare = scelto.length > 0 && !inCorso

  return (
    <div className="foglio-sfondo" role="dialog" aria-modal="true" aria-label="Richiesta di aiuto">
      <div className="foglio">
        <h2 className="foglio-titolo">Cosa succede?</h2>

        <div className="motivi">
          {MOTIVI_SOS.map((m) => (
            <button
              key={m}
              type="button"
              className={m === motivo && !libero.trim() ? 'motivo scelto' : 'motivo'}
              onClick={() => {
                setMotivo(m)
                setLibero('')
              }}
              aria-pressed={m === motivo && !libero.trim()}
            >
              {m}
            </button>
          ))}
        </div>

        <label className="campo">
          <span>Oppure scrivi</span>
          <input
            type="text"
            value={libero}
            onChange={(e) => setLibero(e.target.value)}
            maxLength={120}
            placeholder="Cosa serve"
          />
        </label>

        <button
          type="button"
          className="sos-conferma"
          onClick={() => onInvia(scelto)}
          disabled={!puoInviare}
        >
          {inCorso ? 'Invio…' : 'Manda la richiesta'}
        </button>

        <button type="button" className="secondario" onClick={onAnnulla}>
          Annulla
        </button>
      </div>
    </div>
  )
}

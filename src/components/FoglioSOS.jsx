import { useState } from 'react'
import { MOTIVI_SOS } from '../config/azioni.js'

// Testi piani, nessuna battuta, nessuna emoji decorativa: è l'unica
// funzione di sicurezza dell'app. Due tap per inviare, così non parte da
// solo in tasca, ma nessun limite e nessuna penalità, mai.
export default function FoglioSOS({ onInvia, onAnnulla, inCorso, errore }) {
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

        {/* L'errore sta QUI dentro, sopra il bottone, e non se ne va da
            solo. Prima finiva nell'avviso della barra di scrittura, che
            sta sotto il velo di questo foglio e si cancella dopo cinque
            secondi: chi chiedeva aiuto senza segnale vedeva il bottone
            tornare com'era e se ne andava convinto di aver chiamato.
            È l'unica funzione di sicurezza dell'app: qui un fallimento
            silenzioso è il difetto peggiore possibile. */}
        {errore && (
          <p className="sos-errore" role="alert">
            <strong>Non è partita.</strong> {errore}
            <span>Riprova, o chiama qualcuno al telefono.</span>
          </p>
        )}

        <button
          type="button"
          className="sos-conferma"
          onClick={() => onInvia(scelto)}
          disabled={!puoInviare}
        >
          {inCorso ? 'Invio…' : errore ? 'Riprova' : 'Manda la richiesta'}
        </button>

        <button type="button" className="secondario" onClick={onAnnulla}>
          Annulla
        </button>
      </div>
    </div>
  )
}

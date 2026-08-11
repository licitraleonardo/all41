import { useState } from 'react'
import './StrisciaSOS.css'
import { useAltezzaBanner } from '../hooks/useAltezzaBanner.js'

// Gli SOS aperti, inchiodati in cima finché qualcuno non dice che è
// rientrato.
//
// Prima l'SOS era una riga del feed come le altre, e il feed tiene trenta
// righe: quello delle 18 cadeva fuori entro un'ora di messaggi sulla
// cena, e chi apriva l'app alle 19 non lo vedeva proprio.
//
// ⚠️ E poi questa striscia stava **dentro la chat**, quindi la vedeva
// solo chi era già nel posto giusto. Adesso sta in `App`, sopra tutto, e
// chi legge gli SOS è `useSosAperti`: questo componente disegna e basta.
export default function StrisciaSOS({ aperti, nome, ioId, onRicevuto }) {
  const [inCorso, setInCorso] = useState(null)
  const [riquadro, setRiquadro] = useState(null)

  // Spinge giù il resto invece di coprirlo: sotto un SOS non deve
  // finire niente, e la misura è la stessa che usano gli altri banner.
  useAltezzaBanner(riquadro, aperti.length > 0)

  if (aperti.length === 0) return null

  async function ricevuto(sos) {
    setInCorso(sos.id)
    try {
      await onRicevuto(sos, nome(sos.autoreId))
    } finally {
      setInCorso(null)
    }
  }

  return (
    <div className="sos-aperti" ref={setRiquadro} role="alert">
      {aperti.map((a) => (
        <div key={a.id} className="sos-aperto">
          <div className="sos-aperto-testo">
            <strong>{nome(a.autoreId)}</strong> ha chiesto aiuto
            <span>{a.payload?.motivo ?? 'Serve una mano'}</span>
          </div>
          {/* ⚠️ «Ricevuto», non «Rientrato».
              «Rientrato» chiudeva il cartello a tutti, cancellava l'SOS
              dalla chat e non lasciava traccia: chi si era perso non
              sapeva se l'avesse visto qualcuno. Questo invece chiude il
              cartello **solo a chi lo preme** e lo scrive in chat.
              Sul proprio SOS dice «Chiudi»: non si riceve il proprio. */}
          <button
            type="button"
            className="sos-rientrato"
            onClick={() => ricevuto(a)}
            disabled={inCorso === a.id}
          >
            {inCorso === a.id ? '…' : a.autoreId === ioId ? 'Chiudi' : 'Ricevuto'}
          </button>
        </div>
      ))}
    </div>
  )
}

import { useState } from 'react'
import './BannerFeedback.css'
import { useAltezzaBanner } from '../hooks/useAltezzaBanner.js'

// «Com'è che va?» — il cartello che lo propone, ogni tanto.
//
// ⚠️ È l'ultimo della fila in `App.jsx`: sotto l'SOS, gli avvisi rapidi,
// le proposte, le sfide e il Testamento. Un feedback aspetta tutto — è
// l'unica cosa in cima che non ha nessuna fretta, e se copre qualcosa che
// ne ha, ha fatto danno.
//
// Due scelte e nessuna ×: «Scrivi» apre il foglio, «Dopo» lo rimanda di
// altri due giorni. Non c'è un «no, mai più»: chi preme Dopo tre volte ha
// già detto quello che pensa, e riproporlo ogni due giorni per cinque
// giorni di viaggio vuol dire al massimo due volte in tutto.
export default function BannerFeedback({ onScrivi, onDopo }) {
  const [riquadro, setRiquadro] = useState(null)
  useAltezzaBanner(riquadro, true)

  return (
    <div className="banner-feedback" role="region" aria-label="Com’è che va" ref={setRiquadro}>
      <div className="banner-dentro">
        <p className="banner-testo">
          <strong>Com’è che va?</strong>
          <span className="banner-motivo">Qualsiasi cosa non torni, o manchi. Anche una riga.</span>
        </p>

        <div className="banner-scelte">
          <button type="button" className="banner-si" onClick={onScrivi}>
            Scrivi
          </button>
          <button type="button" className="banner-dopo" onClick={onDopo}>
            Dopo
          </button>
        </div>
      </div>
    </div>
  )
}

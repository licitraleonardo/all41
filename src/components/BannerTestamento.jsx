import { useState } from 'react'
import './BannerTestamento.css'
import { useAltezzaBanner } from '../hooks/useAltezzaBanner.js'
import { etichetta } from '../config/leggi.js'

// "Una Legge nuova nel Testamento". Stesso meccanismo della sfida a
// dama: la notifica ti raggiunge dovunque, e toccandola ci arrivi
// davvero — con la voce già aperta, non su un elenco da spulciare.
//
// Serve perché la celebrazione coi coriandoli dura sei secondi e scatta
// solo alla prima scoperta del gruppo: se in quel momento avevi il
// telefono in tasca, di quella Legge restava solo un pallino in fondo a
// due sotto-schede.
export default function BannerTestamento({ leggi, onApri, onDopo }) {
  const [riquadro, setRiquadro] = useState(null)
  const prima = leggi[0]
  useAltezzaBanner(riquadro, prima)

  if (!prima) return null

  return (
    <div
      className="banner-testamento"
      role="region"
      aria-label="Testamento aggiornato"
      ref={setRiquadro}
    >
      <div className="banner-dentro">
        <p className="banner-testo">
          <strong>{etichetta(prima)}</strong> è entrata nel Testamento
          <span className="banner-motivo">
            {leggi.length > 1
              ? `E non è la sola: ce ne sono ${leggi.length} da leggere.`
              : 'Non l’hai ancora letta.'}
          </span>
        </p>

        <div className="banner-scelte">
          <button type="button" className="banner-si" onClick={() => onApri(prima.id)}>
            Leggila
          </button>
          <button type="button" className="banner-dopo" onClick={onDopo}>
            Dopo
          </button>
        </div>
      </div>
    </div>
  )
}

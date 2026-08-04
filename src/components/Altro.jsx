import { useState } from 'react'
import './Altro.css'
import Spese from './Spese.jsx'
import Documenti from './Documenti.jsx'

// Il quinto tab dello spec. Ci vive il materiale di consultazione: roba
// che serve in un momento preciso e poi non si guarda più, e che in
// "Oggi" occuperebbe spazio nella schermata più usata della giornata.
//
// Il tab si chiamava "Spese" finché conteneva solo quelle: un tab
// chiamato "Altro" con dentro una cosa sola non dice niente a nessuno.
// Adesso ne contiene due, quindi ha il nome dello spec. Mappa e Info
// entreranno qui.
const SCHEDE = [
  ['spese', 'Spese'],
  ['documenti', 'Documenti'],
]

export default function Altro({ membro }) {
  const [vista, setVista] = useState('spese')

  return (
    <div className="altro-schermo">
      <div className="segmenti" role="tablist">
        {SCHEDE.map(([id, etichetta]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={vista === id}
            className={vista === id ? 'segmento attivo' : 'segmento'}
            onClick={() => setVista(id)}
          >
            {etichetta}
          </button>
        ))}
      </div>

      {vista === 'spese' && <Spese membro={membro} senzaCornice />}
      {vista === 'documenti' && <Documenti membro={membro} />}
    </div>
  )
}

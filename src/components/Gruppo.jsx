import { useState } from 'react'
import './Gruppo.css'
import ChatRapida from './ChatRapida.jsx'
import Vocali from './Vocali.jsx'

// Il tab Gruppo, come lo vuole lo spec: la Chat Rapida e i Vocali come
// due sotto-schede in alto. Sono due modi di dire la stessa cosa — "dove
// siete", "arriviamo" — e uno dei due si sceglie in base a se hai le
// mani libere o no.
//
// Le schede stanno in cima e fisse: la chat sotto scorre da sola, e se
// scorressero insieme per cambiare scheda bisognerebbe risalire tutta la
// conversazione.
export default function Gruppo({ membro, suoniDisponibili }) {
  const [vista, setVista] = useState('chat')

  return (
    <div className="gruppo-schermo">
      <div className="segmenti gruppo-schede" role="tablist">
        {[
          ['chat', 'Chat'],
          ['vocali', 'Vocali'],
        ].map(([id, etichetta]) => (
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

      {vista === 'chat' && (
        <ChatRapida membro={membro} suoniDisponibili={suoniDisponibili} senzaCornice />
      )}
      {vista === 'vocali' && (
        <div className="gruppo-corpo">
          <Vocali membro={membro} />
        </div>
      )}
    </div>
  )
}

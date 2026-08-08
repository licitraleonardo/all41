import { useEffect } from 'react'
import './Gruppo.css'
import ChatRapida from './ChatRapida.jsx'
import Vocali from './Vocali.jsx'
import { useSchedaRicordata } from '../hooks/useSchedaRicordata.js'
import NuvolettaAllan from './NuvolettaAllan.jsx'

// Il tab Gruppo, come lo vuole lo spec: la Chat Rapida e i Vocali come
// due sotto-schede in alto. Sono due modi di dire la stessa cosa — "dove
// siete", "arriviamo" — e uno dei due si sceglie in base a se hai le
// mani libere o no.
//
// Le schede stanno in cima e fisse: la chat sotto scorre da sola, e se
// scorressero insieme per cambiare scheda bisognerebbe risalire tutta la
// conversazione.
export default function Gruppo({ membro, suoniDisponibili, nonLetto = {}, onVisto }) {
  const [vista, setVista] = useSchedaRicordata('scheda.gruppo', 'chat', ['chat', 'vocali'])

  // Si segna letto finché la scheda è aperta, non solo entrandoci: se
  // resti in chat mentre arrivano messaggi, il pallino non deve
  // accendersi alle tue spalle per roba che stai leggendo.
  useEffect(() => {
    onVisto?.(vista)
  }, [vista, onVisto, nonLetto.chat, nonLetto.vocali])

  return (
    <div className="gruppo-schermo">
      {/* La nuvoletta sta qui e non in App: lo stato della sotto-scheda
          vive qui dentro, e sollevarlo fino in cima avrebbe voluto dire
          farlo per tutti e quattro i contenitori. */}
      <NuvolettaAllan membroId={membro?.id} passo={vista === 'chat' ? 'gruppo' : 'gruppo.vocali'} />
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
            {nonLetto[id] && vista !== id && <span className="segmento-punto" />}
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

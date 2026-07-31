import { useState } from 'react'
import './Gioco.css'
import Classifica from './Classifica.jsx'
import Testamento from './Testamento.jsx'
import { useGioco } from '../hooks/useGioco.js'

export default function Gioco({ membro }) {
  const { classifica, eventi, scoperte, stato, errore } = useGioco()
  const [vista, setVista] = useState('classifica')

  const membri = Object.fromEntries(classifica.map((m) => [m.id, m]))

  return (
    <div className="gioco-schermo">
      {/* Sotto-schede in alto: pattern standard, non aggiunge profondità */}
      <div className="segmenti" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={vista === 'classifica'}
          className={vista === 'classifica' ? 'segmento attivo' : 'segmento'}
          onClick={() => setVista('classifica')}
        >
          Classifica
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={vista === 'testamento'}
          className={vista === 'testamento' ? 'segmento attivo' : 'segmento'}
          onClick={() => setVista('testamento')}
        >
          Il Testamento
        </button>
      </div>

      {stato === 'caricamento' && <p className="gioco-vuoto">Un attimo.</p>}
      {stato === 'guasto' && <p className="gioco-guasto">{errore}</p>}

      {stato === 'pronto' &&
        (vista === 'classifica' ? (
          <Classifica classifica={classifica} eventi={eventi} ioId={membro.id} />
        ) : (
          <Testamento scoperte={scoperte} membri={membri} />
        ))}
    </div>
  )
}

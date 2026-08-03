import { useState } from 'react'
import './Gioco.css'
import Classifica from './Classifica.jsx'
import Testamento from './Testamento.jsx'
import Proposta from './Proposta.jsx'
import PropostaInAttesa from './PropostaInAttesa.jsx'
import { useGioco } from '../hooks/useGioco.js'
import { creaProposta } from '../lib/proposte.js'
import { descriviErrore } from '../lib/errori.js'

export default function Gioco({ membro, proposteAperte = [], onVotaProposta }) {
  const { classifica, eventi, scoperte, stato, errore, ricarica } = useGioco()
  const [vista, setVista] = useState('classifica')
  const [inCorso, setInCorso] = useState(false)
  const [erroreProposta, setErroreProposta] = useState(null)

  const membri = Object.fromEntries(classifica.map((m) => [m.id, m]))

  async function crea(dati) {
    setInCorso(true)
    setErroreProposta(null)
    try {
      await creaProposta({ proponenteId: membro.id, ...dati })
      await ricarica()
      setVista('classifica')
    } catch (e) {
      setErroreProposta(descriviErrore(e))
    } finally {
      setInCorso(false)
    }
  }

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
        <button
          type="button"
          role="tab"
          aria-selected={vista === 'proposta'}
          className={vista === 'proposta' ? 'segmento attivo' : 'segmento'}
          onClick={() => setVista('proposta')}
        >
          Proponi
        </button>
      </div>

      {stato === 'caricamento' && <p className="gioco-vuoto">Un attimo.</p>}
      {stato === 'guasto' && <p className="gioco-guasto">{errore}</p>}

      {stato === 'pronto' && vista === 'classifica' && (
        <Classifica classifica={classifica} eventi={eventi} ioId={membro.id} />
      )}
      {stato === 'pronto' && vista === 'testamento' && (
        <Testamento scoperte={scoperte} membri={membri} />
      )}
      {stato === 'pronto' && vista === 'proposta' && (
        <>
          {/* Anche quelle rimandate col "voto dopo": è qui che si
              ritrovano, ed è il motivo per cui quel bottone si può
              premere senza sensi di colpa. */}
          {proposteAperte.length > 0 && (
            <div className="gioco-corpo">
              <h3 className="sezione">Aperte adesso</h3>
              <ul className="attese">
                {proposteAperte.map((p) => (
                  <PropostaInAttesa
                    key={p.votoId}
                    proposta={p}
                    membri={membri}
                    ioId={membro.id}
                    onVota={onVotaProposta}
                  />
                ))}
              </ul>
            </div>
          )}

          <Proposta
            membri={classifica}
            ioId={membro.id}
            onCrea={crea}
            onAnnulla={() => setVista('classifica')}
            inCorso={inCorso}
            errore={erroreProposta}
          />
        </>
      )}
    </div>
  )
}

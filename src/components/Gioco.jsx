import { useState } from 'react'
import './Gioco.css'
import Classifica from './Classifica.jsx'
import Testamento from './Testamento.jsx'
import Pecora from './Pecora.jsx'
import Impostore from './Impostore.jsx'
import Guida, { guidaGiaChiusa } from './Guida.jsx'
import { useGioco } from '../hooks/useGioco.js'
import { creaProposta } from '../lib/proposte.js'
import { descriviErrore } from '../lib/errori.js'
import Rotella from './Rotella.jsx'

// Tre schede, non quattro: "Proponi" non era una sezione, era un gesto —
// e adesso vive dove ha senso, toccando qualcuno nella classifica.
const SCHEDE = [
  ['classifica', 'Classifica'],
  ['testamento', 'Testamento'],
  ['impostore', 'Impostore'],
  ['pecora', 'All'],
]

export default function Gioco({ membro, proposteAperte = [], onVotaProposta }) {
  const { classifica, eventi, scoperte, stato, errore, ricarica } = useGioco()
  const [vista, setVista] = useState('classifica')
  const [inCorso, setInCorso] = useState(false)
  const [erroreProposta, setErroreProposta] = useState(null)
  const [guidaVia, setGuidaVia] = useState(guidaGiaChiusa)

  const membri = Object.fromEntries(classifica.map((m) => [m.id, m]))

  async function crea(dati) {
    setInCorso(true)
    setErroreProposta(null)
    try {
      const esito = await creaProposta({ proponenteId: membro.id, ...dati })
      // Il limite giornaliero non è un errore, è una risposta: si dice e
      // il foglio resta aperto.
      if (!esito.ok) {
        setErroreProposta(`Tre proposte al giorno. Le hai finite: riprova domani.`)
        return { ok: false }
      }
      await ricarica()
      return esito
    } catch (e) {
      setErroreProposta(descriviErrore(e))
      return { ok: false }
    } finally {
      setInCorso(false)
    }
  }

  return (
    <div className="gioco-schermo">
      {/* In cima e richiudibile, come dice lo spec: un tutorial che
          sbarra l'ingresso viene saltato senza leggerlo. Una volta tolta
          resta in Altro, che è dove si va a cercarla. */}
      {!guidaVia && <Guida compatta onChiudi={() => setGuidaVia(true)} />}

      {/* Sotto-schede in alto: pattern standard, non aggiunge profondità */}
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

      {/* Fuori dal blocco che aspetta i dati: il gioco è tutto locale e
          si apre anche se il database non risponde. */}
      {vista === 'pecora' && <Pecora membroId={membro.id} />}

      {vista !== 'pecora' && stato === 'caricamento' && (
        <Rotella />
      )}
      {vista !== 'pecora' && stato === 'guasto' && (
        <p className="gioco-guasto">{errore}</p>
      )}

      {stato === 'pronto' && vista === 'classifica' && (
        <Classifica
          classifica={classifica}
          eventi={eventi}
          ioId={membro.id}
          proposteAperte={proposteAperte}
          onVotaProposta={onVotaProposta}
          onCrea={crea}
          inCorso={inCorso}
          errore={erroreProposta}
        />
      )}

      {stato === 'pronto' && vista === 'testamento' && (
        <Testamento scoperte={scoperte} membri={membri} />
      )}

      {stato === 'pronto' && vista === 'impostore' && (
        <Impostore membro={membro} membri={membri} />
      )}
    </div>
  )
}

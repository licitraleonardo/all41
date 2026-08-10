import { useEffect, useState } from 'react'
import './Gioco.css'
import { useSchedaRicordata } from '../hooks/useSchedaRicordata.js'
import NuvolettaAllan from './NuvolettaAllan.jsx'
import Allbo from './Allbo.jsx'
import Testamento from './Testamento.jsx'
import Pecora from './Pecora.jsx'
import Impostore from './Impostore.jsx'
import Dama from './Dama.jsx'
import { useGioco } from '../hooks/useGioco.js'
import { creaProposta } from '../lib/proposte.js'
import { descriviErrore } from '../lib/errori.js'
import Rotella from './Rotella.jsx'

// Tre schede, non quattro: "Proponi" non era una sezione, era un gesto —
// e adesso vive dove ha senso, toccando qualcuno nella classifica.
// ⚠️ Cinque, non sei. La Classifica e le statistiche sono due modi di
// guardare la stessa cosa -- quanti punti ha chi -- e sono finite sotto
// un tetto solo, «Allbo»: ALL41 piu' albo. A 375 px sei pillole si
// scorrevano, cinque ci stanno quasi tutte.
const SCHEDE = [
  ['allbo', 'Allbo'],
  ['testamento', 'Testamento'],
  ['impostore', 'Impostore'],
  ['dama', 'Dama'],
  ['pecora', 'All'],
]

export default function Gioco({ membro, proposteAperte = [], onVotaProposta, nonLetto = {}, onVisto, conteggiMvp = {}, damaDaAprire, onDamaAperta, leggeDaAprire, onLeggeAperta }) {
  const { classifica, eventi, diOggi, scoperte, stato, errore, ricarica } = useGioco()
  const [vista, setVista] = useSchedaRicordata(
    'scheda.gioco',
    'allbo',
    SCHEDE.map(([id]) => id)
  )
  const [inCorso, setInCorso] = useState(false)
  const [erroreProposta, setErroreProposta] = useState(null)

  // Il Testamento si segna letto mentre lo guardi, come le schede del
  // Gruppo: se una Legge si sblocca mentre sei lì, l'hai vista.
  useEffect(() => {
    if (vista === 'testamento') onVisto?.('testamento')
  }, [vista, onVisto, nonLetto.testamento])

  const membri = Object.fromEntries(classifica.map((m) => [m.id, m]))

  async function crea(dati) {
    setInCorso(true)
    setErroreProposta(null)
    try {
      const esito = await creaProposta({ proponenteId: membro.id, ...dati })
      // Il limite giornaliero non è un errore, è una risposta: si dice e
      // il foglio resta aperto. Il "ne hai già una in voto" invece non è
      // un rifiuto definitivo — lo gestisce la Classifica col suo
      // suggerimento — quindi passa di qui senza messaggio d'errore.
      if (!esito.ok) {
        if (esito.motivo === 'in-voto') return esito
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
      {/* Una per sotto-scheda: qui dentro ce ne sono cinque, e ognuna è
          una cosa diversa. Un solo messaggio per tutto il tab non
          spiegava né la Dama né l'Impostore. */}
      <NuvolettaAllan membroId={membro?.id} passo={`gioco.${vista}`} />

      {/* La guida non sta più qui. Una card in cima alla schermata più
          usata del tab era troppo invadente: adesso Allan dice due righe
          la prima volta che entri, e la guida intera vive in Info. */}
      {/* Sotto-schede in alto: pattern standard, non aggiunge profondità */}
      <div className="segmenti scorrevoli" role="tablist">
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
            {id === 'testamento' && nonLetto.testamento && vista !== id && (
              <span className="segmento-punto" />
            )}
          </button>
        ))}
      </div>

      {/* Fuori dal blocco che aspetta i dati: il gioco è tutto locale e
          si apre anche se il database non risponde. */}
      {vista === 'pecora' && <Pecora membroId={membro.id} />}

      {/* L'attesa e il guasto se li tiene l'Allbo: dentro ha due schede,
          e le statistiche non devono aspettare la lettura della
          classifica per comparire. */}
      {vista === 'allbo' && (
        <Allbo
          membro={membro}
          classifica={classifica}
          eventi={eventi}
          diOggi={diOggi}
          stato={stato}
          errore={errore}
          proposteAperte={proposteAperte}
          onVotaProposta={onVotaProposta}
          onCrea={crea}
          inCorso={inCorso}
          erroreProposta={erroreProposta}
          conteggiMvp={conteggiMvp}
        />
      )}

      {vista !== 'pecora' && vista !== 'allbo' && stato === 'caricamento' && <Rotella />}
      {vista !== 'pecora' && vista !== 'allbo' && stato === 'guasto' && (
        <p className="gioco-guasto">{errore}</p>
      )}

      {stato === 'pronto' && vista === 'testamento' && (
        <Testamento
          scoperte={scoperte}
          membri={membri}
          ioId={membro.id}
          apriLegge={leggeDaAprire}
          onLeggeAperta={onLeggeAperta}
        />
      )}

      {stato === 'pronto' && vista === 'impostore' && (
        <Impostore membro={membro} membri={membri} />
      )}

      {stato === 'pronto' && vista === 'dama' && (
        <Dama
          membro={membro}
          membri={membri}
          apriPartita={damaDaAprire}
          onAperta={onDamaAperta}
        />
      )}
    </div>
  )
}

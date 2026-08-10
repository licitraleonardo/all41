import Classifica from './Classifica.jsx'
import Statistiche from './Statistiche.jsx'
import Rotella from './Rotella.jsx'
import { useSchedaRicordata } from '../hooks/useSchedaRicordata.js'

// ALL41 + albo: la classifica e le statistiche sotto un tetto solo.
//
// Sono due modi di guardare la stessa cosa — quanti punti ha chi, e come
// se li è fatti — e stavano come due segmenti lontani in una fila che a
// 375 px si scorreva. Il Gioco torna da sei voci a cinque, che a quella
// larghezza ci stanno quasi tutte senza trascinare.
//
// ⚠️ Terzo livello di schede, come il Cassetto, e per la stessa ragione
// usa `.segmenti.minori`: due livelli disegnati uguale sarebbero due file
// di pillole identiche una sopra l'altra, e non si capirebbe quale sta
// dentro quale.
const SCHEDE = [
  ['classifica', 'Classifica'],
  ['stat', 'Stat.'],
]

export default function Allbo({
  membro,
  classifica,
  eventi,
  diOggi,
  stato,
  errore,
  proposteAperte,
  onVotaProposta,
  onCrea,
  inCorso,
  erroreProposta,
  conteggiMvp,
}) {
  const [vista, setVista] = useSchedaRicordata(
    'scheda.allbo',
    'classifica',
    SCHEDE.map(([id]) => id)
  )

  return (
    <div className="allbo">
      <div className="segmenti minori" role="tablist">
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

      {/* Le statistiche hanno letture e rotella loro: non aspettano
          quelle della classifica, come non le aspettavano prima. */}
      {vista === 'stat' && <Statistiche membro={membro} />}

      {vista === 'classifica' && stato === 'caricamento' && <Rotella />}
      {vista === 'classifica' && stato === 'guasto' && <p className="gioco-guasto">{errore}</p>}
      {vista === 'classifica' && stato === 'pronto' && (
        <Classifica
          classifica={classifica}
          eventi={eventi}
          diOggi={diOggi}
          ioId={membro.id}
          proposteAperte={proposteAperte}
          onVotaProposta={onVotaProposta}
          onCrea={onCrea}
          inCorso={inCorso}
          errore={erroreProposta}
          conteggiMvp={conteggiMvp}
        />
      )}
    </div>
  )
}

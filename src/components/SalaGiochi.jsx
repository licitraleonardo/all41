import Impostore from './Impostore.jsx'
import Dama from './Dama.jsx'
import Pecora from './Pecora.jsx'
import Rotella from './Rotella.jsx'
import Pellicola from './Pellicola.jsx'
import { useSchedaRicordata } from '../hooks/useSchedaRicordata.js'
import { giocoCoperto } from '../config/rilascio.js'

// I tre giochi, sotto un tetto solo.
//
// Stavano in fila con Allbo e Testamento — cinque voci — e non erano la
// stessa cosa: Allbo e Testamento si **guardano**, questi si **giocano**.
// Mescolarli faceva una fila lunga di cose diverse, e a 375 px si
// scorreva.
//
// ⚠️ Terzo livello di schede come il Cassetto e l'Allbo, e per la stessa
// ragione usa `.segmenti.minori`: due file disegnate uguale, una sopra
// l'altra, non dicono quale sta dentro quale.
//
// ⚠️ Qui NON si ripete lo sbaglio del Cassetto — quello della riga che
// spariva scorrendo — e non per attenzione ma per un fatto: nel Gioco
// nessuna fila è appiccicata in cima, quindi non c'è niente sotto cui
// scivolare. Se un giorno la fila del Gioco diventasse `sticky`, questa
// riga qui va appiccicata subito sotto, o sparirà.
const SCHEDE = [
  ['impostore', 'Impostore'],
  ['dama', 'Dama'],
  ['pecora', 'All'],
]

export default function SalaGiochi({ membro, membri, stato, errore, damaDaAprire, onDamaAperta }) {
  // ⚠️ Si entra sulla Dama, non sull'Impostore, finché l'Impostore è
  // coperto: aprire una stanza atterrando sull'unica porta chiusa fa
  // sembrare chiusa tutta la stanza.
  const [vista, setVista] = useSchedaRicordata(
    'scheda.sala',
    'dama',
    SCHEDE.map(([id]) => id)
  )

  // ⚠️ Una guardia sola, e sta **qui sopra** al resto del render.
  //
  // La copertura è tornata a essere per gioco — l'Impostore chiuso, gli
  // altri aperti — e questo è esattamente il punto in cui la volta
  // scorsa erano nate sei condizioni sparse, una per riga di render, con
  // sei modi di dimenticarsene aggiungendo un gioco. Non si ripete: la
  // domanda si fa una volta, e se la risposta è sì **sotto non viene
  // costruito niente**. Chi aggiunge un gioco lo mette in `SCHEDE` e, se
  // va coperto, in `GIOCHI_COPERTI`: due elenchi, nessuna condizione.
  const coperto = giocoCoperto(vista)
  const etichetta = SCHEDE.find(([id]) => id === vista)?.[1] ?? vista

  return (
    <div className="sala-giochi">
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

      {coperto && <Pellicola nome={etichetta} />}

      {!coperto && (
        <>
          {/* All è tutto locale: si apre anche se il database non
              risponde, e non aspetta la lettura della classifica. */}
          {vista === 'pecora' && <Pecora membroId={membro.id} />}

          {vista !== 'pecora' && stato === 'caricamento' && <Rotella />}
          {vista !== 'pecora' && stato === 'guasto' && (
            <p className="gioco-guasto">{errore}</p>
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
        </>
      )}
    </div>
  )
}

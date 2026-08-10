import Spese from './Spese.jsx'
import Documenti from './Documenti.jsx'
import { useSchedaRicordata } from '../hooks/useSchedaRicordata.js'

// Le carte del viaggio: i conti e i documenti.
//
// ⚠️ Stavano in «Altro», il magazzino, insieme a mappa, statistiche,
// guida e info — sei cose senza niente in comune tranne il non stare
// altrove. Queste due invece stanno insieme davvero: sono quello che uno
// tiene in tasca quando parte, e si cercano dove sta il gruppo.
//
// ⚠️ È il terzo livello di schede dell'app — tab → Cassetto → Spese —
// e per questo le sue usano `.segmenti.minori`, le pillole leggere che
// esistono già in Gioco.css. Due livelli disegnati uguale sarebbero due
// righe di bottoni identiche una sopra l'altra, e nessuno capirebbe
// quale sta dentro quale.
const SCHEDE = [
  ['spese', 'Spese'],
  ['documenti', 'Documenti'],
]

export default function Cassetto({ membro }) {
  const [vista, setVista] = useSchedaRicordata(
    'scheda.cassetto',
    'spese',
    SCHEDE.map(([id]) => id)
  )

  return (
    <div className="cassetto">
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

      {vista === 'spese' && <Spese membro={membro} senzaCornice />}
      {vista === 'documenti' && <Documenti membro={membro} />}
    </div>
  )
}

import { LEGGI, numeroRomano } from '../config/leggi.js'

// Il codice delle Leggi scoperte. Continua di proposito il tono
// legislativo: qui Allan non parla, custodisce e basta.
export default function Testamento({ scoperte, membri }) {
  const rivelata = (l) => l.pubblica || Boolean(scoperte[l.id])
  const quante = LEGGI.filter(rivelata).length
  const quota = Math.round((quante / LEGGI.length) * 100)

  return (
    <div className="gioco-corpo">
      <header className="testamento-testata">
        <h2 className="testamento-titolo">Testamento</h2>
        <p className="testamento-custode">Custodito da Allan</p>

        <p className="testamento-conto">
          Scoperte: <strong>{quante}</strong> / {LEGGI.length}
        </p>
        <div className="barra-scoperte" role="presentation">
          <span style={{ width: `${quota}%` }} />
        </div>
      </header>

      <ol className="leggi">
        {LEGGI.map((l) => {
          const scoperta = scoperte[l.id]
          if (!rivelata(l)) {
            return (
              <li key={l.id} className="legge oscurata">
                <span className="legge-numero">Legge {numeroRomano(l.n)}</span>
                <span className="legge-buio" aria-label="non ancora scoperta">
                  ███████████
                </span>
              </li>
            )
          }

          return (
            <li key={l.id} className="legge">
              <span className="legge-numero">Legge {numeroRomano(l.n)}</span>
              <p className="legge-testo">{l.testo}</p>
              <span className="legge-punti">{punti(l.punti)}</span>
              {scoperta && (
                <span className="legge-scoperta">
                  scoperta da {membri[scoperta.chi]?.nome ?? 'qualcuno'},{' '}
                  {giorno(scoperta.quando)}
                </span>
              )}
              {l.pubblica && !scoperta && <span className="legge-scoperta">nota a tutti</span>}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function punti(p) {
  if (typeof p !== 'number') return p
  return p > 0 ? `+${p}` : String(p)
}

function giorno(iso) {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })
}

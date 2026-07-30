import { useEffect, useState } from 'react'
import { giornoDellaSettimana } from '../lib/giorni.js'

export default function Giorno({ giorno, oggi, ref }) {
  const [aperto, setAperto] = useState(oggi)

  // Se scatta la mezzanotte con l'app aperta, il giorno che diventa "oggi"
  // apre le sue curiosità. Non ne chiude nessuna: quello che hai aperto a
  // mano resta aperto.
  useEffect(() => {
    if (oggi) setAperto(true)
  }, [oggi])
  const haCuriosita = Boolean(giorno.daSapere || giorno.daProvare)

  return (
    <article ref={ref} className={oggi ? 'day oggi' : 'day'} data-tone={giorno.tono}>
      <div className="day-marker">{giorno.giorno}</div>

      <div className="day-card">
        <div className="day-date">
          {giornoDellaSettimana(giorno.data)}
          {oggi && <span className="badge oggi-badge">oggi</span>}
        </div>

        <h2 className="day-title">
          {giorno.titolo}
          {giorno.badge && <span className="badge confermato">{giorno.badge}</span>}
        </h2>

        {giorno.tappe.map((tappa, i) => (
          <div className="step" key={i}>
            <div className="step-time">{tappa.ora}</div>
            <div className="step-body">
              <p className="label">
                {tappa.cosa}
                {tappa.maps && (
                  <a
                    className="maps-link"
                    href={tappa.maps}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📍 Maps
                  </a>
                )}
              </p>
              {tappa.note?.map((n, j) => (
                <span className={`meta ${n.tipo}`} key={j}>
                  {n.testo}
                </span>
              ))}
            </div>
          </div>
        ))}

        {haCuriosita && (
          <>
            <button
              type="button"
              className="apri-curiosita"
              onClick={() => setAperto(!aperto)}
              aria-expanded={aperto}
            >
              <span>{aperto ? 'Nascondi' : 'Da sapere e da provare'}</span>
              <span className={aperto ? 'freccia su' : 'freccia'} aria-hidden="true">
                ▾
              </span>
            </button>

            {aperto && (
              <div className="curiosita">
                {giorno.daSapere && (
                  <div className="callout">
                    <strong>Da sapere</strong>
                    {giorno.daSapere}
                  </div>
                )}
                {giorno.daProvare && (
                  <div className="callout provare">
                    <strong>Da provare</strong>
                    {giorno.daProvare}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </article>
  )
}

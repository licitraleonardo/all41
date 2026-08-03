import { useEffect, useState } from 'react'
import { condizione, METEO } from '../config/meteo.js'
import { leggiMeteo } from '../lib/meteo.js'
import { GIORNI } from '../config/itinerario.js'

// Il meteo della tappa di oggi e di domani. Se la chiamata fallisce la
// riga sparisce e basta: il meteo non è mai un motivo per rompere la
// schermata principale.
export default function Meteo({ dataOggi }) {
  const [previsioni, setPrevisioni] = useState(null)

  const oggi = GIORNI.find((g) => g.data === dataOggi)
  const domani = oggi ? GIORNI[GIORNI.indexOf(oggi) + 1] : null
  const tappe = [oggi, domani].filter(Boolean)

  useEffect(() => {
    if (tappe.length === 0) return
    let vivo = true
    leggiMeteo(tappe)
      .then((p) => vivo && setPrevisioni(p))
      .catch(() => {})
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataOggi])

  if (tappe.length === 0 || !previsioni) return null

  const righe = tappe
    .map((t, i) => ({ tappa: t, quando: i === 0 ? 'Oggi' : 'Domani', p: previsioni[t.data] }))
    .filter((r) => r.p)

  if (righe.length === 0) return null

  return (
    <div className="meteo">
      {righe.map(({ tappa, quando, p }) => {
        const c = condizione(p.codice)
        const ventoso = p.vento >= METEO.ventoForte

        return (
          <div className="meteo-riga" key={tappa.data}>
            <span className="meteo-quando">{quando}</span>
            <span className="meteo-dove">{tappa.coordinate.dove}</span>
            <span className="meteo-cond" title={c.testo}>
              {c.icona} {p.gradi}°
            </span>
            <span className={ventoso ? 'meteo-vento forte' : 'meteo-vento'}>
              {p.vento} km/h
            </span>
          </div>
        )
      })}

      {righe.some((r) => r.p.vento >= METEO.ventoForte) && (
        <p className="meteo-avviso">
          Vento sopra i {METEO.ventoForte} km/h. In barca si sente.
        </p>
      )}
    </div>
  )
}

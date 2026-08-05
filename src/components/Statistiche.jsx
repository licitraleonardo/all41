import { useState } from 'react'
import './Statistiche.css'
import Rotella from './Rotella.jsx'
import { useStatistiche } from '../hooks/useStatistiche.js'
import { VOCI, classificaPerVoce, dovePrimeggia } from '../lib/statistiche.js'
import { coloreNome } from '../config/avatar.js'

// Chi ha fatto cosa. Prima era una tabella di sette colonne per undici
// persone: tutti i numeri c'erano e non se ne leggeva nessuno.
//
// Adesso una cosa per volta — la tua scheda in cima, poi una classifica a
// barre per categoria. Le barre si capiscono di sfuggita, i numeri no.
export default function Statistiche({ membro }) {
  const { righe, premi, stato, errore } = useStatistiche(true)
  const [aperta, setAperta] = useState(VOCI[0].id)

  if (stato === 'caricamento') return <Rotella />
  if (stato === 'guasto') return <p className="stat-guasto">{errore}</p>
  if (righe.length === 0) return <p className="stat-vuoto">Ancora nessun numero.</p>

  const mia = righe.find((r) => r.id === membro?.id)
  const forte = membro ? dovePrimeggia(righe, membro.id) : []
  const classifica = classificaPerVoce(righe, aperta)
  const voceAperta = VOCI.find((v) => v.id === aperta)

  return (
    <div className="statistiche">
      {mia && (
        <section className="stat-tua">
          <p className="stat-tua-titolo">Il tuo viaggio, per ora</p>
          <div className="stat-tua-numeri">
            {VOCI.map((v) => (
              <div key={v.id} className="stat-tua-voce">
                <span className="stat-tua-valore">{mia[v.id]}</span>
                <span className="stat-tua-nome">
                  <span aria-hidden="true">{v.icona}</span> {v.nome}
                </span>
              </div>
            ))}
          </div>

          {forte.length > 0 && (
            <p className="stat-tua-forte">
              Vai meglio in{' '}
              {forte.map((f, i) => (
                <span key={f.voce.id}>
                  {i > 0 && ', '}
                  <strong>{f.voce.nome.toLowerCase()}</strong> ({f.posto}º su {f.su})
                </span>
              ))}
              .
            </p>
          )}
        </section>
      )}

      {premi.length > 0 && (
        <>
          <p className="stat-etichetta">I titoli</p>
          <ul className="stat-premi">
            {premi.map((p) => (
              <li key={p.voce} className="stat-premio">
                <span className="stat-premio-titolo">{p.titolo}</span>
                <span className="stat-premio-chi" style={{ color: coloreNome(p.id) }}>
                  {p.id === membro?.id ? 'Tu' : p.nome}
                </span>
                <span className="stat-premio-quanto">{p.valore}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="stat-etichetta">Uno per volta</p>

      {/* Una categoria alla volta: sette classifiche tutte insieme sono
          di nuovo il tabellone di prima, solo più lungo. */}
      <div className="stat-scelta" role="tablist">
        {VOCI.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={aperta === v.id}
            className={aperta === v.id ? 'stat-chip acceso' : 'stat-chip'}
            onClick={() => setAperta(v.id)}
          >
            <span aria-hidden="true">{v.icona}</span> {v.nome}
          </button>
        ))}
      </div>

      <ol className="stat-barre">
        {classifica.map((r, i) => (
          <li
            key={r.id}
            className={r.id === membro?.id ? 'stat-barra io' : 'stat-barra'}
          >
            <span className="stat-barra-posto">{i + 1}</span>
            <span className="stat-barra-nome" style={{ color: coloreNome(r.id) }}>
              {r.id === membro?.id ? 'Tu' : r.nome}
            </span>
            <span className="stat-barra-pista">
              <span
                className="stat-barra-riempi"
                style={{
                  width: `${Math.round(r.quota * 100)}%`,
                  background: coloreNome(r.id),
                }}
              />
            </span>
            <span
              className={r.valore < 0 ? 'stat-barra-valore sottozero' : 'stat-barra-valore'}
            >
              {r.valore}
            </span>
          </li>
        ))}
      </ol>

      <p className="stat-nota">
        {voceAperta.nome} di tutti, dal primo all’ultimo. Si contano da soli da quello
        che fate: nessuno tiene un registro a parte — a parte Allan, ovviamente.
      </p>
    </div>
  )
}

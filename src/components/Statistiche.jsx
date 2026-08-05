import './Statistiche.css'
import Rotella from './Rotella.jsx'
import { useStatistiche } from '../hooks/useStatistiche.js'
import { VOCI } from '../lib/statistiche.js'
import { coloreNome, urlAvatar } from '../config/avatar.js'

// Chi ha fatto cosa. I titoli in cima perché sono la parte che si legge —
// con otto persone e sette colonne, la tabella da sola non dice niente a
// colpo d'occhio, e sotto ci si arriva solo se si è curiosi davvero.
export default function Statistiche({ membro }) {
  const { righe, premi, stato, errore } = useStatistiche(true)

  if (stato === 'caricamento') return <Rotella />
  if (stato === 'guasto') return <p className="stat-guasto">{errore}</p>

  const membri = Object.fromEntries(righe.map((r) => [r.id, r]))

  return (
    <div className="statistiche">
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

      <p className="stat-etichetta">Tutti i numeri</p>

      {/* La tabella scorre di lato da sola: sette colonne su un telefono
          non ci stanno, e stringerle fino a farcele stare le renderebbe
          illeggibili. */}
      <div className="stat-scorrevole">
        <table className="stat-tabella">
          <thead>
            <tr>
              <th scope="col">Chi</th>
              {VOCI.map((v) => (
                <th key={v.id} scope="col" title={v.nome}>
                  <span aria-hidden="true">{v.icona}</span>
                  <span className="stat-solo-lettori">{v.nome}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {righe.map((r) => (
              <tr key={r.id} className={r.id === membro?.id ? 'stat-io' : undefined}>
                <th scope="row">
                  <img
                    src={urlAvatar(membri[r.id]?.avatarStyle, r.nome)}
                    alt=""
                    width="22"
                    height="22"
                  />
                  <span style={{ color: coloreNome(r.id) }}>{r.nome}</span>
                </th>
                {VOCI.map((v) => (
                  <td key={v.id}>{r[v.id]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="stat-nota">
        Si contano da soli da quello che fate. Nessuno tiene un registro a parte —
        a parte Allan, ovviamente.
      </p>
    </div>
  )
}

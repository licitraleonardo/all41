import { urlAvatar } from '../config/avatar.js'
import { dataDiOggi, statoDelViaggio } from '../lib/giorni.js'
import { magliaNeraDelGiorno, mvpDelGiorno, saldiDelGiorno } from '../lib/classifica.js'

export default function Classifica({ classifica, eventi, ioId }) {
  const oggi = dataDiOggi()
  const saldi = saldiDelGiorno(eventi, oggi)
  const mvp = mvpDelGiorno(saldi)
  const magliaNera = magliaNeraDelGiorno(saldi)
  const finito = statoDelViaggio(oggi) === 'dopo'

  const perId = Object.fromEntries(classifica.map((m) => [m.id, m]))
  const nome = (id) => perId[id]?.nome ?? 'Qualcuno'

  const inAttesa = eventi.filter((e) => e.stato === 'pending')

  return (
    <div className="gioco-corpo">
      <div className="titoli">
        <div className="titolo-card mvp">
          <span className="titolo-etichetta">👑 MVP di oggi</span>
          <span className="titolo-nome">
            {mvp ? `${nome(mvp.membroId)} (+${mvp.saldo})` : 'Ancora nessuno.'}
          </span>
        </div>

        <div className="titolo-card nera">
          <span className="titolo-etichetta">🏴 Maglia Nera</span>
          <span className="titolo-nome">
            {magliaNera
              ? `${nome(magliaNera.membroId)} (${magliaNera.saldo})`
              : 'Giornata senza colpevoli.'}
          </span>
        </div>
      </div>

      <ol className="classifica">
        {classifica.map((m, i) => (
          <li key={m.id} className={m.id === ioId ? 'riga io' : 'riga'}>
            <span className="posto">{i + 1}</span>
            <img
              className="riga-avatar"
              src={urlAvatar(m.avatarStyle, m.avatarSeed)}
              alt=""
              width="34"
              height="34"
            />
            <span className="riga-nome">
              {m.nome}
              {finito && i === 0 && <span className="corona"> 👑</span>}
              {finito && i === classifica.length - 1 && classifica.length > 1 && (
                <span className="corona"> 🏴</span>
              )}
            </span>
            <span className={m.punteggio < 0 ? 'riga-punti sotto' : 'riga-punti'}>
              {m.punteggio}
            </span>
          </li>
        ))}
      </ol>

      {inAttesa.length > 0 && (
        <>
          <h3 className="sezione">In attesa di voto</h3>
          <ul className="storico">
            {inAttesa.map((e) => (
              <li key={e.id}>
                <span className="storico-punti attesa">{segno(e.punti)}</span>
                <span className="storico-motivo">
                  <strong>{nome(e.membroId)}</strong> — {e.motivo}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <h3 className="sezione">Cosa è successo</h3>
      {eventi.length === 0 ? (
        <p className="gioco-vuoto">
          Nessuno ha ancora fatto niente di notevole. Né di riprovevole.
        </p>
      ) : (
        <ul className="storico">
          {eventi
            .filter((e) => e.stato === 'approved')
            .map((e) => (
              <li key={e.id}>
                <span className={e.punti < 0 ? 'storico-punti meno' : 'storico-punti piu'}>
                  {segno(e.punti)}
                </span>
                <span className="storico-motivo">
                  <strong>{nome(e.membroId)}</strong> — {e.motivo}
                  <span className="storico-quando">{quando(e.creatoIl)}</span>
                </span>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}

function segno(n) {
  return n > 0 ? `+${n}` : String(n)
}

function quando(iso) {
  return new Date(iso).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

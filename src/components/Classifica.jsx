import { useState } from 'react'
import { urlAvatar } from '../config/avatar.js'
import { dataDiOggi, statoDelViaggio } from '../lib/giorni.js'
import { magliaNeraDelGiorno, mvpDelGiorno, saldiDelGiorno } from '../lib/classifica.js'
import Proposta from './Proposta.jsx'
import PropostaInAttesa from './PropostaInAttesa.jsx'

export default function Classifica({
  classifica,
  eventi,
  ioId,
  proposteAperte = [],
  onVotaProposta,
  onCrea,
  inCorso,
  errore,
}) {
  const oggi = dataDiOggi()
  const saldi = saldiDelGiorno(eventi, oggi)
  const mvp = mvpDelGiorno(saldi)
  const magliaNera = magliaNeraDelGiorno(saldi)
  const finito = statoDelViaggio(oggi) === 'dopo'

  const perId = Object.fromEntries(classifica.map((m) => [m.id, m]))
  const nome = (id) => perId[id]?.nome ?? 'Qualcuno'

  // I punti si propongono da qui: la classifica è dove guardi chi merita
  // qualcosa, quindi è lì che deve stare il gesto.
  const [scelto, setScelto] = useState(null)
  const destinatario = classifica.find((m) => m.id === scelto) ?? null

  async function crea(dati) {
    await onCrea(dati)
    setScelto(null)
  }

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
          <li key={m.id}>
            <button
              type="button"
              className={m.id === ioId ? 'riga io' : 'riga'}
              onClick={() => setScelto(m.id)}
            >
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
              {/* Senza questa freccia niente dice che la riga si tocca:
                  è la stessa che segna le righe apribili nelle Spese. */}
              <span className="riga-freccia" aria-hidden="true">
                ›
              </span>
            </button>
          </li>
        ))}
      </ol>

      <p className="classifica-invito">Tocca qualcuno per proporgli dei punti.</p>

      {destinatario && (
        <Proposta
          destinatario={destinatario}
          ioId={ioId}
          onCrea={crea}
          onAnnulla={() => setScelto(null)}
          inCorso={inCorso}
          errore={errore}
        />
      )}

      {/* Le proposte aperte stanno qui sotto, col tempo che scorre. Il
          banner in sovrimpressione in cima all'app resta com'è: quello
          ti raggiunge ovunque, questo è il posto dove le ritrovi. */}
      {proposteAperte.length > 0 && (
        <>
          <h3 className="sezione">Da votare</h3>
          <ul className="attese">
            {proposteAperte.map((p) => (
              <PropostaInAttesa
                key={p.votoId}
                proposta={p}
                membri={perId}
                ioId={ioId}
                onVota={onVotaProposta}
              />
            ))}
          </ul>
        </>
      )}

      <h3 className="sezione">Cosa è successo</h3>
      {eventi.filter((e) => e.stato === 'approved').length === 0 ? (
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

import { useRef } from 'react'
import { TIPI_ACCETTATI } from '../config/foto.js'
import { SFIDE_PER_ID } from '../config/sfide.js'

// Le sfide del giorno, e sotto quelle già vinte come trofeo. Mai
// l'elenco completo: quelle degli altri giorni non esistono finché non
// ci si arriva.
export default function Sfide({
  diOggi,
  conquistate,
  vinte,
  partecipazioni,
  membri,
  ioId,
  totaleMembri,
  onScegli,
  inCorso,
}) {
  if (diOggi.length === 0 && conquistate.length === 0) return null

  return (
    <section className="sfide">
      {diOggi.length > 0 && (
        <>
          <h2 className="sfide-titolo">Sfide di oggi</h2>
          <ul className="sfide-elenco">
            {diOggi.map((s) => (
              <Sfida
                key={s.id}
                sfida={s}
                vinta={vinte[s.id]}
                foto={partecipazioni[s.id] ?? []}
                membri={membri}
                ioId={ioId}
                totaleMembri={totaleMembri}
                onScegli={onScegli}
                inCorso={inCorso}
              />
            ))}
          </ul>
        </>
      )}

      {conquistate.length > 0 && (
        <>
          <h2 className="sfide-titolo">Già vinte</h2>
          <ul className="sfide-elenco">
            {conquistate.map((s) => (
              <li className="sfida vinta" key={s.id}>
                <span className="sfida-titolo">🏆 {s.titolo}</span>
                <span className="sfida-esito">
                  {vinte[s.id]?.membroId
                    ? `${membri[vinte[s.id].membroId]?.nome ?? 'qualcuno'} · +${s.punti}`
                    : `tutto il gruppo · +${s.punti}`}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

function Sfida({ sfida, vinta, foto, membri, ioId, totaleMembri, onScegli, inCorso }) {
  const campo = useRef(null)
  const mia = foto.some((f) => f.autoreId === ioId)
  const collettiva = sfida.tipo === 'collettiva'
  const mancano = collettiva ? totaleMembri - new Set(foto.map((f) => f.autoreId)).size : 0

  return (
    <li className={vinta ? 'sfida vinta' : 'sfida'}>
      <div className="sfida-testa">
        <span className="sfida-titolo">
          {vinta ? '🏆 ' : ''}
          {sfida.titolo}
        </span>
        <span className="sfida-punti">+{sfida.punti}</span>
      </div>

      <p className="sfida-testo">{sfida.testo}</p>

      {vinta ? (
        <span className="sfida-esito">
          {collettiva
            ? 'Fatta da tutti.'
            : `Vinta da ${membri[vinta.membroId]?.nome ?? 'qualcuno'}.`}
        </span>
      ) : (
        <>
          <div className="sfida-stato">
            {collettiva ? (
              <span>
                {mancano > 0
                  ? `Mancano ancora ${mancano} su ${totaleMembri}.`
                  : 'Ci siete tutti. Si chiude.'}
              </span>
            ) : (
              <span>
                {foto.length === 0
                  ? 'Nessuno ci ha ancora provato.'
                  : `${foto.length} in gara.`}
              </span>
            )}
          </div>

          <button
            type="button"
            className="sfida-manda"
            onClick={() => campo.current?.click()}
            disabled={inCorso || (collettiva && mia)}
          >
            {mia ? (collettiva ? 'Già caricata' : 'Cambia la tua') : 'Mandane una'}
          </button>

          <input
            ref={campo}
            type="file"
            accept={TIPI_ACCETTATI}
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) onScegli(file, sfida.id)
            }}
            hidden
          />
        </>
      )}
    </li>
  )
}

export { SFIDE_PER_ID }

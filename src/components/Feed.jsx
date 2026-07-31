import { MINUTI_PER_ELIMINARE } from '../config/azioni.js'
import { urlAvatar } from '../config/avatar.js'

export default function Feed({ azioni, membri, ioId, onElimina }) {
  const visibili = azioni.filter((a) => !a.eliminato)

  if (visibili.length === 0) {
    return <p className="feed-vuoto">Ancora niente. Qualcuno si muova.</p>
  }

  return (
    <ul className="feed">
      {visibili.map((a) => {
        const autore = membri[a.autoreId]
        return (
          <li key={a.id} className={a.tipo === 'sos' ? 'voce sos' : 'voce'}>
            <img
              className="voce-avatar"
              src={urlAvatar(autore?.avatarStyle, autore?.avatarSeed || '?')}
              alt=""
              width="32"
              height="32"
            />

            <div className="voce-corpo">
              <p className="voce-testo">
                <span className="voce-nome">{autore?.nome ?? 'Qualcuno'}</span>{' '}
                {descrivi(a)}
              </p>
              <span className="voce-ora">{ora(a.creatoIl)}</span>
            </div>

            {a.autoreId === ioId && ritirabile(a.creatoIl) && (
              <button
                type="button"
                className="voce-elimina"
                onClick={() => onElimina(a.id)}
                aria-label="Elimina"
              >
                ×
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function descrivi(a) {
  switch (a.tipo) {
    case 'sos':
      return <span className="voce-sos">🆘 {a.payload.motivo}</span>
    case 'dove_siete':
      return 'chiede dove siete. 📍'
    case 'si_riparte':
      return `dice che si riparte tra ${a.payload.minuti} minuti. 🚗`
    case 'free_text':
      return a.payload.testo
    default:
      return a.tipo
  }
}

function ora(iso) {
  return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

function ritirabile(iso) {
  return Date.now() - Date.parse(iso) < MINUTI_PER_ELIMINARE * 60000
}

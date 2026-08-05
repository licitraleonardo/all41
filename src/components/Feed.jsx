import { MINUTI_PER_ELIMINARE } from '../config/azioni.js'
import { urlAvatar } from '../config/avatar.js'
import Sondaggio from './Sondaggio.jsx'

export default function Feed({
  azioni,
  membri,
  ioId,
  onElimina,
  voti,
  onVota,
}) {
  const visibili = azioni.filter((a) => !a.eliminato)

  if (visibili.length === 0) {
    return <p className="feed-vuoto">Ancora niente. Qualcuno si muova.</p>
  }

  // Il feed arriva dal più recente al più vecchio: qui si legge come una
  // chat, dall'alto verso il basso, con l'ultimo in fondo.
  const inOrdine = [...visibili].reverse()

  return (
    <ul className="feed">
      {inOrdine.map((a) => (
        <Riga
          key={a.id}
          azione={a}
          autore={membri[a.autoreId]}
          mio={a.autoreId === ioId}
          ioId={ioId}
          membri={membri}
          onElimina={onElimina}
          voti={voti}
          onVota={onVota}
        />
      ))}
    </ul>
  )
}

function Riga({ azione, autore, mio, ioId, membri, onElimina, voti, onVota }) {
  // SOS e sondaggi non sono chiacchiere: occupano tutta la larghezza e
  // non stanno da un lato o dall'altro.
  if (azione.tipo === 'sos') {
    return (
      <li className="voce piena sos">
        <span className="sos-testa">🆘 {autore?.nome ?? 'Qualcuno'}</span>
        <p className="sos-motivo">{azione.payload.motivo}</p>
        <Ora azione={azione} mio={mio} onElimina={onElimina} />
      </li>
    )
  }

  if (azione.tipo === 'poll') {
    return (
      <li className="voce piena">
        <span className="bolla-nome">{autore?.nome ?? 'Qualcuno'} ha aperto un voto</span>
        <Sondaggio
          voto={voti?.[azione.payload.voteId]}
          ioId={ioId}
          membri={membri}
          onVota={onVota}
        />
        <Ora azione={azione} mio={mio} onElimina={onElimina} />
      </li>
    )
  }

  // Un suono lanciato non è un annuncio: è una risata, dura un secondo e
  // il suo effetto lo hai già sentito. In cartello grosso riempiva la
  // chat di scatole verdi fra un messaggio e l'altro. Una riga sottile e
  // grigia basta a dire chi è stato.
  if (azione.tipo === 'soundboard') {
    return (
      <li className="voce sussurro">
        <span>
          🔊 {autore?.nome ?? 'Qualcuno'} ha lanciato{' '}
          <strong>{azione.payload.etichetta ?? 'un suono'}</strong>
        </span>
        <span className="sussurro-ora">{ora(azione.creatoIl)}</span>
        {mio && ritirabile(azione.creatoIl) && (
          <button
            type="button"
            className="sussurro-elimina"
            onClick={() => onElimina(azione.id)}
            aria-label="Elimina"
          >
            ×
          </button>
        )}
      </li>
    )
  }

  // Le azioni rapide sono annunci, non conversazione: stanno al centro e
  // non da un lato. Ma devono vedersi: sono il motivo per cui uno tira
  // fuori il telefono, non una nota a piè di pagina.
  if (azione.tipo !== 'free_text') {
    const { icona, testo, tono } = descriviAzione(azione, autore)
    return (
      <li className="voce annuncio">
        <div className={`cartello ${tono}`}>
          <span className="cartello-icona" aria-hidden="true">
            {icona}
          </span>
          <span className="cartello-testo">{testo}</span>
          <span className="cartello-ora">{ora(azione.creatoIl)}</span>
          {mio && ritirabile(azione.creatoIl) && (
            <button
              type="button"
              className="annuncio-elimina"
              onClick={() => onElimina(azione.id)}
              aria-label="Elimina"
            >
              ×
            </button>
          )}
        </div>
      </li>
    )
  }

  const classi = ['voce']
  if (mio) classi.push('mia')
  if (azione.importante) classi.push('importante')

  return (
    <li className={classi.join(' ')}>
      {!mio && (
        <img
          className="voce-avatar"
          src={urlAvatar(autore?.avatarStyle, autore?.avatarSeed || '?')}
          alt=""
          width="28"
          height="28"
        />
      )}
      <div className="bolla-blocco">
        {!mio && <span className="bolla-nome">{autore?.nome ?? 'Qualcuno'}</span>}
        <div className="bolla">
          {azione.importante && <span className="bolla-importante">❗ importante</span>}
          {azione.payload.testo}
        </div>
        <Ora azione={azione} mio={mio} onElimina={onElimina} />
      </div>
    </li>
  )
}

function Ora({ azione, mio, onElimina }) {
  return (
    <span className="voce-ora">
      {ora(azione.creatoIl)}
      {mio && ritirabile(azione.creatoIl) && (
        <button
          type="button"
          className="voce-elimina"
          onClick={() => onElimina(azione.id)}
          aria-label="Elimina"
        >
          ×
        </button>
      )}
    </span>
  )
}

function descriviAzione(a, autore) {
  const chi = autore?.nome ?? 'Qualcuno'
  switch (a.tipo) {
    case 'dove_siete':
      return { icona: '📍', tono: 'posizione', testo: `${chi} chiede dove siete` }
    case 'si_riparte':
      return {
        icona: '🚗',
        tono: 'partenza',
        testo: `Si riparte tra ${a.payload.minuti} minuti — lo dice ${chi}`,
      }
    case 'soundboard':
      return {
        icona: '🔊',
        tono: 'suono',
        testo: `${chi} ha lanciato ${a.payload.etichetta ?? 'un suono'}`,
      }
    default:
      return { icona: '•', tono: '', testo: `${chi}: ${a.tipo}` }
  }
}

function ora(iso) {
  return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

function ritirabile(iso) {
  return Date.now() - Date.parse(iso) < MINUTI_PER_ELIMINARE * 60000
}

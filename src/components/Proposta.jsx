import { useState } from 'react'
import { urlAvatar } from '../config/avatar.js'
import { PROPOSTA } from '../config/proposte.js'

export default function Proposta({ membri, ioId, onCrea, onAnnulla, inCorso, errore }) {
  const [destinatario, setDestinatario] = useState(null)
  const [punti, setPunti] = useState(3)
  const [motivo, setMotivo] = useState('')

  const puoInviare = destinatario && motivo.trim().length > 2 && punti !== 0 && !inCorso

  return (
    <div className="gioco-corpo">
      <h2 className="testamento-titolo">Proponi punti</h2>

      <h3 className="sezione">A chi li assegni?</h3>
      <div className="scelta-persone">
        {membri.map((m) => (
          <button
            key={m.id}
            type="button"
            className={m.id === destinatario ? 'persona scelta' : 'persona'}
            onClick={() => setDestinatario(m.id)}
            aria-pressed={m.id === destinatario}
          >
            <img src={urlAvatar(m.avatarStyle, m.avatarSeed)} alt="" width="40" height="40" />
            <span>{m.id === ioId ? `${m.nome} (tu)` : m.nome}</span>
          </button>
        ))}
      </div>

      <h3 className="sezione">Quanti</h3>
      <div className="slider-riga">
        <output className={punti < 0 ? 'slider-valore meno' : 'slider-valore piu'}>
          {punti > 0 ? `+${punti}` : punti}
        </output>
        <input
          type="range"
          min={-PROPOSTA.limite}
          max={PROPOSTA.limite}
          step="1"
          value={punti}
          onChange={(e) => setPunti(Number(e.target.value))}
          aria-label="Quanti punti"
        />
      </div>

      <h3 className="sezione">Perché</h3>
      <label className="campo">
        <input
          type="text"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          maxLength={PROPOSTA.lunghezzaMaxMotivo}
          placeholder="Ha portato il ghiaccio"
        />
      </label>

      {destinatario === ioId && (
        <p className="proposta-avviso">
          Stai proponendo punti per te stesso. C&rsquo;è una Legge apposta, e non ti
          piacerà.
        </p>
      )}

      {errore && <p className="sondaggio-errore">{errore}</p>}

      <button
        type="button"
        className="primario-chiaro"
        onClick={() => onCrea({ destinatarioId: destinatario, punti, motivo: motivo.trim() })}
        disabled={!puoInviare}
      >
        {inCorso ? 'Un attimo…' : 'Metti ai voti'}
      </button>

      <p className="proposta-nota">
        Un&rsquo;ora di voto, o meno se votano tutti.
      </p>

      <button type="button" className="secondario-chiaro" onClick={onAnnulla}>
        Lascia stare
      </button>
    </div>
  )
}

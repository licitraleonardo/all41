import { useState } from 'react'
import { urlAvatar } from '../config/avatar.js'
import { PROPOSTA } from '../config/proposte.js'

// Si apre toccando qualcuno nella classifica, quindi il destinatario è
// già deciso e non c'è niente da scegliere: restano quanti punti e
// perché. Due tasti e un campo.
//
// È un foglio in sovrimpressione, come "Salda" nelle Spese: il fondo
// scuro stacca la decisione da tutto il resto, e si capisce che si sta
// facendo una cosa sola.
//
// Niente slider: su un numero che va da -5 a +5 una barra da trascinare è
// più difficile da centrare di due tasti, e occupa il triplo dello
// spazio.
export default function Proposta({ destinatario, ioId, onCrea, onAnnulla, inCorso, errore }) {
  const [punti, setPunti] = useState(3)
  const [motivo, setMotivo] = useState('')

  const puoInviare = motivo.trim().length > 2 && punti !== 0 && !inCorso
  const perMe = destinatario.id === ioId

  const cambia = (passo) => () => {
    setPunti((p) => {
      const nuovo = Math.max(-PROPOSTA.limite, Math.min(PROPOSTA.limite, p + passo))
      // Lo zero non vuol dire niente: si salta.
      return nuovo === 0 ? nuovo + passo : nuovo
    })
  }

  return (
    <div
      className="foglio-sfondo"
      role="dialog"
      aria-modal="true"
      aria-label={`Proponi punti per ${destinatario.nome}`}
    >
      <div className="foglio">
        <div className="proposta-testa">
          <img
            src={urlAvatar(destinatario.avatarStyle, destinatario.avatarSeed)}
            alt=""
            width="40"
            height="40"
          />
          <span>
            Punti per <strong>{perMe ? 'te' : destinatario.nome}</strong>
          </span>
        </div>

        <div className="conta-punti">
          <button
            type="button"
            className="conta-tasto"
            onClick={cambia(-1)}
            disabled={punti <= -PROPOSTA.limite}
            aria-label="Un punto in meno"
          >
            −
          </button>
          <output className={punti < 0 ? 'conta-valore meno' : 'conta-valore piu'}>
            {punti > 0 ? `+${punti}` : punti}
          </output>
          <button
            type="button"
            className="conta-tasto"
            onClick={cambia(1)}
            disabled={punti >= PROPOSTA.limite}
            aria-label="Un punto in più"
          >
            +
          </button>
        </div>

        <label className="campo">
          <input
            type="text"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            maxLength={PROPOSTA.lunghezzaMaxMotivo}
            placeholder="Perché"
          />
        </label>

        {/* Velato di proposito: non dice quale Legge né quanto costa.
            Scoprirlo è metà del gioco. */}
        {perMe && <p className="proposta-avviso">Il Testamento ha notato.</p>}

        {errore && <p className="sondaggio-errore">{errore}</p>}

        {/* Il tasto dice cosa sta per succedere, non "conferma": è la
            stessa idea di "Salda 139,23 €" nelle Spese. */}
        <button
          type="button"
          className="primario-chiaro"
          onClick={() =>
            onCrea({ destinatarioId: destinatario.id, punti, motivo: motivo.trim() })
          }
          disabled={!puoInviare}
        >
          {inCorso ? 'Un attimo…' : `Metti ai voti ${punti > 0 ? `+${punti}` : punti}`}
        </button>

        <button type="button" className="secondario-foglio" onClick={onAnnulla}>
          Lascia stare
        </button>
      </div>
    </div>
  )
}

import { useState } from 'react'
import SceltaAvatar from './SceltaAvatar.jsx'
import { STILE_PREDEFINITO } from '../config/avatar.js'
import { NOME } from '../config/viaggio.js'

export default function Onboarding({ onEntra, onRecupera, inCorso, errore }) {
  const [nome, setNome] = useState('')
  const [stile, setStile] = useState(STILE_PREDEFINITO)

  const [conferma, setConferma] = useState(false)

  const nomePulito = nome.trim()
  const puoEntrare = nomePulito.length >= NOME.lunghezzaMin && !inCorso

  // I codici sono sempre tutti maiuscoli: un nome scritto così è quasi
  // sempre un codice incollato nel campo sbagliato andando di fretta.
  const sembraUnCodice = nomePulito.length > 0 && nomePulito === nomePulito.toUpperCase()

  function invia(e) {
    e.preventDefault()
    if (!puoEntrare) return
    // Una conferma sempre: un profilo in più sballa i saldi delle Spese
    // di tutti, e non si cancella da solo.
    if (!conferma) {
      setConferma(true)
      return
    }
    onEntra({ nome: nomePulito, avatarStyle: stile })
  }

  if (conferma) {
    return (
      <div className="pannello">
        <h1 className="titolo">Sicuro?</h1>
        <p className="allan">
          Sto per creare un profilo nuovo chiamato <strong>{nomePulito}</strong>, con
          zero punti e un codice tutto suo.
        </p>

        {sembraUnCodice && (
          <p className="errore">
            È tutto maiuscolo, e i codici sono sempre tutti maiuscoli. Sicuro che non
            sia il tuo codice finito nel campo del nome?
          </p>
        )}

        <button
          type="button"
          className="primario"
          onClick={() => onEntra({ nome: nomePulito, avatarStyle: stile })}
          disabled={inCorso}
        >
          {inCorso ? 'Un attimo…' : 'Sì, crea il profilo'}
        </button>

        <button type="button" className="secondario" onClick={onRecupera}>
          No, ho già un codice
        </button>

        <button type="button" className="secondario" onClick={() => setConferma(false)}>
          Torna a scrivere
        </button>
      </div>
    )
  }

  return (
    <form className="pannello" onSubmit={invia}>
      <h1 className="titolo">Chi sei?</h1>
      <p className="allan">Nome e faccia. Poi ti do un codice.</p>

      <label className="campo">
        <span>Nome</span>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength={NOME.lunghezzaMax}
          autoComplete="given-name"
          autoCapitalize="words"
          placeholder="Come ti chiamano"
        />
      </label>

      <SceltaAvatar seme={nomePulito || 'all41'} stile={stile} onCambia={setStile} />

      {errore && <p className="errore">{errore}</p>}

      <button type="submit" className="primario" disabled={!puoEntrare}>
        {inCorso ? 'Un attimo…' : 'Entra'}
      </button>

      <button type="button" className="secondario" onClick={onRecupera}>
        Hai già un codice?
      </button>
    </form>
  )
}

import { useState } from 'react'
import SceltaAvatar from './SceltaAvatar.jsx'
import { STILE_PREDEFINITO } from '../config/avatar.js'
import { NOME } from '../config/viaggio.js'

export default function Onboarding({ onEntra, onRecupera, inCorso, errore }) {
  const [nome, setNome] = useState('')
  const [stile, setStile] = useState(STILE_PREDEFINITO)

  const nomePulito = nome.trim()
  const puoEntrare = nomePulito.length >= NOME.lunghezzaMin && !inCorso

  function invia(e) {
    e.preventDefault()
    if (!puoEntrare) return
    onEntra({ nome: nomePulito, avatarStyle: stile })
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

import { useState } from 'react'
import SceltaAvatar from './SceltaAvatar.jsx'
import { NOME } from '../config/viaggio.js'

export default function ModificaProfilo({ membro, onSalva, onAnnulla, inCorso, errore }) {
  const [nome, setNome] = useState(membro.nome)
  const [stile, setStile] = useState(membro.avatarStyle)

  const nomePulito = nome.trim()
  const valido = nomePulito.length >= NOME.lunghezzaMin
  const cambiato = nomePulito !== membro.nome || stile !== membro.avatarStyle

  function invia(e) {
    e.preventDefault()
    if (!valido || !cambiato || inCorso) return
    onSalva({ nome: nomePulito, avatarStyle: stile })
  }

  return (
    <form className="pannello" onSubmit={invia}>
      <h1 className="titolo">Cambia faccia</h1>
      <p className="allan">Codice e punti restano quelli.</p>

      <label className="campo">
        <span>Nome</span>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength={NOME.lunghezzaMax}
          autoCapitalize="words"
        />
      </label>

      <SceltaAvatar seme={nomePulito || 'all41'} stile={stile} onCambia={setStile} />

      {errore && <p className="errore">{errore}</p>}

      <button
        type="submit"
        className="primario"
        disabled={!valido || !cambiato || inCorso}
      >
        {inCorso ? 'Un attimo…' : 'Salva'}
      </button>

      <button type="button" className="secondario" onClick={onAnnulla}>
        Lascia stare
      </button>
    </form>
  )
}

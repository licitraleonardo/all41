import { useState } from 'react'
import { normalizzaCodice } from '../lib/codice.js'
import { CODICE } from '../config/viaggio.js'

export default function Recupero({ onRecupera, onIndietro, inCorso, errore }) {
  const [codice, setCodice] = useState('')

  const completo = codice.length === CODICE.lunghezza
  const puoEntrare = completo && !inCorso

  function invia(e) {
    e.preventDefault()
    if (!puoEntrare) return
    onRecupera(codice)
  }

  return (
    <form className="pannello" onSubmit={invia}>
      <h1 className="titolo">Il tuo codice</h1>
      <p className="allan">Quello che ti avevo dato. Cinque caratteri.</p>

      <label className="campo">
        <span>Codice</span>
        <input
          type="text"
          className="input-codice"
          value={codice}
          onChange={(e) => setCodice(normalizzaCodice(e.target.value))}
          inputMode="text"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck="false"
          placeholder="K7M2X"
        />
      </label>

      {errore && <p className="errore">{errore}</p>}

      <button type="submit" className="primario" disabled={!puoEntrare}>
        {inCorso ? 'Un attimo…' : 'Entra'}
      </button>

      <button type="button" className="secondario" onClick={onIndietro}>
        Non ce l&rsquo;ho, faccio un profilo nuovo
      </button>
    </form>
  )
}

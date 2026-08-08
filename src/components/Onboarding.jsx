import { useState } from 'react'
import SceltaAvatar from './SceltaAvatar.jsx'
import { STILE_PREDEFINITO } from '../config/avatar.js'
import { NOME, CODICE } from '../config/viaggio.js'
import { normalizzaCodice } from '../lib/codice.js'

// L'ingresso. In cima il codice, sotto una tendina per registrarsi.
//
// La ragione è nei numeri: le persone del gruppo sono otto, e il profilo
// lo creano una volta sola. Tutte le altre volte — telefono nuovo, cache
// svuotata, app installata sulla home che ha uno storage suo — quello
// che serve è il codice. Quindi il codice è l'unica cosa aperta, e la
// registrazione sta piegata: c'è, si vede, ma non occupa la schermata
// per una cosa che si fa una volta nella vita.
//
// ⚠️ Due presidi che erano qui prima e restano, perché costano poco e
// hanno una ragione: la conferma "Sicuro?" (un profilo in più sballa i
// saldi delle Spese di tutti e non si cancella da solo) e l'avviso su un
// nome tutto maiuscolo, che è quasi sempre un codice finito nel campo
// sbagliato.
export default function Onboarding({ onEntra, onRecupera, inCorso, errore }) {
  const [codice, setCodice] = useState('')
  const [nome, setNome] = useState('')
  const [stile, setStile] = useState(STILE_PREDEFINITO)
  const [conferma, setConferma] = useState(false)
  const [apertaRegistrazione, setApertaRegistrazione] = useState(false)

  const nomePulito = nome.trim()
  const codiceCompleto = codice.length === CODICE.lunghezza
  const puoCreare = nomePulito.length >= NOME.lunghezzaMin && !inCorso

  const sembraUnCodice = nomePulito.length > 0 && nomePulito === nomePulito.toUpperCase()

  if (conferma) {
    return (
      <div className="pannello">
        <h1 className="titolo">Sicuro?</h1>
        <p className="allan">
          Sto per creare un profilo nuovo chiamato <strong>{nomePulito}</strong>, con zero
          punti e un codice tutto suo.
        </p>

        {sembraUnCodice && (
          <p className="errore">
            È tutto maiuscolo, e i codici sono sempre tutti maiuscoli. Sicuro che non sia il
            tuo codice finito nel campo del nome?
          </p>
        )}

        {errore && <p className="errore">{errore}</p>}

        <button
          type="button"
          className="primario"
          onClick={() => onEntra({ nome: nomePulito, avatarStyle: stile })}
          disabled={inCorso}
        >
          {inCorso ? 'Un attimo…' : 'Inizia viaggio'}
        </button>

        <button type="button" className="secondario" onClick={() => setConferma(false)}>
          Indietro
        </button>
      </div>
    )
  }

  return (
    <div className="pannello">
      <h1 className="titolo">All For One</h1>

      <form
        className="ingresso-codice"
        onSubmit={(e) => {
          e.preventDefault()
          if (codiceCompleto && !inCorso) onRecupera(codice)
        }}
      >
        <label className="campo">
          <span>Entra con un codice</span>
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

        <button type="submit" className="primario" disabled={!codiceCompleto || inCorso}>
          {inCorso ? 'Un attimo…' : 'Entra'}
        </button>
      </form>

      {errore && <p className="errore">{errore}</p>}

      {/* Piegata: chi non ha un codice la apre, chi ce l'ha non la vede
          nemmeno. Un <details> vero e non un finto accordion, così si
          apre anche se il JavaScript inciampa. */}
      <details
        className="registrati"
        open={apertaRegistrazione}
        onToggle={(e) => setApertaRegistrazione(e.currentTarget.open)}
      >
        <summary className="registrati-testa">Registrati</summary>

        <form
          className="registrati-corpo"
          onSubmit={(e) => {
            e.preventDefault()
            if (puoCreare) setConferma(true)
          }}
        >
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

          <button type="submit" className="secondario avanti" disabled={!puoCreare}>
            Crea profilo
          </button>
        </form>
      </details>
    </div>
  )
}

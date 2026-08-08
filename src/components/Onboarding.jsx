import { useState } from 'react'
import SceltaAvatar from './SceltaAvatar.jsx'
import { STILE_PREDEFINITO, STILI } from '../config/avatar.js'
import { NOME, CODICE } from '../config/viaggio.js'
import { normalizzaCodice } from '../lib/codice.js'

// L'ingresso, con la gerarchia rovesciata rispetto a prima: in cima c'è
// il codice, sotto la creazione di un profilo nuovo.
//
// La ragione è nei numeri: le persone del gruppo sono otto, e il profilo
// lo creano una volta sola. Tutte le altre volte — telefono nuovo, cache
// svuotata, app installata sulla home che ha uno storage suo — quello
// che serve è il codice. Prima l'azione rara era quella grande, e chi
// rientrava doveva cercare "Hai già un codice?" in fondo.
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

  const nomePulito = nome.trim()
  const codiceCompleto = codice.length === CODICE.lunghezza
  const puoCreare = nomePulito.length >= NOME.lunghezzaMin && !inCorso

  const sembraUnCodice = nomePulito.length > 0 && nomePulito === nomePulito.toUpperCase()

  // "Genera": tira a sorte lo stile dell'avatar. Il nome resta scritto a
  // mano di proposito — con nomi inventati, in classifica e nelle Spese
  // non si riconosce più nessuno, ed è l'unica cosa che il gruppo deve
  // poter leggere a colpo d'occhio.
  function generaAvatar() {
    const altri = STILI.filter((s) => s !== stile)
    setStile(altri[Math.floor(Math.random() * altri.length)])
  }

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
      <p className="allan">Se ce l&rsquo;hai già, il codice. Se no, si fa in un minuto.</p>

      <form
        className="ingresso-codice"
        onSubmit={(e) => {
          e.preventDefault()
          if (codiceCompleto && !inCorso) onRecupera(codice)
        }}
      >
        <label className="campo">
          <span>Inserisci un codice</span>
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

      <div className="ingresso-oppure" role="separator">
        <span>oppure</span>
      </div>

      <form
        className="ingresso-nuovo"
        onSubmit={(e) => {
          e.preventDefault()
          if (puoCreare) setConferma(true)
        }}
      >
        <h2 className="ingresso-titolo">Genera avatar e nome</h2>

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

        <button type="button" className="secondario" onClick={generaAvatar}>
          Cambiamela tu
        </button>

        <button type="submit" className="secondario avanti" disabled={!puoCreare}>
          Crea il profilo
        </button>
      </form>
    </div>
  )
}

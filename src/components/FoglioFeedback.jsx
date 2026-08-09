import { useState } from 'react'
import Foglio from './Foglio.jsx'
import './FoglioFeedback.css'
import { MAX_FEEDBACK, mandaFeedback } from '../lib/feedback.js'
import { descriviErrore } from '../lib/errori.js'

// «Dimmi com'è che va»: un campo, e basta.
//
// Nessuna categoria da scegliere, nessuna faccina da cliccare, nessun
// voto da 1 a 5. Chi ha qualcosa da dire lo scrive; chi non ce l'ha,
// chiude. Un modulo con tre campi obbligatori non raccoglie più
// informazioni: ne raccoglie di meno, perché nessuno lo compila.
export default function FoglioFeedback({ membroId, dove, onChiudi }) {
  const [testo, setTesto] = useState('')
  const [inCorso, setInCorso] = useState(false)
  const [errore, setErrore] = useState(null)
  const [fatto, setFatto] = useState(false)

  const pulito = testo.trim()

  async function manda() {
    setInCorso(true)
    setErrore(null)
    try {
      await mandaFeedback({ testo: pulito, dove }, membroId)
      setFatto(true)
      // Si chiude da solo dopo un attimo: si è già detto grazie, e
      // lasciare un foglio aperto costringe a un tocco per niente.
      setTimeout(onChiudi, 1400)
    } catch (e) {
      // ⚠️ L'errore resta a schermo e il testo NON si perde: quello che
      // uno aveva da dire ce l'ha in testa adesso, e riscriverlo da capo
      // vuol dire non riscriverlo.
      setErrore(descriviErrore(e))
    } finally {
      setInCorso(false)
    }
  }

  if (fatto) {
    return (
      <Foglio etichetta="Grazie" onChiudi={onChiudi}>
        <p className="fdb-fatto">Preso. Grazie.</p>
      </Foglio>
    )
  }

  return (
    <Foglio etichetta="Dimmi com’è che va" sporco={pulito.length > 0} onChiudi={onChiudi}>
      <>
        <h2 className="foglio-titolo">Com’è che va?</h2>

        <p className="fdb-nota">
          Qualsiasi cosa: una roba che non si capisce, una che manca, una che ti ha fatto
          ridere. Anche una riga.
        </p>

        <label className="campo">
          <textarea
            className="fdb-campo"
            value={testo}
            onChange={(e) => setTesto(e.target.value)}
            maxLength={MAX_FEEDBACK}
            rows={5}
            placeholder="Scrivi qui"
            autoFocus
          />
        </label>

        {errore && (
          <p className="fdb-guasto" role="alert">
            <strong>Non è partito.</strong> {errore}
            <span>Riprova: quello che hai scritto è ancora qui.</span>
          </p>
        )}

        {/* Chi legge questa roba, detto prima e non dopo: sapere che non
            lo vede il gruppo cambia quello che si scrive. */}
        <p className="fdb-nota fdb-chi">Lo legge solo chi ha scritto l’app. Non il gruppo.</p>

        <button
          type="button"
          className="primario-chiaro"
          onClick={manda}
          disabled={pulito.length === 0 || inCorso}
        >
          {inCorso ? 'Mando…' : errore ? 'Riprova' : 'Manda'}
        </button>

        <button type="button" className="secondario-foglio" onClick={onChiudi} disabled={inCorso}>
          Lascia stare
        </button>
      </>
    </Foglio>
  )
}

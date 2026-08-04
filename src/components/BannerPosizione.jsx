import { useState } from 'react'
import './BannerPosizione.css'
import { useAltezzaBanner } from '../hooks/useAltezzaBanner.js'
import { daQuanto } from '../lib/rinfrescaPosizione.js'

// Tre scelte, non due, come per le proposte: "non ora" esiste perché
// obbligare a scegliere fra sì e no per far sparire un banner produce
// risposte a caso, e una risposta a caso vale meno di una in meno.
//
//   Sì      aggiorna adesso
//   No      per oggi non se ne parla più
//   Non ora alla prossima apertura si richiede
export default function BannerPosizione({ mia, onAggiorna, onNo, onNonOra }) {
  const [riquadro, setRiquadro] = useState(null)
  const [inCorso, setInCorso] = useState(false)
  const [errore, setErrore] = useState(null)
  useAltezzaBanner(riquadro, true)

  async function aggiorna() {
    setInCorso(true)
    setErrore(null)
    try {
      await onAggiorna()
    } catch (e) {
      setErrore(e?.message ?? 'Non ci riesce.')
      setInCorso(false)
    }
  }

  return (
    <div
      className="banner-posizione"
      role="region"
      aria-label="Aggiornare la posizione"
      ref={setRiquadro}
    >
      <div className="banner-dentro">
        <p className="banner-testo">
          <strong>Sei fermo lì {daQuanto(mia.quando)}.</strong>
          <span className="banner-motivo">
            {errore ?? 'Una posizione vecchia è peggio di nessuna posizione.'}
          </span>
        </p>

        <div className="banner-scelte">
          <button
            type="button"
            className="banner-si"
            onClick={aggiorna}
            disabled={inCorso}
          >
            {inCorso ? 'Cerco…' : 'Aggiorna'}
          </button>
          <button type="button" className="banner-no" onClick={onNo} disabled={inCorso}>
            No
          </button>
          <button
            type="button"
            className="banner-dopo"
            onClick={onNonOra}
            disabled={inCorso}
          >
            Non ora
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'

// Una proposta aperta, votabile dal tab Proponi. È qui che si ritrovano
// anche quelle rimandate col "voto dopo" del banner: senza questo posto,
// quel bottone sarebbe un modo per perdere il voto invece che per
// rimandarlo.
export default function PropostaInAttesa({ proposta, membri, ioId, onVota }) {
  const [inCorso, setInCorso] = useState(false)
  const [errore, setErrore] = useState(null)

  const nome = (id) => membri[id]?.nome ?? 'Qualcuno'
  const hoVotato = proposta.hannoVotato.includes(ioId)
  const segno = proposta.punti > 0 ? `+${proposta.punti}` : String(proposta.punti)

  async function scegli(opzione) {
    setInCorso(true)
    setErrore(null)
    try {
      await onVota(proposta.votoId, opzione)
    } catch (e) {
      setErrore(e?.message ?? 'Non ha funzionato.')
    } finally {
      setInCorso(false)
    }
  }

  return (
    <li className="attesa-card">
      <div className="attesa-testa">
        <span className={proposta.punti < 0 ? 'storico-punti meno' : 'storico-punti piu'}>
          {segno}
        </span>
        <span className="attesa-testo">
          <strong>{nome(proposta.destinatarioId)}</strong> — {proposta.motivo}
          <span className="attesa-chi">
            {proposta.proponenteId === proposta.destinatarioId
              ? 'se li è proposti da solo'
              : `proposta da ${nome(proposta.proponenteId)}`}
          </span>
        </span>
      </div>

      {hoVotato ? (
        <p className="attesa-nota">
          Hai votato. Sì {proposta.conteggi[0] ?? 0} · No {proposta.conteggi[1] ?? 0}
        </p>
      ) : (
        <div className="attesa-bottoni">
          <button type="button" className="voto-si" onClick={() => scegli(0)} disabled={inCorso}>
            Sì
          </button>
          <button type="button" className="voto-no" onClick={() => scegli(1)} disabled={inCorso}>
            No
          </button>
        </div>
      )}

      {errore && <p className="sondaggio-errore">{errore}</p>}
    </li>
  )
}

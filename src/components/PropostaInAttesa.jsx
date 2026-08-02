import { useEffect, useState } from 'react'

// Una proposta in attesa, votabile sul posto. Sta nella Classifica e non
// nel feed: è lì che uno guarda i punti, ed è lì che deve poter dire la
// sua senza andare a cercare il sondaggio da un'altra parte.
export default function PropostaInAttesa({ evento, voto, membri, ioId, onVota }) {
  const [inCorso, setInCorso] = useState(false)
  const [errore, setErrore] = useState(null)
  const restano = useContoAllaRovescia(voto?.scadeIl)

  const nome = (id) => membri[id]?.nome ?? 'Qualcuno'
  const hoVotato = voto?.hannoVotato?.includes(ioId)
  const scaduto = restano === 0

  async function scegli(opzione) {
    setInCorso(true)
    setErrore(null)
    try {
      await onVota(voto.id, opzione)
    } catch (e) {
      setErrore(e?.message ?? 'Non ha funzionato.')
    } finally {
      setInCorso(false)
    }
  }

  return (
    <li className="attesa-card">
      <div className="attesa-testa">
        <span className={evento.punti < 0 ? 'storico-punti meno' : 'storico-punti piu'}>
          {evento.punti > 0 ? `+${evento.punti}` : evento.punti}
        </span>
        <span className="attesa-testo">
          <strong>{nome(evento.membroId)}</strong> — {evento.motivo}
          {evento.propostoDa && (
            <span className="attesa-chi">proposta da {nome(evento.propostoDa)}</span>
          )}
        </span>
      </div>

      {!voto ? (
        <p className="attesa-nota">Carico il voto…</p>
      ) : hoVotato || scaduto ? (
        <p className="attesa-nota">
          {hoVotato ? 'Hai votato.' : 'Tempo scaduto.'} Sì {voto.conteggi[0] ?? 0} · No{' '}
          {voto.conteggi[1] ?? 0}
          {!scaduto && ` · ${testoTempo(restano)}`}
        </p>
      ) : (
        <>
          <div className="attesa-bottoni">
            <button
              type="button"
              className="voto-si"
              onClick={() => scegli(0)}
              disabled={inCorso}
            >
              Sì
            </button>
            <button
              type="button"
              className="voto-no"
              onClick={() => scegli(1)}
              disabled={inCorso}
            >
              No
            </button>
          </div>
          <p className="attesa-nota">{testoTempo(restano)}</p>
        </>
      )}

      {errore && <p className="sondaggio-errore">{errore}</p>}
    </li>
  )
}

// Batte al minuto: per un voto di un'ora i secondi sarebbero rumore.
function useContoAllaRovescia(scadenza) {
  const [restano, setRestano] = useState(() => mancano(scadenza))

  useEffect(() => {
    setRestano(mancano(scadenza))
    const timer = setInterval(() => setRestano(mancano(scadenza)), 30000)
    return () => clearInterval(timer)
  }, [scadenza])

  return restano
}

function mancano(scadenza) {
  if (!scadenza) return null
  return Math.max(0, Date.parse(scadenza) - Date.now())
}

function testoTempo(ms) {
  if (ms === null) return ''
  const minuti = Math.ceil(ms / 60000)
  if (minuti <= 1) return 'Manca meno di un minuto'
  return `Mancano ${minuti} minuti`
}

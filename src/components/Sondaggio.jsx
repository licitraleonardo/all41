import { useState } from 'react'

export default function Sondaggio({ voto, ioId, membri, onVota }) {
  const [inCorso, setInCorso] = useState(false)
  const [errore, setErrore] = useState(null)

  if (!voto) return <span className="voce-attesa">carico il sondaggio…</span>

  const scaduto = voto.chiusoIl != null || Date.parse(voto.scadeIl) <= Date.now()
  const hoVotato = voto.hannoVotato.includes(ioId)
  const totale = voto.conteggi.reduce((a, b) => a + b, 0)
  const massimo = Math.max(...voto.conteggi)

  async function scegli(i) {
    setInCorso(true)
    setErrore(null)
    try {
      await onVota(voto.id, i)
    } catch (e) {
      setErrore(e?.message ?? 'Non ha funzionato.')
    } finally {
      setInCorso(false)
    }
  }

  return (
    <div className="sondaggio">
      <p className="sondaggio-domanda">{voto.domanda}</p>

      <div className="sondaggio-opzioni">
        {voto.opzioni.map((opzione, i) => {
          const conteggio = voto.conteggi[i] ?? 0
          const quota = totale > 0 ? Math.round((conteggio / totale) * 100) : 0
          const mia = voto.schede?.[ioId] === i
          const votabile = !scaduto && !hoVotato && !inCorso

          return (
            <button
              key={opzione}
              type="button"
              className={mia ? 'opzione mia' : 'opzione'}
              onClick={() => scegli(i)}
              disabled={!votabile}
            >
              {/* La barra si vede solo dopo aver votato: prima influenzerebbe */}
              {(hoVotato || scaduto) && (
                <span
                  className={conteggio === massimo && conteggio > 0 ? 'barra vince' : 'barra'}
                  style={{ width: `${quota}%` }}
                  aria-hidden="true"
                />
              )}
              <span className="opzione-testo">{opzione}</span>
              {(hoVotato || scaduto) && <span className="opzione-conto">{conteggio}</span>}
            </button>
          )
        })}
      </div>

      {errore && <p className="sondaggio-errore">{errore}</p>}

      <p className="sondaggio-piede">
        {scaduto ? 'Chiuso.' : hoVotato ? 'Hai votato.' : 'Vota.'}
        {(hoVotato || scaduto) && totale > 0 && ` ${chiHaVotato(voto, membri)}`}
      </p>
    </div>
  )
}

// I sondaggi di logistica non sono anonimi apposta: sapere chi manca è
// metà dell'informazione utile quando si deve decidere in fretta.
function chiHaVotato(voto, membri) {
  const nomi = voto.hannoVotato.map((id) => membri[id]?.nome).filter(Boolean)
  if (nomi.length === 0) return ''
  return `— ${nomi.join(', ')}`
}

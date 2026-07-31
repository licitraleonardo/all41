import { useState } from 'react'
import './ChatRapida.css'
import Feed from './Feed.jsx'
import FoglioSOS from './FoglioSOS.jsx'
import { useFeed } from '../hooks/useFeed.js'
import { eliminaAzione, inviaAzione } from '../lib/azioni.js'
import { LUNGHEZZA_MAX_TESTO, MINUTI_RIPARTENZA } from '../config/azioni.js'
import { SUONI } from '../config/suoni.js'
import { suona } from '../lib/audio.js'

export default function ChatRapida({ membro, suoniDisponibili = {} }) {
  const { azioni, membri, stato, errore, inserisci, sostituisci } = useFeed()
  const [foglio, setFoglio] = useState(null)
  const [testo, setTesto] = useState('')
  const [inCorso, setInCorso] = useState(false)
  const [avviso, setAvviso] = useState(null)

  async function manda(tipo, payload = {}) {
    setInCorso(true)
    setAvviso(null)
    try {
      const esito = await inviaAzione({ tipo, payload, memberId: membro.id })
      if (!esito.ok) {
        // Allan: il tempo che manca, non una quota residua.
        setAvviso(
          esito.attesa ? `Aspetta ${esito.attesa}s.` : 'Per oggi hai finito.'
        )
        return false
      }
      inserisci(esito.azione)
      setFoglio(null)
      return true
    } catch {
      setAvviso('Non è partita. Riprova quando torna il segnale.')
      return false
    } finally {
      setInCorso(false)
    }
  }

  async function mandaTesto(e) {
    e.preventDefault()
    const pulito = testo.trim()
    if (!pulito || inCorso) return
    if (await manda('free_text', { testo: pulito })) setTesto('')
  }

  // Prima si chiede il permesso, poi si suona: se il limite rifiuta, il
  // suono non deve partire lo stesso a chi ha premuto.
  async function lanciaSuono(s) {
    if (await manda('soundboard', { file: s.file, etichetta: s.etichetta })) {
      suona(s.file)
    }
  }

  async function elimina(id) {
    sostituisci({ id, eliminato: true })
    try {
      await eliminaAzione(id)
    } catch {
      sostituisci({ id, eliminato: false })
      setAvviso('Non è riuscito a togliersi. Riprova.')
    }
  }

  return (
    <div className="gruppo-schermo">
      <div className="azioni">
        {/* SOS non è mai bloccato da niente, in nessuna combinazione. */}
        <button type="button" className="bottone-sos" onClick={() => setFoglio('sos')}>
          🆘 SOS
        </button>

        <div className="azioni-riga">
          {/* Restano cliccabili anche a limite raggiunto: rifiutano
              mostrando l'attesa, invece di spegnersi in silenzio. */}
          <button
            type="button"
            className="azione"
            onClick={() => manda('dove_siete', { posizione: null })}
            disabled={inCorso}
          >
            📍 Dove siete
          </button>

          <button
            type="button"
            className="azione"
            onClick={() => setFoglio(foglio === 'riparte' ? null : 'riparte')}
            disabled={inCorso}
            aria-expanded={foglio === 'riparte'}
          >
            🚗 Si riparte tra…
          </button>
        </div>

        {foglio === 'riparte' && (
          <div className="minuti">
            {MINUTI_RIPARTENZA.map((m) => (
              <button
                key={m}
                type="button"
                className="minuto"
                onClick={() => manda('si_riparte', { minuti: m })}
                disabled={inCorso}
              >
                {m} min
              </button>
            ))}
          </div>
        )}

        <form className="riga-testo" onSubmit={mandaTesto}>
          <input
            type="text"
            value={testo}
            onChange={(e) => setTesto(e.target.value)}
            maxLength={LUNGHEZZA_MAX_TESTO}
            placeholder="Scrivi qualcosa di breve"
            aria-label="Messaggio"
          />
          <button type="submit" className="invia" disabled={!testo.trim() || inCorso}>
            Manda
          </button>
        </form>

        <div className="soundboard">
          {SUONI.map((s) => {
            const manca = suoniDisponibili[s.file] === false
            return (
              <button
                key={s.file}
                type="button"
                className="suono"
                onClick={() => lanciaSuono(s)}
                disabled={manca || inCorso}
                title={manca ? 'File mancante' : undefined}
              >
                {s.etichetta}
              </button>
            )
          })}
        </div>

        {avviso && <p className="avviso">{avviso}</p>}
      </div>

      {stato === 'caricamento' && <p className="feed-vuoto">Un attimo.</p>}
      {stato === 'guasto' && <p className="feed-guasto">{errore}</p>}
      {stato === 'pronto' && (
        <Feed azioni={azioni} membri={membri} ioId={membro.id} onElimina={elimina} />
      )}

      {foglio === 'sos' && (
        <FoglioSOS
          onInvia={(motivo) => manda('sos', { motivo })}
          onAnnulla={() => setFoglio(null)}
          inCorso={inCorso}
        />
      )}
    </div>
  )
}

import { useState } from 'react'
import './ChatRapida.css'
import Feed from './Feed.jsx'
import FoglioSOS from './FoglioSOS.jsx'
import { useFeed } from '../hooks/useFeed.js'
import { eliminaAzione, inviaAzione } from '../lib/azioni.js'
import { descriviErrore } from '../lib/errori.js'
import { dopoInvioRiuscito, dopoRifiuto, dopoSuono } from '../lib/regole.js'
import { LUNGHEZZA_MAX_TESTO, MINUTI_RIPARTENZA } from '../config/azioni.js'
import { SUONI } from '../config/suoni.js'
import { SONDAGGI } from '../config/sondaggi.js'
import { suona } from '../lib/audio.js'
import { creaSondaggio } from '../lib/voti.js'
import { useVoti } from '../hooks/useVoti.js'

export default function ChatRapida({ membro, suoniDisponibili = {} }) {
  const { azioni, membri, stato, errore, inserisci, sostituisci } = useFeed()
  const { voti, vota, aggiorna: aggiornaVoto } = useVoti(azioni)
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
        const attesa = esito.attesa ? `Aspetta ${esito.attesa}s.` : 'Per oggi hai finito.'
        setAvviso(attesa)

        // Legge XIX. I primi due rifiuti non costano niente: un doppio
        // tap non è spam. Dal terzo comincia a pesare.
        dopoRifiuto(membro.id, tipo)
          .then((r) => {
            if (r.scattata) setAvviso(`${attesa} E ti costa ${r.penalita}.`)
          })
          .catch(() => {})

        return false
      }
      dopoInvioRiuscito(membro.id, tipo)
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

  // Il sondaggio si crea prima e si annuncia dopo: se la creazione
  // fallisce, nel feed non resta una riga che punta al nulla.
  async function apriSondaggio(modello) {
    setInCorso(true)
    setAvviso(null)
    try {
      const nuovo = await creaSondaggio(modello)
      aggiornaVoto(nuovo)
      const esito = await inviaAzione({
        tipo: 'poll',
        payload: { voteId: nuovo.id },
        memberId: membro.id,
      })
      if (!esito.ok) {
        setAvviso(`Aspetta ${esito.attesa}s.`)
        return
      }
      inserisci(esito.azione)
      setFoglio(null)
    } catch (e) {
      setAvviso(descriviErrore(e))
    } finally {
      setInCorso(false)
    }
  }

  // Prima si chiede il permesso, poi si suona: se il limite rifiuta, il
  // suono non deve partire lo stesso a chi ha premuto.
  async function lanciaSuono(s) {
    if (await manda('soundboard', { file: s.file, etichetta: s.etichetta })) {
      suona(s.file)
      // Legge VIII, per chi suona nel cuore della notte. Se il
      // rilevamento fallisce, il suono è comunque partito.
      dopoSuono(membro.id)
        .then((scattate) => {
          if (scattate.some((s2) => s2.scopertaNuova)) {
            setAvviso('📜 Nuova Legge scoperta. Guarda il Testamento.')
          }
        })
        .catch(() => {})
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

          <button
            type="button"
            className="azione larga"
            onClick={() => setFoglio(foglio === 'sondaggio' ? null : 'sondaggio')}
            disabled={inCorso}
            aria-expanded={foglio === 'sondaggio'}
          >
            📊 Sondaggio lampo
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

        {foglio === 'sondaggio' && (
          <div className="scelte-sondaggio">
            {SONDAGGI.map((s) => (
              <button
                key={s.id}
                type="button"
                className="scelta-sondaggio"
                onClick={() => apriSondaggio(s)}
                disabled={inCorso}
              >
                {s.domanda}
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
        <Feed
          azioni={azioni}
          membri={membri}
          ioId={membro.id}
          onElimina={elimina}
          voti={voti}
          onVota={(votoId, opzione) => vota(votoId, membro.id, opzione)}
        />
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

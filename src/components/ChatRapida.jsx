import { useEffect, useRef, useState } from 'react'
import './ChatRapida.css'
import Feed from './Feed.jsx'
import FoglioSOS from './FoglioSOS.jsx'
import { useFeed } from '../hooks/useFeed.js'
import { useVoti } from '../hooks/useVoti.js'
import { eliminaAzione, inviaAzione } from '../lib/azioni.js'
import { descriviErrore } from '../lib/errori.js'
import {
  dopoInvioRiuscito,
  dopoRifiuto,
  dopoSuono,
  dopoSuonoPremuto,
  dopoTesto,
  suoniBloccati,
} from '../lib/regole.js'
import { forseAllanCommenta } from '../lib/allan.js'
import { LUNGHEZZA_MAX_TESTO, MINUTI_RIPARTENZA } from '../config/azioni.js'
import { SONDAGGI } from '../config/sondaggi.js'
import { SUONI } from '../config/suoni.js'
import { suona } from '../lib/audio.js'
import { creaSondaggio } from '../lib/voti.js'

export default function ChatRapida({ membro, suoniDisponibili = {} }) {
  const { azioni, membri, stato, errore, inserisci, sostituisci } = useFeed()
  const { voti, vota, aggiorna: aggiornaVoto } = useVoti(azioni)
  const [foglio, setFoglio] = useState(null)
  const [testo, setTesto] = useState('')
  const [inCorso, setInCorso] = useState(false)
  const [avviso, setAvviso] = useState(null)
  const [battuteAllan, setBattuteAllan] = useState([])
  const [bloccati, setBloccati] = useState(new Set())
  const fondo = useRef(null)

  // Un suono spento resta spento anche ricaricando: si deduce dalle
  // penalità nel database, non da uno stato in memoria.
  useEffect(() => {
    suoniBloccati(membro.id)
      .then(setBloccati)
      .catch(() => {})
  }, [membro.id])

  // La chat si legge dal basso: all'arrivo di roba nuova si scende, con
  // un filo di scorrimento visibile così si capisce che è partito.
  useEffect(() => {
    fondo.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [azioni.length, battuteAllan.length])

  async function manda(tipo, payload = {}) {
    setInCorso(true)
    setAvviso(null)
    try {
      const esito = await inviaAzione({ tipo, payload, memberId: membro.id })
      if (!esito.ok) {
        // Legge XIX: insistere su un bottone bloccato costa, con la scala
        // che perdona i primi due tentativi.
        const scala = await dopoRifiuto(membro.id, tipo).catch(() => null)
        setAvviso(
          (esito.attesa ? `Aspetta ${esito.attesa}s.` : 'Per oggi hai finito.') +
            (scala?.penalita ? ' E ti costa -1.' : '')
        )
        return false
      }
      dopoInvioRiuscito(membro.id, tipo)
      inserisci(esito.azione)
      setFoglio(null)
      return esito.azione
    } catch (e) {
      setAvviso(descriviErrore(e))
      return null
    } finally {
      setInCorso(false)
    }
  }

  async function mandaTesto(e) {
    e.preventDefault()
    const pulito = testo.trim()
    if (!pulito || inCorso) return
    const azione = await manda('free_text', { testo: pulito })
    if (!azione) return
    setTesto('')

    const battuta = forseAllanCommenta()
    if (battuta) setBattuteAllan((p) => [...p, battuta])

    dopoTesto(membro.id, pulito, azione.id)
      .then((r) => r.scattata && setAvviso('Quella parola ti costa -2.'))
      .catch(() => {})
  }

  // Il suono parte subito e riparte da capo: il bottone non ha freni, e
  // il menu resta aperto per poterne premere un altro. A regolare gli
  // eccessi ci pensa la Legge XXVII, che spegne il bottone abusato.
  async function lanciaSuono(s) {
    if (bloccati.has(s.file)) {
      setAvviso('Quel suono si è stancato di te. Riprova fra un po’.')
      return
    }

    suona(s.file)
    const azione = await manda('soundboard', { file: s.file, etichetta: s.etichetta })
    if (!azione) return

    dopoSuono(membro.id).catch(() => {})
    dopoSuonoPremuto(membro.id, s.file)
      .then((r) => {
        if (!r.abuso) return
        setBloccati((p) => new Set(p).add(s.file))
        setAvviso(`${s.etichetta} si è stancato di te. Spento per un’ora.`)
      })
      .catch(() => {})
  }

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

  async function elimina(id) {
    sostituisci({ id, eliminato: true })
    try {
      await eliminaAzione(id)
    } catch {
      sostituisci({ id, eliminato: false })
      setAvviso('Non è riuscito a togliersi. Riprova.')
    }
  }

  function alterna(quale) {
    setFoglio((f) => (f === quale ? null : quale))
  }

  return (
    <div className="gruppo-schermo">
      <div className="conversazione">
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
            battuteAllan={battuteAllan}
          />
        )}

        <div ref={fondo} className="fine-chat" />
      </div>

      {/* ------------------------------------------ barra di scrittura */}
      <div className="barra-scrittura">
        {avviso && <p className="avviso">{avviso}</p>}

        {/* Attaccati alla barra e non in cima alla chat: è dov'è il
            pollice, e non fanno scorrere via la conversazione. Col menu
            dei suoni aperto spariscono: due file di pillole diverse una
            sopra l'altra si confondono. */}
        {foglio !== 'suoni' && (
        <div className="azioni-rapide">
          <button type="button" className="bottone-sos" onClick={() => setFoglio('sos')}>
            🆘 SOS
          </button>
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
            className={foglio === 'riparte' ? 'azione aperta' : 'azione'}
            onClick={() => alterna('riparte')}
            disabled={inCorso}
          >
            🚗 Si riparte
          </button>
          <button
            type="button"
            className={foglio === 'sondaggio' ? 'azione aperta' : 'azione'}
            onClick={() => alterna('sondaggio')}
            disabled={inCorso}
          >
            📊 Sondaggio
          </button>
        </div>
        )}

        {foglio === 'riparte' && (
          <div className="menu-su">
            {MINUTI_RIPARTENZA.map((m) => (
              <button
                key={m}
                type="button"
                className="voce-menu"
                onClick={() => manda('si_riparte', { minuti: m })}
                disabled={inCorso}
              >
                {m} min
              </button>
            ))}
          </div>
        )}

        {foglio === 'sondaggio' && (
          <div className="menu-su colonna">
            {SONDAGGI.map((s) => (
              <button
                key={s.id}
                type="button"
                className="voce-menu larga"
                onClick={() => apriSondaggio(s)}
                disabled={inCorso}
              >
                {s.domanda}
              </button>
            ))}
          </div>
        )}

        {foglio === 'suoni' && (
          <div className="menu-su">
            {SUONI.map((s) => (
              <button
                key={s.file}
                type="button"
                className="voce-menu"
                onClick={() => lanciaSuono(s)}
                disabled={suoniDisponibili[s.file] === false || bloccati.has(s.file)}
              >
                {bloccati.has(s.file) ? `${s.etichetta} 🚫` : s.etichetta}
              </button>
            ))}
          </div>
        )}

        <form className="riga-scrittura" onSubmit={mandaTesto}>
          <button
            type="button"
            className={foglio === 'suoni' ? 'tasto-suoni aperto' : 'tasto-suoni'}
            onClick={() => alterna('suoni')}
            aria-label="Suoni"
            aria-expanded={foglio === 'suoni'}
          >
            🔊
          </button>

          <input
            type="text"
            value={testo}
            onChange={(e) => setTesto(e.target.value)}
            maxLength={LUNGHEZZA_MAX_TESTO}
            placeholder="Scrivi qualcosa di breve"
            aria-label="Messaggio"
          />

          <button
            type="submit"
            className="tasto-invio"
            disabled={!testo.trim() || inCorso}
            aria-label="Manda"
          >
            ➤
          </button>
        </form>
      </div>

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

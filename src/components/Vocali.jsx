import { useEffect, useRef, useState } from 'react'
import './Vocali.css'
import { useVocali } from '../hooks/useVocali.js'
import { mandaVocale } from '../lib/vocali.js'
import { avviaRegistrazione, spiegaErroreMicrofono } from '../lib/registratore.js'
import { registrazioneDisponibile } from '../lib/formatoAudio.js'
import { LIMITI } from '../config/limiti.js'
import { urlAvatar } from '../config/avatar.js'
import { descriviErrore } from '../lib/errori.js'

// Il sostituto del walkie-talkie. Si tiene premuto, si parla, si lascia.
//
// Il formato non è scritto nel codice: lo sceglie il browser e si salva
// quello vero insieme al file. È la verifica bloccante n.3 dello spec, e
// il motivo per cui esiste — chi scrive "webm" si ritrova metà gruppo
// muto su iPhone.
export default function Vocali({ membro }) {
  const { vocali, membri, stato, errore, inserisci, togli } = useVocali()

  const sessione = useRef(null)
  const [registrando, setRegistrando] = useState(false)
  const [secondi, setSecondi] = useState(0)
  const [inCorso, setInCorso] = useState(false)
  const [avviso, setAvviso] = useState(null)
  const [suona, setSuona] = useState(null)

  const puoRegistrare = registrazioneDisponibile()

  async function premi() {
    if (registrando || inCorso) return
    setAvviso(null)
    setSecondi(0)

    try {
      sessione.current = await avviaRegistrazione({
        onSecondi: setSecondi,
        onFermato: () => setRegistrando(false),
      })
      setRegistrando(true)
    } catch (e) {
      setAvviso(spiegaErroreMicrofono(e))
    }
  }

  async function lascia() {
    const corrente = sessione.current
    if (!corrente) return
    sessione.current = null

    corrente.ferma()
    setRegistrando(false)

    const registrato = await corrente.chiusura

    // Sotto il secondo è un tocco per sbaglio, non un messaggio.
    if (registrato.durata < 1 || registrato.blob.size < 500) {
      setAvviso(null)
      return
    }

    setInCorso(true)
    try {
      const esito = await mandaVocale(registrato, membro.id)
      if (!esito.ok) {
        setAvviso(
          esito.motivo === 'giorno'
            ? `${LIMITI.voice.giorno} vocali al giorno. Li hai finiti.`
            : `Aspetta ${esito.attesa}s.`
        )
        return
      }
      inserisci(esito.vocale)
      setAvviso(null)
    } catch (e) {
      setAvviso(`Non è partito. ${descriviErrore(e)}`)
    } finally {
      setInCorso(false)
      setSecondi(0)
    }
  }

  return (
    <div className="vocali">
      {stato === 'caricamento' && <p className="voc-vuoto">Un attimo.</p>}
      {stato === 'guasto' && <p className="voc-guasto">{errore}</p>}

      {stato === 'pronto' && vocali.length === 0 && (
        <p className="voc-vuoto">
          Nessuno ha ancora detto niente. Tieni premuto qui sotto e parla.
        </p>
      )}

      <ul className="voc-elenco">
        {vocali.map((v) => (
          <Vocale
            key={v.id}
            vocale={v}
            autore={membri[v.autoreId]}
            mio={v.autoreId === membro.id}
            inAscolto={suona === v.id}
            onAscolta={setSuona}
            onElimina={() => togli(v.id)}
          />
        ))}
      </ul>

      {avviso && <p className="voc-avviso">{avviso}</p>}

      {!puoRegistrare ? (
        <p className="voc-guasto">
          Questo browser non sa registrare. Serve una connessione sicura (https).
        </p>
      ) : (
        <div className="voc-barra">
          <button
            type="button"
            className={registrando ? 'voc-premi attivo' : 'voc-premi'}
            onPointerDown={premi}
            onPointerUp={lascia}
            onPointerCancel={lascia}
            onPointerLeave={registrando ? lascia : undefined}
            disabled={inCorso}
          >
            {inCorso
              ? 'Mando…'
              : registrando
                ? `Sto registrando — ${LIMITI.voice.durataMax - secondi}s`
                : 'Tieni premuto e parla'}
          </button>

          {registrando && (
            <div className="voc-avanzamento" role="presentation">
              <span style={{ width: `${(secondi / LIMITI.voice.durataMax) * 100}%` }} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Vocale({ vocale, autore, mio, inAscolto, onAscolta, onElimina }) {
  const suono = useRef(null)

  useEffect(() => {
    return () => suono.current?.pause()
  }, [])

  function ascolta() {
    if (inAscolto) {
      suono.current?.pause()
      onAscolta(null)
      return
    }

    // Si crea al tocco, quindi dentro un gesto dell'utente: è l'unico
    // modo perché iOS lo lasci partire.
    const audio = new Audio(vocale.url)
    suono.current = audio
    audio.onended = () => onAscolta(null)
    audio.onerror = () => onAscolta(null)
    audio.play().catch(() => onAscolta(null))
    onAscolta(vocale.id)
  }

  return (
    <li className={mio ? 'voc mio' : 'voc'}>
      <button
        type="button"
        className="voc-play"
        onClick={ascolta}
        aria-label={inAscolto ? 'Ferma' : 'Ascolta'}
      >
        {inAscolto ? '⏸' : '▶'}
      </button>

      <img
        className="voc-avatar"
        src={urlAvatar(autore?.avatarStyle, autore?.avatarSeed || '?')}
        alt=""
        width="28"
        height="28"
      />

      <span className="voc-chi">
        {autore?.nome ?? 'Qualcuno'}
        <span className="voc-quando">
          {vocale.durata}s · {quando(vocale.creatoIl)}
        </span>
      </span>

      {mio && (
        <button type="button" className="voc-elimina" onClick={onElimina} aria-label="Elimina">
          ×
        </button>
      )}
    </li>
  )
}

function quando(iso) {
  return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

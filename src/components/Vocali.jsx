import { useEffect, useMemo, useRef, useState } from 'react'
import './Vocali.css'
import { useVocali } from '../hooks/useVocali.js'
import { mandaVocale } from '../lib/vocali.js'
import { avviaRegistrazione, spiegaErroreMicrofono } from '../lib/registratore.js'
import { registrazioneDisponibile } from '../lib/formatoAudio.js'
import { LIMITI } from '../config/limiti.js'
import { coloreNome, urlAvatar } from '../config/avatar.js'
import { descriviErrore } from '../lib/errori.js'
import Rotella from './Rotella.jsx'

// Quanto bisogna salire col dito perche' il vocale parta segnato.
const TRASCINAMENTO = 60

// Il sostituto del walkie-talkie. Si tiene premuto, si parla, si lascia.
//
// Impaginato come una chat, perché è una chat: i tuoi a destra, quelli
// degli altri a sinistra con avatar e nome, l'ultimo in fondo e si
// scorre da sola quando arriva roba nuova.
//
// Il formato non è scritto nel codice: lo sceglie il browser e si salva
// quello vero insieme al file. È la verifica bloccante n.3 dello spec.
export default function Vocali({ membro }) {
  const { vocali, membri, stato, errore, inserisci, togli } = useVocali()

  const sessione = useRef(null)
  const fondo = useRef(null)
  const [registrando, setRegistrando] = useState(false)
  const [secondi, setSecondi] = useState(0)
  const [inCorso, setInCorso] = useState(false)
  const [avviso, setAvviso] = useState(null)
  const [suona, setSuona] = useState(null)
  const [importante, setImportante] = useState(false)

  const puoRegistrare = registrazioneDisponibile()

  // Dal database arrivano dal più recente: qui si legge dall'alto in
  // basso come una conversazione.
  const inOrdine = useMemo(() => [...vocali].reverse(), [vocali])

  // Stesso difetto della chat, qui ancora addormentato: l'elenco si
  // ferma a TETTO_VOCALI, quindi da li' in poi un vocale nuovo ne fa
  // cadere uno vecchio e il numero non cambia. Si guarda l'id
  // dell'ultimo. E senza animazione, che non arriva mai in fondo se
  // intanto la pagina cresce.
  useEffect(() => {
    fondo.current?.scrollIntoView({ behavior: 'auto', block: 'end' })
  }, [vocali[0]?.id])

  // Se si cambia scheda mentre si tiene premuto, il microfono resta
  // acceso: su iPhone l'indicatore arancione non si spegne piu' e sembra
  // che l'app stia ascoltando di nascosto. `annulla` esisteva apposta e
  // non la chiamava nessuno.
  useEffect(() => {
    return () => {
      sessione.current?.annulla()
      sessione.current = null
    }
  }, [])

  // Si tiene premuto e si parla; trascinando in su il tasto diventa
  // rosso e il vocale parte segnato. Un gesto solo invece di un
  // interruttore da ricordarsi di spegnere: il dito e' gia' li'.
  const partenzaY = useRef(0)

  function muovi(e) {
    if (!registrando) return
    setImportante(partenzaY.current - e.clientY >= TRASCINAMENTO)
  }

  async function premi(e) {
    if (registrando || inCorso) return
    setAvviso(null)
    setSecondi(0)
    partenzaY.current = e.clientY
    setImportante(false)

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
      const esito = await mandaVocale({ ...registrato, importante }, membro.id)
      if (!esito.ok) {
        setAvviso(`Aspetta ${esito.attesa}s.`)
        return
      }
      inserisci(esito.vocale)
      setImportante(false)
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
      {stato === 'caricamento' && <Rotella />}
      {stato === 'guasto' && <p className="voc-guasto">{errore}</p>}

      {stato === 'pronto' && vocali.length === 0 && (
        <p className="voc-vuoto">
          Nessuno ha ancora detto niente. Tieni premuto qui sotto e parla.
        </p>
      )}

      <ul className="voc-elenco">
        {inOrdine.map((v) => (
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
        <li ref={fondo} className="voc-fine" />
      </ul>

      {avviso && <p className="voc-avviso">{avviso}</p>}

      {!puoRegistrare ? (
        <p className="voc-guasto">
          Questo browser non sa registrare. Serve una connessione sicura (https).
        </p>
      ) : (
        <div className="voc-barra">
          <div className="voc-tasti">
            <button
              type="button"
              className={
                registrando
                  ? importante
                    ? 'voc-premi attivo segnato'
                    : 'voc-premi attivo'
                  : 'voc-premi'
              }
              onPointerDown={premi}
              onPointerMove={muovi}
              onPointerUp={lascia}
              onPointerCancel={lascia}
              onPointerLeave={registrando ? lascia : undefined}
              disabled={inCorso}
              aria-label="Tieni premuto e parla, trascina in su per segnarlo"
            >
              <Microfono grande={!registrando && !inCorso} />
              {inCorso
                ? 'Mando…'
                : registrando
                  ? `${LIMITI.voice.durataMax - secondi}s`
                  : ''}
            </button>
          </div>

          {registrando && (
            <p className={importante ? 'voc-gesto segnato' : 'voc-gesto'}>
              {importante ? '❗ Parte come importante' : 'Trascina in su per segnarlo'}
            </p>
          )}

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

  // Quando parte un altro vocale questo deve tacere. Senza, il secondo
  // tocco ne fa suonare due insieme: il primo non lo ferma nessuno,
  // perche' il suo bottone non viene piu' toccato.
  useEffect(() => {
    if (inAscolto || !suono.current) return
    suono.current.pause()
    suono.current = null
  }, [inAscolto])

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

  const classi = ['voc-riga']
  if (mio) classi.push('mio')
  if (vocale.importante) classi.push('importante')

  return (
    <li className={classi.join(' ')}>
      {!mio && (
        <img
          className="voc-avatar"
          src={urlAvatar(autore?.avatarStyle, autore?.avatarSeed || '?')}
          alt=""
          width="30"
          height="30"
        />
      )}

      <div className="voc-bolla">
        {!mio && (
          <span className="voc-autore" style={{ color: coloreNome(vocale.autoreId) }}>
            {autore?.nome ?? 'Qualcuno'}
          </span>
        )}

        <div className="voc-dentro">
          <button
            type="button"
            className="voc-play"
            onClick={ascolta}
            aria-label={inAscolto ? 'Ferma' : 'Ascolta'}
          >
            {inAscolto ? '⏸' : '▶'}
          </button>

          <span className="voc-onda" aria-hidden="true">
            {ONDA.map((h, i) => (
              <span key={i} style={{ height: `${h}px` }} />
            ))}
          </span>

          <span className="voc-durata">{vocale.durata}s</span>
        </div>

        <span className="voc-piede">
          {vocale.importante && <span className="voc-bollino">❗ importante</span>}
          {quando(vocale.creatoIl)}
          {mio && (
            <button type="button" className="voc-elimina" onClick={onElimina}>
              elimina
            </button>
          )}
        </span>
      </div>
    </li>
  )
}

// Un microfono disegnato invece dell'emoji: sul tasto grande l'emoji
// resta multicolore anche quando il tasto diventa corallo, e stona.
// Così prende il colore del testo che ha accanto.
function Microfono({ grande = false }) {
  const lato = grande ? 26 : 20
  return (
    <svg
      className="voc-mic"
      viewBox="0 0 24 24"
      width={lato}
      height={lato}
      aria-hidden="true"
    >
      <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" fill="currentColor" />
      <path
        d="M5 11a1 1 0 0 1 2 0 5 5 0 0 0 10 0 1 1 0 0 1 2 0 7 7 0 0 1-6 6.93V20h2a1 1 0 0 1 0 2H9a1 1 0 0 1 0-2h2v-2.07A7 7 0 0 1 5 11Z"
        fill="currentColor"
      />
    </svg>
  )
}

// Un'onda finta: disegnare quella vera vorrebbe dire decodificare
// l'audio di ogni messaggio all'apertura della scheda, per un dettaglio
// che nessuno guarda davvero. Serve solo a dire "questo è un audio".
const ONDA = [6, 11, 17, 9, 20, 14, 8, 16, 11, 19, 7, 13, 10, 15, 6]

function quando(iso) {
  return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

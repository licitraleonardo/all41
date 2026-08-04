import { scegliFormato } from './formatoAudio.js'
import { LIMITI } from '../config/limiti.js'

// Push-to-talk: si tiene premuto, si registra, si lascia, parte.
//
// Il limite di durata si impone QUI, in registrazione, con lo stop
// automatico: dirlo dopo che uno ha parlato due minuti sarebbe una presa
// in giro, e i due minuti sono comunque finiti nello storage.

export async function avviaRegistrazione({ onSecondi, onFermato } = {}) {
  const flusso = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  })

  const mimeType = scegliFormato()
  const registratore = new MediaRecorder(flusso, mimeType ? { mimeType } : undefined)
  const pezzi = []
  const inizio = Date.now()

  registratore.ondataavailable = (e) => {
    if (e.data?.size > 0) pezzi.push(e.data)
  }

  const battito = setInterval(() => {
    const secondi = Math.floor((Date.now() - inizio) / 1000)
    onSecondi?.(secondi)
    if (secondi >= LIMITI.voice.durataMax) ferma()
  }, 200)

  let risolviChiusura
  const chiusura = new Promise((r) => {
    risolviChiusura = r
  })

  registratore.onstop = () => {
    clearInterval(battito)
    // Il microfono va spento davvero: su iPhone resta l'indicatore
    // arancione acceso e sembra che l'app stia ascoltando di nascosto.
    flusso.getTracks().forEach((t) => t.stop())

    const durata = Math.max(1, Math.round((Date.now() - inizio) / 1000))
    // Il tipo VERO, quello che il browser ha davvero prodotto: non
    // quello che gli avevamo chiesto.
    const tipo = registratore.mimeType || mimeType || pezzi[0]?.type || 'audio/webm'

    risolviChiusura({ blob: new Blob(pezzi, { type: tipo }), mimeType: tipo, durata })
    onFermato?.()
  }

  function ferma() {
    if (registratore.state !== 'inactive') registratore.stop()
  }

  function annulla() {
    clearInterval(battito)
    flusso.getTracks().forEach((t) => t.stop())
    if (registratore.state !== 'inactive') registratore.stop()
  }

  registratore.start()

  return { ferma, annulla, chiusura, mimeType }
}

// I messaggi dicono cosa fare, non il codice dell'errore.
export function spiegaErroreMicrofono(e) {
  const nome = e?.name ?? ''

  if (nome === 'NotAllowedError' || nome === 'SecurityError') {
    return 'Hai detto di no al microfono. Si cambia nelle impostazioni del browser.'
  }
  if (nome === 'NotFoundError') return 'Non trovo un microfono su questo dispositivo.'
  if (nome === 'NotReadableError') {
    return 'Il microfono è occupato da un’altra app. Chiudila e riprova.'
  }
  return 'Il microfono non parte. Serve una connessione sicura (https).'
}

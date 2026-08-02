// Verifica bloccante n.2 dello spec.
//
// I browser bloccano la riproduzione finché l'utente non ha interagito con
// la pagina. Il soundboard globale — un suono lanciato da un altro che
// parte sul mio telefono — funziona solo se ho già toccato qualcosa in
// questa sessione.
//
// La differenza fra "sembra rotto a caso" e "funziona" sta tutta qui: si
// sblocca UN AudioContext al primo tap e si riusa quello, invece di
// creare un new Audio() al volo sperando che parta.

let contesto = null
let sbloccato = false
const buffer = new Map()

function ctx() {
  if (contesto) return contesto
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  contesto = new AC()
  return contesto
}

export function audioSbloccato() {
  return sbloccato && contesto?.state === 'running'
}

export async function sbloccaAudio() {
  const c = ctx()
  if (!c) return false
  try {
    if (c.state === 'suspended') await c.resume()
    // Un buffer muto da un campione: certi browser non considerano
    // sbloccato un contesto finché non ha suonato qualcosa davvero.
    const muto = c.createBuffer(1, 1, c.sampleRate)
    const sorgente = c.createBufferSource()
    sorgente.buffer = muto
    sorgente.connect(c.destination)
    sorgente.start(0)
    sbloccato = c.state === 'running'
    return sbloccato
  } catch {
    return false
  }
}

// Decodificato una volta e tenuto in memoria: al momento del tap non c'è
// tempo per una fetch, il suono deve partire subito.
export async function precarica(file) {
  if (buffer.has(file)) return buffer.get(file)
  const c = ctx()
  if (!c) throw new Error('AudioContext non disponibile')

  const risposta = await fetch(`/sounds/${file}`)
  if (!risposta.ok) throw new Error(`${file}: HTTP ${risposta.status}`)

  const decodificato = await c.decodeAudioData(await risposta.arrayBuffer())
  buffer.set(file, decodificato)
  return decodificato
}

// Una sorgente per file: ripremendo, quella in corso si ferma e il suono
// riparte da capo invece di sovrapporsi a sé stesso.
const inRiproduzione = new Map()

export async function suona(file) {
  const c = ctx()
  if (!c) return false
  try {
    if (c.state === 'suspended') await c.resume()
    const b = buffer.get(file) ?? (await precarica(file))

    try {
      inRiproduzione.get(file)?.stop()
    } catch {
      // Era già finita da sola: non è un problema.
    }

    const sorgente = c.createBufferSource()
    sorgente.buffer = b
    sorgente.connect(c.destination)
    sorgente.onended = () => {
      if (inRiproduzione.get(file) === sorgente) inRiproduzione.delete(file)
    }
    inRiproduzione.set(file, sorgente)
    sorgente.start(0)
    return true
  } catch {
    return false
  }
}

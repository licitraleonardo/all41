import { LATO_LUNGO_MAX, QUALITA } from '../config/foto.js'

// Ridimensiona e riesporta in JPEG. Restituisce il blob compresso più le
// dimensioni finali, che servono alla griglia per non far ballare il
// layout mentre le immagini arrivano.
//
// onStato riceve un avviso quando serve un passaggio lento, così l'utente
// non guarda un bottone fermo per cinque secondi.
export async function comprimi(file, { onStato } = {}) {
  const immagine = await apri(file, onStato)
  const { width, height } = misura(immagine.width, immagine.height)

  const tela = document.createElement('canvas')
  tela.width = width
  tela.height = height
  tela.getContext('2d').drawImage(immagine, 0, 0, width, height)
  immagine.close?.()

  const blob = await new Promise((risolvi) =>
    tela.toBlob(risolvi, 'image/jpeg', QUALITA)
  )
  if (!blob) throw new Error(`Compressione fallita (${descriviFile(file)}).`)

  return { blob, width, height, primaByte: file.size, dopoByte: blob.size }
}

// I file della famiglia HEIF cominciano con una scatola "ftyp": i byte
// 4-8 sono la sigla, gli 8-12 il marchio del formato. Si guardano dodici
// byte invece di fidarsi dell'estensione, così si riconosce anche un HEIC
// arrivato con nome .jpg — cosa che succede spesso passando dalle chat.
//
// L'AVIF usa la stessa scatola ma i browser lo aprono da soli, quindi non
// è in elenco: mandarlo al decodificatore sarebbe lavoro sprecato.
const MARCHI_HEIF = [
  'heic',
  'heix',
  'hevc',
  'hevx',
  'heim',
  'heis',
  'hevm',
  'hevs',
  'mif1',
  'msf1',
]

export async function eHeif(file) {
  try {
    const testa = new Uint8Array(await file.slice(0, 12).arrayBuffer())
    if (testa.length < 12) return false

    const sigla = String.fromCharCode(...testa.subarray(4, 8))
    if (sigla !== 'ftyp') return false

    // Il marchio occupa quattro byte, riempiti di zeri quando la sigla è
    // più corta. Si filtrano come numeri invece che come testo, così nel
    // sorgente non finisce nessun carattere di controllo.
    const marchio = String.fromCharCode(
      ...[...testa.subarray(8, 12)].filter((b) => b > 32)
    )

    return MARCHI_HEIF.includes(marchio)
  } catch {
    return false
  }
}

// Il decodificatore pesa tre mega: si scarica solo qui, la prima volta
// che qualcuno carica davvero un HEIC. Chi non ne carica mai non ne
// prende un byte.
async function decodificaHeif(file, onStato) {
  onStato?.('È una foto iPhone. La converto, ci vuole qualche secondo.')
  const { heicTo } = await import('heic-to')
  return heicTo({ blob: file, type: 'bitmap' })
}

function descriviFile(file) {
  const mb = (file.size / 1048576).toFixed(1)
  return `${file.type || 'tipo sconosciuto'}, ${mb} MB`
}

// Le foto scattate in verticale hanno l'orientamento nei metadati, non nei
// pixel: senza leggerlo, sul canvas finiscono coricate.
async function apri(file, onStato) {
  // Succede scegliendo da Google Foto una immagine che sta solo nel cloud:
  // Android consegna un file vuoto invece di scaricarla.
  if (file.size === 0) {
    throw new Error(
      'Il file arriva vuoto. Di solito succede scegliendo una foto che sta ' +
        'solo su Google Foto e non sul telefono: scaricala prima, o scegli da Galleria.'
    )
  }

  if (await eHeif(file)) return decodificaHeif(file, onStato)

  const motivi = []

  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch (e) {
      motivi.push(`bitmap: ${e?.message || e}`)
    }
    // Certi browser conoscono createImageBitmap ma non l'opzione
    // sull'orientamento, e falliscono solo per quella.
    try {
      return await createImageBitmap(file)
    } catch (e) {
      motivi.push(`bitmap semplice: ${e?.message || e}`)
    }
  }

  const url = URL.createObjectURL(file)
  try {
    return await new Promise((risolvi, rifiuta) => {
      const img = new Image()
      img.onload = () => risolvi(img)
      img.onerror = () => rifiuta(new Error('img: decodifica rifiutata'))
      img.src = url
    })
  } catch (e) {
    motivi.push(e?.message || String(e))
    throw new Error(
      `Non riesco ad aprire questo file (${descriviFile(file)}). ${motivi.join(' · ')}`
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}

function misura(larghezza, altezza) {
  const lato = Math.max(larghezza, altezza)
  if (lato <= LATO_LUNGO_MAX) return { width: larghezza, height: altezza }

  const fattore = LATO_LUNGO_MAX / lato
  return {
    width: Math.round(larghezza * fattore),
    height: Math.round(altezza * fattore),
  }
}

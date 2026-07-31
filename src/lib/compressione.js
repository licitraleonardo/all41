import { LATO_LUNGO_MAX, QUALITA } from '../config/foto.js'

// Ridimensiona e riesporta in JPEG. Restituisce il blob compresso più le
// dimensioni finali, che servono alla griglia per non far ballare il
// layout mentre le immagini arrivano.
export async function comprimi(file) {
  const immagine = await apri(file)
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

// L'HEIC è il formato di default delle foto iPhone. Nessun browser lo
// decodifica senza una libreria a parte, quindi conviene dirlo chiaro
// invece di lasciare un errore generico.
function eHeic(file) {
  return (
    /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name || '')
  )
}

function descriviFile(file) {
  const mb = (file.size / 1048576).toFixed(1)
  return `${file.type || 'tipo sconosciuto'}, ${mb} MB`
}

// Le foto scattate in verticale hanno l'orientamento nei metadati, non nei
// pixel: senza leggerlo, sul canvas finiscono coricate.
async function apri(file) {
  if (eHeic(file)) {
    throw new Error(
      'È una foto in HEIC, il formato dell’iPhone: il browser non sa aprirla. ' +
        'Sul telefono che l’ha scattata, Impostazioni → Fotocamera → Formati → Massima compatibilità.'
    )
  }

  // Succede scegliendo da Google Foto una immagine che sta solo nel cloud:
  // Android consegna un file vuoto invece di scaricarla.
  if (file.size === 0) {
    throw new Error(
      'Il file arriva vuoto. Di solito succede scegliendo una foto che sta ' +
        'solo su Google Foto e non sul telefono: scaricala prima, o scegli da Galleria.'
    )
  }

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

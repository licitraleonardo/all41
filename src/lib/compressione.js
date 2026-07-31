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
  if (!blob) throw new Error('Non sono riuscito a comprimere la foto.')

  return { blob, width, height, primaByte: file.size, dopoByte: blob.size }
}

// Le foto scattate in verticale hanno l'orientamento nei metadati, non nei
// pixel: senza questo, sul canvas finiscono coricate.
async function apri(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      // Browser vecchi che non conoscono l'opzione: si passa al fallback.
    }
  }

  const url = URL.createObjectURL(file)
  try {
    return await new Promise((risolvi, rifiuta) => {
      const img = new Image()
      img.onload = () => risolvi(img)
      img.onerror = () => rifiuta(new Error('Non riesco ad aprire questo file.'))
      img.src = url
    })
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

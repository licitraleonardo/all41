// Le foto che non sono riuscite a partire, tenute sul telefono finché
// non ce la fanno.
//
// Serve più di quanto sembri. "📷 Scatta" apre la fotocamera con
// `capture`, e su iPhone e quasi tutti gli Android quella foto NON
// finisce nel rullino: è un file temporaneo consegnato solo alla pagina.
// Se l'upload falliva restava in uno useState, cioè in memoria: bastava
// bloccare lo schermo perché il sistema uccidesse la PWA, e la foto del
// tramonto non esisteva più da nessuna parte.
//
// IndexedDB e non localStorage perché qui dentro ci vanno dei Blob, che
// localStorage non sa tenere — e trasformarli in base64 li gonfia di un
// terzo per poi doverli riconvertire.

const DB = 'all41'
const DEPOSITO = 'foto-in-coda'

// Oltre questo non si accumula: se il viaggio finisce con venti foto mai
// partite, il problema non è la coda.
export const MASSIMO_IN_CODA = 20

function apri() {
  return new Promise((risolvi, rifiuta) => {
    if (typeof indexedDB === 'undefined') {
      rifiuta(new Error('Niente IndexedDB'))
      return
    }
    const richiesta = indexedDB.open(DB, 1)
    richiesta.onupgradeneeded = () => {
      const db = richiesta.result
      if (!db.objectStoreNames.contains(DEPOSITO)) {
        db.createObjectStore(DEPOSITO, { keyPath: 'id' })
      }
    }
    richiesta.onsuccess = () => risolvi(richiesta.result)
    richiesta.onerror = () => rifiuta(richiesta.error)
  })
}

function transazione(db, modo) {
  return db.transaction(DEPOSITO, modo).objectStore(DEPOSITO)
}

function attendi(richiesta) {
  return new Promise((risolvi, rifiuta) => {
    richiesta.onsuccess = () => risolvi(richiesta.result)
    richiesta.onerror = () => rifiuta(richiesta.error)
  })
}

// Tutte le voci in coda, dalla più vecchia: si riprova nell'ordine in cui
// sono state scattate.
export async function leggiCoda() {
  try {
    const db = await apri()
    const voci = await attendi(transazione(db, 'readonly').getAll())
    db.close()
    return (voci ?? []).sort((a, b) => a.quando - b.quando)
  } catch {
    return []
  }
}

export async function accoda(voce) {
  try {
    const db = await apri()
    const quante = await attendi(transazione(db, 'readonly').count())
    if (quante >= MASSIMO_IN_CODA) {
      db.close()
      return false
    }
    await attendi(transazione(db, 'readwrite').put(voce))
    db.close()
    return true
  } catch {
    // Navigazione privata, quota piena, browser vecchio: si perde la
    // coda, non la foto appena scattata — quella è ancora a schermo.
    return false
  }
}

export async function togliDallaCoda(id) {
  try {
    const db = await apri()
    await attendi(transazione(db, 'readwrite').delete(id))
    db.close()
    return true
  } catch {
    return false
  }
}

// Il nome che si mostra: quello del file se ce l'ha, altrimenti l'ora in
// cui è stata scattata. Le foto da fotocamera spesso non hanno un nome
// utile, e "image.jpg" non aiuta a capire quale sia.
export function etichetta(voce) {
  if (voce.nome && voce.nome !== 'image.jpg') return voce.nome
  return `Foto delle ${new Date(voce.quando).toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

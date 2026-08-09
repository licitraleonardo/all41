// La metà mancante dell'offline. L'app si apriva già senza rete — il
// service worker fa il suo — ma sopra non c'era niente da guardare.
//
// Con Supabase la copia locale va scritta a mano: la riga di
// configurazione promessa dallo spec esiste per Firestore, non qui.
//
// Il patto è uno solo: ogni lettura andata a buon fine lascia una copia,
// e quando la rete non risponde si restituisce quella invece di un
// errore. Vale per la roba da guardare e basta — i contatori dei limiti
// continuano a contarsi dal database, altrimenti basterebbe mettersi in
// aereo mode per spammare a piacere.

import { SECONDI_LETTURA } from '../config/rete.js'
import { conScadenza, eScaduta } from './scadenza.js'

const PREFISSO = 'all41.cache.'

// Da alzare ogni volta che cambia la forma di quello che si legge, o le
// copie vecchie tornano indietro come dati buoni. È già servito: le
// spese sono passate da un pagante solo a un elenco di paganti, e una
// copia della forma vecchia avrebbe fatto sbagliare i conti a chi
// riapriva l'app senza rete.
const VERSIONE = 2

// ------------------------------------------------------ parte pura
// Niente localStorage qui dentro, così si prova da riga di comando.

export function impacchetta(dati, quando = new Date().toISOString()) {
  return JSON.stringify({ v: VERSIONE, quando, dati })
}

export function interpreta(testo) {
  if (!testo) return null

  let letto
  try {
    letto = JSON.parse(testo)
  } catch {
    return null
  }

  // Versione diversa vuol dire che la forma dei dati è cambiata da quando
  // la copia è stata scritta: si butta, invece di dare in pasto ai
  // componenti roba di un'altra epoca.
  if (!letto || letto.v !== VERSIONE || !('dati' in letto)) return null

  return { dati: letto.dati, quando: letto.quando ?? null }
}

// Il ripiego sulla copia vale solo quando è caduta la rete. Su una
// tabella mancante o su una regola di sicurezza che rifiuta, l'errore
// deve restare visibile: servire una copia al posto di un guasto vero
// manda a cercare il problema dove non è, ed è già costato tre giri in
// questo progetto.
export function sembraRete(e, inLinea = true) {
  if (!inLinea) return true
  if (e?.name === 'TypeError') return true
  const testo = e?.message || String(e ?? '')
  return /failed to fetch|networkerror|load failed|network request failed/i.test(testo)
}

// ------------------------------------------------- parte col browser

export function inCache(chiave, dati) {
  try {
    localStorage.setItem(PREFISSO + chiave, impacchetta(dati))
  } catch {
    // Quota piena, o Safari in navigazione privata. Si svuota e si
    // riprova una volta: la cache è una comodità, non un dato da
    // difendere, e non vale un errore in faccia a nessuno.
    try {
      svuotaCache()
      localStorage.setItem(PREFISSO + chiave, impacchetta(dati))
    } catch {
      // Pazienza: si resta senza copia.
    }
  }
}

export function daCache(chiave) {
  try {
    return interpreta(localStorage.getItem(PREFISSO + chiave))
  } catch {
    return null
  }
}

export function svuotaCache() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFISSO))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    // Vedi sopra.
  }
}

// Si avvolge attorno a una lettura e non cambia come si chiama: chi la
// usa non sa che esiste una copia.
//
// `chiave` può essere una funzione degli argomenti, per le letture che
// dipendono da un id. Se restituisce null la lettura non viene copiata —
// serve alle pagine successive dell'album, che sovrascriverebbero la
// prima con un pezzo di mezzo.
export function conCache(chiave, lettura) {
  return async (...argomenti) => {
    const k = typeof chiave === 'function' ? chiave(...argomenti) : chiave
    // Anche senza copia da servire, la scadenza serve: una lettura appesa
    // qui inchioda comunque chi l'aspetta.
    if (!k) return conScadenza(lettura(...argomenti), SECONDI_LETTURA * 1000)

    try {
      // ⚠️ La scadenza sta QUI e non attorno a chi legge, ed è la
      // differenza fra correggere e peggiorare. Il ripiego sulla copia
      // vive dentro questo `catch`: mettendo il tetto un livello più su —
      // dentro `useSpese`, per dire — l'errore di scadenza non passerebbe
      // mai di qui, e si passerebbe da una rotella eterna a un cartello
      // d'errore **con i dati buoni in tasca**.
      const dati = await conScadenza(lettura(...argomenti), SECONDI_LETTURA * 1000)
      inCache(k, dati)
      return dati
    } catch (e) {
      // ⚠️ `eScaduta` prima di `sembraRete`, e non è ridondante: una
      // lettura che resta appesa NON è un errore di rete per `sembraRete`
      // — il suo messaggio è "Ci sta mettendo troppo" — quindi senza
      // questa riga verrebbe rilanciata come guasto vero e la copia non
      // verrebbe servita proprio nel caso più comune.
      //
      // Ed è il caso più comune davvero: con una tacca di segnale la
      // fetch non fallisce, aspetta. Prima di questa riga la copia
      // offline copriva il caso raro (aereo mode) e non quello normale.
      if (!eScaduta(e) && !sembraRete(e, navigator.onLine !== false)) throw e

      const copia = daCache(k)
      if (!copia) throw e

      console.info(
        `[all41] ${eScaduta(e) ? 'troppo lenta' : 'senza rete'}: "${k}" dalla copia del ${copia.quando}`
      )
      return copia.dati
    }
  }
}

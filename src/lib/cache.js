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

// ------------------------------------------------- dirlo a chi guarda
//
// ⚠️ Il campo `quando` di ogni copia esisteva gia', si rileggeva a ogni
// ripiego, e finiva **solo in un `console.info`**. Cioe': l'app serviva
// dati di due ore prima e non lo diceva da nessuna parte.
//
// La striscia «Niente rete» non bastava, e il motivo e' preciso: guarda
// `navigator.onLine`, che con una tacca di segnale dice *sono online*.
// Proprio nel caso piu' comune — la rete che c'e' ma non risponde — la
// striscia non compariva e la copia vecchia passava per roba di adesso.
//
// Questo e' un canale laterale: nessuna firma cambia, chi legge non deve
// sapere niente, e chi vuole dirlo a schermo si iscrive.
const ascoltatori = new Set()

// La copia piu' VECCHIA servita da quando l'ultima lettura e' andata a
// buon fine. La piu' vecchia e non l'ultima: e' quella che dice la verita'
// peggiore su cosa c'e' a schermo.
let copiaServita = null

export function quandoSiRipiega(ascoltatore) {
  ascoltatori.add(ascoltatore)
  ascoltatore(copiaServita)
  return () => ascoltatori.delete(ascoltatore)
}

function avvisa() {
  for (const a of ascoltatori) {
    try {
      a(copiaServita)
    } catch {
      // Un ascoltatore rotto non deve impedire una lettura.
    }
  }
}

// Una lettura riuscita vuol dire che la rete e' tornata a rispondere: da
// qui in poi quello che c'e' a schermo si sta rinfrescando, e la striscia
// deve andarsene da sola senza che nessuno tocchi niente.
function segnaFresco() {
  if (!copiaServita) return
  copiaServita = null
  avvisa()
}

function segnaCopia(quando) {
  if (!quando) return
  if (copiaServita && copiaServita.quando <= quando) return
  copiaServita = { quando }
  avvisa()
}

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
  const conRipiego = async (...argomenti) => {
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
      segnaFresco()
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
      segnaCopia(copia.quando)
      return copia.dati
    }
  }

  // ⚠️ La stessa lettura, ma SENZA ripiego: o è roba di adesso, o solleva.
  //
  // Serve a chi non deve guardare, ma DECIDERE. Il patto scritto in cima a
  // questo file — «una copia vecchia invece di un errore» — è giusto per
  // tutto quello che si legge e basta, ed è quello che rende l'app usabile
  // in Sardegna. Ma cinque letture su sedici finiscono dentro decisioni
  // definitive: assegnare la Legge XX del record della Pecora, chiudere una
  // sfida della caccia, pagare il premio finale da 10 punti, contare il
  // quorum di una proposta, far scattare «sotto zero». Sono punti con una
  // `dedupeKey`, e i punti NON si revocano: il primo telefono che decide
  // sulla copia di ieri chiude la questione per tutti, per sempre.
  //
  // Alcune di quelle chiavi non hanno nemmeno la data — `sheep-trip`,
  // `caccia-finale`, `sotto-zero` — quindi valgono una volta per tutto il
  // viaggio.
  //
  // Il fallimento qui è quello giusto: una decisione che non riesce a
  // leggere fresco **non viene presa**, e aspetta la prossima apertura. È
  // già il modo in cui questo progetto funziona — «lo muove il primo che
  // apre l'app» — quindi rimandare di due ore non costa niente, mentre
  // sbagliare costa per sempre.
  //
  // Il progetto la distinzione l'aveva già fatta a mano una volta, in
  // `useGioco`: i conteggi dei voti aperti erano l'unica lettura tenuta
  // fuori dalla cache, con la motivazione «una copia vecchia direbbe il
  // falso su quanti hanno già deciso». È la stessa ragione, scritta bene.
  conRipiego.fresca = (...argomenti) =>
    conScadenza(lettura(...argomenti), SECONDI_LETTURA * 1000)

  return conRipiego
}

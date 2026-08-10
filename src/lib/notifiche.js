import { supabase } from './supabase.js'
import { CHIAVE_PUBBLICA_PUSH } from '../config/rete.js'

// Iscriversi alle notifiche, e far partire quelle degli altri.
//
// ⚠️ Su iPhone tutto questo funziona **solo dentro l'app messa sulla
// home**, e solo da iOS 16.4 in su. Chi apre l'app dal browser non
// riceve niente, e non è una cosa che si aggiusta scrivendo codice: è
// come funziona iOS.
//
// Per questo le notifiche restano un di più e mai una garanzia, e per
// questo la striscia SOS in cima a tutti i tab resta il modo vero in cui
// un SOS si vede.

export function notifichePossibili() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function statoNotifiche() {
  if (!notifichePossibili()) return 'impossibile'
  return Notification.permission // 'default' | 'granted' | 'denied'
}

// ⚠️ Il permesso NON e' l'iscrizione, e confonderli blocca tutto.
//
// Il permesso si concede una volta sola e resta per sempre; l'iscrizione
// e' un'altra cosa, e puo' non esserci — perche' non e' mai stata
// scritta, perche' e' stata tolta, o perche' il telefono l'ha buttata da
// solo (succede: iOS le scarta se l'app non si apre per settimane).
//
// Guardando solo il permesso, il tasto diceva «Spegni» a chi non era
// iscritto per niente, e non c'era piu' modo di iscriversi: e' successo
// davvero, e questa funzione esiste per quello.
export async function statoIscrizione() {
  if (!notifichePossibili()) return 'impossibile'
  if (Notification.permission === 'denied') return 'bloccate'

  try {
    const registrazione = await navigator.serviceWorker.ready
    const iscrizione = await registrazione.pushManager.getSubscription()
    return iscrizione ? 'accese' : 'spente'
  } catch {
    return 'spente'
  }
}

// ⚠️ L'app e' aperta dalla schermata home, o dal browser?
//
// Su iPhone e' la differenza fra «funziona» e «non puo' funzionare»: da
// Safari il permesso non si puo' nemmeno chiedere. Saperlo PRIMA di
// premere evita a qualcuno di concludere che l'app e' rotta.
export function installataSullaHome() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    window.navigator.standalone === true
  )
}

export function suAndroid() {
  if (typeof navigator === 'undefined') return false
  return /Android/.test(navigator.userAgent)
}

export function suIPhone() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

// ⚠️ Cosa vede l'app, in chiaro.
//
// Serve a smettere di indovinare. Su Android il permesso delle notifiche
// vive in almeno tre posti che si chiamano tutti «Notifiche» — quello
// dell'app, quello del sito, e l'interruttore generale del browser — e da
// fuori non si capisce quale dei tre stia dicendo di no. Ci abbiamo perso
// tre giri di messaggi.
//
// Questa riga si mostra solo quando qualcosa non va, e si puo'
// fotografare: dice tutto quello che serve per capire dove guardare.
export async function comeStaMesso() {
  if (!notifichePossibili()) return 'notifiche non disponibili in questo browser'

  let iscritto = '?'
  try {
    const r = await navigator.serviceWorker.ready
    iscritto = (await r.pushManager.getSubscription()) ? 'si' : 'no'
  } catch {
    iscritto = 'errore'
  }

  // Lo stato secondo il browser, che a volte dice cose diverse da
  // `Notification.permission`.
  let secondoIlBrowser = '?'
  try {
    secondoIlBrowser = (await navigator.permissions?.query({ name: 'notifications' }))?.state ?? '?'
  } catch {
    secondoIlBrowser = 'non lo dice'
  }

  return [
    `permesso: ${Notification.permission}`,
    `browser dice: ${secondoIlBrowser}`,
    `iscritto: ${iscritto}`,
    `dalla home: ${installataSullaHome() ? 'si' : 'no'}`,
    `service worker: ${'serviceWorker' in navigator ? 'si' : 'no'}`,
  ].join(' · ')
}

// Il formato che vuole `pushManager.subscribe`: la chiave in byte, non in
// testo.
function chiaveInByte(base64) {
  const pieno = (base64 + '='.repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const grezzo = atob(pieno)
  return Uint8Array.from([...grezzo].map((c) => c.charCodeAt(0)))
}

// ⚠️ Va chiamata **da un tocco**, sempre. Su iOS il permesso non si può
// chiedere in nessun altro modo, e chiedendolo da solo all'avvio non
// compare proprio nessun cartello: sembra che non funzioni.
export async function iscriviti(membroId) {
  if (!notifichePossibili()) return { ok: false, motivo: 'impossibile' }
  if (!CHIAVE_PUBBLICA_PUSH) return { ok: false, motivo: 'non configurato' }

  // ⚠️ Su iPhone fuori dall'app installata il permesso non si puo'
  // chiedere: il cartello non compare proprio, e sembra che il tasto sia
  // rotto. Meglio dirlo che lasciar credere.
  if (suIPhone() && !installataSullaHome()) {
    return { ok: false, motivo: 'non-installata' }
  }

  const permesso = await Notification.requestPermission()
  if (permesso !== 'granted') return { ok: false, motivo: permesso }

  const registrazione = await navigator.serviceWorker.ready

  // Se c'è già un'iscrizione da questo telefono si riusa: chiedere una
  // seconda iscrizione senza disdire la prima lascia due endpoint vivi, e
  // il telefono suona due volte.
  const esistente = await registrazione.pushManager.getSubscription()
  const iscrizione =
    esistente ??
    (await registrazione.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: chiaveInByte(CHIAVE_PUBBLICA_PUSH),
    }))

  const grezza = iscrizione.toJSON()
  if (!grezza?.endpoint || !grezza?.keys) return { ok: false, motivo: 'iscrizione-vuota' }

  // ⚠️ Passa da una funzione del database, non dalla tabella.
  //
  // Su `push_subscriptions` non c'è nessuna policy: dal telefono non si
  // legge, non si scrive e non si cancella. L'elenco degli endpoint lo
  // vede solo il server che manda, perché un endpoint in mano a qualcun
  // altro è un modo per far suonare quel telefono senza passare da qui.
  //
  // Il primo tentativo scriveva sulla tabella e sembrava giusto — tre
  // policy, insert/update/delete, nessuna lettura — ma il database
  // rifiutava tutto in silenzio: `upsert` ha bisogno di leggere la riga
  // in conflitto, e perfino una `delete` mirata rispondeva «fatto» senza
  // togliere niente, perché senza lettura quelle righe non sono
  // visibili. È il motivo per cui «Accendi» non iscriveva nessuno.
  const { error } = await supabase.rpc('iscrivi_push', {
    p_endpoint: grezza.endpoint,
    p_membro: membroId,
    p_chiavi: grezza.keys,
  })
  // ⚠️ Il motivo vero torna a chi chiama, invece di finire in un `catch`
  // generico. Un tasto che dice solo «non e' andata» costringe chi lo
  // preme a indovinare — e a chi lo ha scritto tocca chiedere «cosa dice
  // esattamente?» invece di leggerlo.
  if (error) return { ok: false, motivo: 'database', dettaglio: error.message }

  return { ok: true }
}

// ⚠️ Rimettere a posto l'iscrizione a ogni apertura.
//
// Il browser puo' avere un'iscrizione che sul nostro database non c'e'.
// Succede piu' spesso di quanto sembri:
//
//   - la prima volta e' andata a meta' (il browser ha detto si', la
//     scrittura no) — ed e' successo davvero, per un difetto mio
//   - il database e' stato svuotato, cosa prevista prima della partenza
//   - il telefono ha rigenerato l'iscrizione da solo, che i servizi di
//     push fanno ogni tanto senza dire niente
//
// In tutti e tre i casi l'app diceva «✓ Accese» e non arrivava niente, e
// l'unico tasto disponibile era «Spegni»: un vicolo cieco, il secondo
// dello stesso tipo. Guardare il browser non basta — la domanda vera e'
// «questo indirizzo lo conosciamo noi?», e a quella non si puo'
// rispondere dal telefono, perche' la tabella non si legge apposta.
//
// Quindi non si chiede: si riscrive. `iscrivi_push` toglie e rimette, e
// riscrivere una riga identica non costa niente e non fa doppioni.
export async function riallineaIscrizione(membroId) {
  if (!membroId || !notifichePossibili()) return
  if (Notification.permission !== 'granted') return

  try {
    const registrazione = await navigator.serviceWorker.ready
    const iscrizione = await registrazione.pushManager.getSubscription()
    if (!iscrizione) return

    const grezza = iscrizione.toJSON()
    if (!grezza?.endpoint || !grezza?.keys) return

    await supabase.rpc('iscrivi_push', {
      p_endpoint: grezza.endpoint,
      p_membro: membroId,
      p_chiavi: grezza.keys,
    })
  } catch {
    // Senza rete si riprova alla prossima apertura. Non e' una cosa di
    // cui avvisare nessuno.
  }
}

export async function disiscriviti() {
  if (!notifichePossibili()) return
  const registrazione = await navigator.serviceWorker.ready
  const iscrizione = await registrazione.pushManager.getSubscription()
  if (!iscrizione) return

  await supabase.rpc('disiscrivi_push', { p_endpoint: iscrizione.endpoint })
  await iscrizione.unsubscribe()
}

// ⚠️ Si manda l'id e basta: il testo lo ricostruisce il server rileggendo
// la riga. Vedi il commento in `api/notifica.js` — se il testo arrivasse
// da qui, chiunque potrebbe far comparire sui telefoni del gruppo una
// notifica che dice quello che vuole.
//
// E non si aspetta: chi ha appena premuto SOS non deve stare fermo a
// guardare una rotella perché una notifica sta partendo. Se fallisce,
// l'SOS è partito lo stesso e dentro l'app si vede.
export function faiSuonare(id, genere = 'azione') {
  if (!id) return
  fetch('/api/notifica', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, genere }),
  }).catch(() => {})
}

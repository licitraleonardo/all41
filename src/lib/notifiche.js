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

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      endpoint: grezza.endpoint,
      member_id: membroId,
      chiavi: grezza.keys,
    },
    { onConflict: 'endpoint' }
  )
  if (error) throw error

  return { ok: true }
}

export async function disiscriviti() {
  if (!notifichePossibili()) return
  const registrazione = await navigator.serviceWorker.ready
  const iscrizione = await registrazione.pushManager.getSubscription()
  if (!iscrizione) return

  await supabase.from('push_subscriptions').delete().eq('endpoint', iscrizione.endpoint)
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

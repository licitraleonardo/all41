import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'
import { daNotificare, daTogliere } from './_regole.js'

// Manda una notifica a tutto il gruppo tranne a chi l'ha fatta partire.
//
// Gira su Vercel, che raccoglie da sé quello che sta in `api/`. È l'unico
// pezzo di questo progetto che vive fuori dal telefono.
//
// ⚠️ **Non si fida di quello che gli arriva.** Riceve *solo un id* e va a
// rileggersi la riga dal database con la chiave di servizio: tipo, autore
// e contenuto li prende da lì.
//
// Se accettasse il testo dal chiamante, chiunque conoscesse questo
// indirizzo potrebbe far comparire sui telefoni di tutti e otto una
// notifica che dice quello che vuole lui — e una notifica che dice
// «Leo ha chiesto aiuto» quando non è vero è esattamente il tipo di
// scherzo che questa app non deve rendere possibile. Così il massimo che
// può fare è rimandare una notifica per una cosa successa davvero.

const CHIAVE_PUBBLICA = process.env.VAPID_PUBLIC_KEY
const CHIAVE_PRIVATA = process.env.VAPID_PRIVATE_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ errore: 'solo POST' })

  if (!CHIAVE_PRIVATA || !CHIAVE_PUBBLICA) {
    // Manca la configurazione: si risponde bene lo stesso.
    // ⚠️ Chi ha chiamato ha appena mandato un SOS: un errore qui non deve
    // far comparire un guasto sul suo schermo, perché l'SOS è partito e
    // gli altri lo vedono comunque dentro l'app. Le notifiche sono un di
    // più, e un di più che non c'è non è un guasto.
    return res.status(200).json({ mandate: 0, motivo: 'chiavi mancanti' })
  }

  const { id, genere } = req.body ?? {}
  if (!id) return res.status(400).json({ errore: 'manca id' })

  const db = createClient(
    process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )

  // La riga vera, riletta dal database.
  let tipo
  let autoreId
  let payload = {}

  if (genere === 'vocale') {
    const { data, error } = await db
      .from('voice_messages')
      .select('id, author_id, deleted_at')
      .eq('id', id)
      .single()
    if (error || !data || data.deleted_at) return res.status(404).json({ errore: 'non trovato' })
    tipo = 'vocale'
    autoreId = data.author_id
  } else {
    const { data, error } = await db
      .from('quick_actions')
      .select('id, author_id, kind, payload, deleted_at')
      .eq('id', id)
      .single()
    if (error || !data || data.deleted_at) return res.status(404).json({ errore: 'non trovato' })
    tipo = data.kind
    autoreId = data.author_id
    payload = data.payload ?? {}
  }

  if (!daNotificare(tipo)) {
    return res.status(200).json({ mandate: 0, motivo: 'tipo che non notifica' })
  }

  // Il nome di chi l'ha fatta, per il testo.
  const { data: autore } = await db.from('members').select('name').eq('id', autoreId).single()

  // Tutti tranne lui: nessuno vuole la notifica di una cosa che ha appena
  // fatto lui stesso.
  const { data: iscritti } = await db
    .from('push_subscriptions')
    .select('endpoint, chiavi, member_id')
    .neq('member_id', autoreId)

  if (!iscritti?.length) return res.status(200).json({ mandate: 0, motivo: 'nessun iscritto' })

  webpush.setVapidDetails('mailto:all41@example.invalid', CHIAVE_PUBBLICA, CHIAVE_PRIVATA)

  const roba = JSON.stringify({ tipo, id, chi: autore?.name ?? null, payload })

  const esiti = await Promise.allSettled(
    iscritti.map((i) =>
      webpush.sendNotification(
        { endpoint: i.endpoint, keys: i.chiavi },
        roba,
        { TTL: 600 } // dieci minuti: una notizia di ieri non serve a nessuno
      )
    )
  )

  // ⚠️ Le iscrizioni morte si tolgono da sole.
  //
  // Un telefono che disinstalla l'app lascia il suo endpoint nella
  // tabella per sempre, e il servizio di push risponde 404 o 410. Senza
  // questa pulizia, fra un anno si proverebbe a mandare a otto telefoni
  // che non esistono più — e ogni invio è tempo di attesa per chi ha
  // premuto SOS.
  const morte = daTogliere(esiti, iscritti)
  if (morte.length) await db.from('push_subscriptions').delete().in('endpoint', morte)

  return res.status(200).json({
    mandate: esiti.filter((e) => e.status === 'fulfilled').length,
    tolte: morte.length,
  })
}

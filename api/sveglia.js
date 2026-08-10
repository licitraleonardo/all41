import { createClient } from '@supabase/supabase-js'
import { chiaviPush, mandaATutti } from './_manda.js'

// La sveglia del primo giorno: il 12 verso mezzogiorno, «All41 vi
// aspetta» a tutti.
//
// La chiama un cron di Vercel (vedi `vercel.json`), che gira ogni giorno:
// il controllo sul giorno sta qui dentro, o suonerebbe tutte le mattine
// per sempre.
//
// ⚠️ Sul piano Hobby i cron di Vercel non sono puntuali: partono entro
// l'ora dell'orario chiesto. Quindi questa notifica può arrivare fra le
// 12:30 e le 13:30, ed è previsto — non è un guasto.

// Il giorno in cui deve suonare, e nient'altro.
export const GIORNO = '2026-08-12'

// ⚠️ L'ora italiana, non quella del server. Vercel gira in UTC: a metà
// agosto l'Italia è avanti di due ore, quindi alle 00:30 di Roma il
// server crede sia ancora il giorno prima e la sveglia salterebbe.
export function oggiARoma(adesso = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(adesso)
}

export default async function handler(req, res) {
  const { pubblica, privata } = chiaviPush()
  if (!pubblica || !privata) {
    return res.status(200).json({ mandate: 0, motivo: 'chiavi mancanti' })
  }

  const oggi = oggiARoma()
  if (oggi !== GIORNO) {
    return res.status(200).json({ mandate: 0, motivo: 'non è il giorno', oggi })
  }

  const db = createClient(
    process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )

  // ⚠️ A tutti, senza escludere nessuno: le altre notifiche saltano chi
  // le ha fatte partire, questa non la fa partire nessuno.
  const { data: iscritti } = await db
    .from('push_subscriptions')
    .select('endpoint, chiavi, member_id')

  if (!iscritti?.length) {
    return res.status(200).json({ mandate: 0, motivo: 'nessun iscritto' })
  }

  // Sei ore di vita, non dieci minuti come le altre: se il telefono è
  // spento o senza campo mentre si viaggia, questa vale lo stesso quando
  // si riaccende. È un invito, non una notizia che scade.
  const roba = JSON.stringify({ tipo: 'sveglia', id: GIORNO })
  const esito = await mandaATutti({ db, iscritti, roba, ttl: 21600 })

  return res.status(200).json({ ...esito, giorno: oggi })
}

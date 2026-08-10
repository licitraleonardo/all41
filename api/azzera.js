import { createClient } from '@supabase/supabase-js'
import { GIORNO, oggiARoma } from './sveglia.js'

// La classifica riparte da zero la mattina del 12.
//
// Fra il rilascio e la partenza il gruppo può già assegnarsi punti con le
// proposte — serve a far provare il meccanismo — ma quei punti non devono
// contare per il viaggio.
//
// La chiama un cron di Vercel alle 6 (vedi `vercel.json`). Il lavoro vero
// lo fa `azzera_prima_del_viaggio()` nel database: qui c'è solo il
// controllo del giorno e la chiamata.
//
// ⚠️ Chiamarla più volte non fa danno, ed è di proposito: la funzione
// taglia a una **data fissa** e ricalcola i punteggi da quello che resta,
// invece di azzerarli. Se il cron parte in ritardo — sul piano Hobby non
// sono puntuali — i punti guadagnati dopo le 6 restano dove sono.

export default async function handler(req, res) {
  const oggi = oggiARoma()
  if (oggi !== GIORNO) {
    return res.status(200).json({ azzerato: false, motivo: 'non è il giorno', oggi })
  }

  const chiave = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!chiave) {
    return res.status(200).json({ azzerato: false, motivo: 'chiave mancante' })
  }

  const db = createClient(
    process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL,
    chiave,
    { auth: { persistSession: false } }
  )

  const { data, error } = await db.rpc('azzera_prima_del_viaggio')
  if (error) {
    // ⚠️ Un errore qui si dice, non si nasconde: se l'azzeramento non è
    // andato, il viaggio comincia con la classifica delle prove e
    // qualcuno se ne accorgerà guardandola.
    return res.status(500).json({ azzerato: false, errore: error.message })
  }

  const esito = Array.isArray(data) ? data[0] : data
  return res.status(200).json({ azzerato: true, ...esito, giorno: oggi })
}

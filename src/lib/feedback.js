import { supabase } from './supabase.js'
import { VIAGGIO } from './../config/viaggio.js'

export const MAX_FEEDBACK = 1000

// Si scrive e non si rilegge: non c'è nessuna `leggiFeedback` qui, ed è
// voluto. La tabella non ha nemmeno la policy di lettura — vedi il
// commento in `supabase/feedback.sql`.
//
// ⚠️ Nessun `conCache` e nessun ripiego sulla copia. Un feedback non è
// una cosa da mettere in coda e mandare più tardi: se non parte, chi
// l'ha scritto deve saperlo subito e riprovare, perché quello che aveva
// da dire ce l'ha in testa adesso.
export async function mandaFeedback({ testo, dove = null }, membroId) {
  const pulito = String(testo ?? '').trim().slice(0, MAX_FEEDBACK)
  if (!pulito) return { ok: false, motivo: 'vuoto' }

  const { error } = await supabase.from('feedback').insert({
    trip_id: VIAGGIO.id,
    author_id: membroId ?? null,
    testo: pulito,
    dove,
  })

  if (error) throw error
  return { ok: true }
}

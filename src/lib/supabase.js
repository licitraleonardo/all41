import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const chiave = import.meta.env.VITE_SUPABASE_ANON_KEY

// Se mancano le variabili l'app non deve esplodere con un errore oscuro:
// lo dice in chiaro a schermo. Vedi App.jsx.
export const supabaseConfigurato = Boolean(url && chiave)

export const supabase = supabaseConfigurato
  ? createClient(url, chiave, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

// Identità tecnica anonima: nessun attrito per l'utente, ma le regole di
// sicurezza possono pretendere una sessione. Non identifica la persona —
// quello lo fa il memberId applicativo.
export async function assicuraSessione() {
  const { data } = await supabase.auth.getSession()
  if (data.session) return data.session

  const { data: nuova, error } = await supabase.auth.signInAnonymously()
  if (error) throw error
  return nuova.session
}

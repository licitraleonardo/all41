// Traduce gli errori di Supabase in una frase che dice dove guardare.
// Sono errori da sviluppo, non da vacanza: chi li vede è chi sta montando
// l'app, quindi meglio precisi che carini.

export function descriviErrore(e) {
  const testo = e?.message || String(e)

  if (/anonymous.*disabled|signups? not allowed|anonymous_provider/i.test(testo)) {
    return 'L’accesso anonimo non è attivo su Supabase. Va acceso in Authentication → Sign In / Providers.'
  }
  if (/relation .* does not exist|does not exist|schema cache|PGRST205/i.test(testo)) {
    return 'Manca una tabella. Va rieseguito supabase/schema.sql nell’SQL Editor.'
  }
  if (/row-level security|violates row-level/i.test(testo)) {
    return 'Le regole di sicurezza rifiutano l’operazione. Rilancia supabase/schema.sql.'
  }
  if (/fetch|network|Failed to fetch/i.test(testo)) {
    return 'Niente rete, o URL di Supabase sbagliato.'
  }
  return testo
}

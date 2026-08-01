// Traduce gli errori di Supabase in una frase che dice dove guardare.
// Sono errori da sviluppo, non da vacanza: chi li vede è chi sta montando
// l'app, quindi meglio precisi che carini.

export function descriviErrore(e) {
  const testo = e?.message || String(e)

  if (/anonymous.*disabled|signups? not allowed|anonymous_provider/i.test(testo)) {
    return 'L’accesso anonimo non è attivo su Supabase. Va acceso in Authentication → Sign In / Providers.'
  }
  // Prima le funzioni: il messaggio di PostgREST contiene "does not
  // exist" anche per quelle, e prendendolo per una tabella mancante si
  // cerca il problema nel posto sbagliato.
  if (/function .*does not exist|Could not find the function|PGRST202/i.test(testo)) {
    return (
      'Il database non trova una funzione. Rilancia supabase/schema.sql, e se ' +
      'l’errore resta esegui: notify pgrst, \'reload schema\';'
    )
  }
  if (/relation .* does not exist|schema cache|PGRST205/i.test(testo)) {
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

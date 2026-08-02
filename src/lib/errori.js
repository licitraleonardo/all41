// Traduce gli errori di Supabase in una frase che dice dove guardare.
// Sono errori da sviluppo, non da vacanza: chi li vede è chi sta montando
// l'app, quindi meglio precisi che carini.

export function descriviErrore(e) {
  const testo = e?.message || String(e)

  // La frase tradotta serve a chi usa l'app; questa serve a chi la ripara.
  // Senza, un errore mal classificato manda a cercare nel posto sbagliato,
  // ed è già successo.
  console.error('[all41] errore grezzo:', {
    messaggio: testo,
    codice: e?.code,
    dettagli: e?.details,
    suggerimento: e?.hint,
  })

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
  // Una colonna mancante vuol dire che la tabella c'era già da prima e non
  // è stata adeguata: mandare a cercare "una tabella" fa perdere tempo.
  if (/column .* does not exist|42703/i.test(testo)) {
    return (
      'Al database manca una colonna: la tabella esiste da prima e non è ' +
      'stata aggiornata. Rilancia supabase/schema.sql, che ora la aggiunge.'
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

-- All For One — il giro che sale, e il testimone che riparte.
--
-- Da incollare nell'SQL Editor di Supabase ed eseguire.
-- Rieseguibile: se lo rilanci non rompe niente.
--
-- Due difetti nella stessa funzione, tutti e due invisibili:
--
-- 1. chiudi_accusa forzava `giro = 1` ogni volta che la partita
--    ripartiva. A schermo il contatore restava inchiodato: dopo tre giri
--    d'accusa continuava a dire "Giro 1", e nessuno capiva a che punto
--    fosse la serata.
--
-- 2. non toccava `turno_da`, quindi il testimone — i trenta secondi in
--    cui il turno lo passa solo chi parla — restava fermo al turno
--    precedente. Chi apriva un giro nuovo era gia' scaduto in partenza:
--    proprio la persona che il testimone doveva proteggere era l'unica
--    che non proteggeva.

drop function if exists chiudi_accusa(uuid, uuid[], text, uuid[], int, uuid);

create or replace function chiudi_accusa(
  p_partita uuid,
  p_fuori uuid[],
  p_stato text,
  p_ordine uuid[],
  p_giri int,
  p_voto uuid,
  p_giro int default null
)
returns impostore_games
language plpgsql
security definer
set search_path = public
as $$
declare
  g impostore_games;
begin
  select * into g from impostore_games where id = p_partita for update;
  if not found then raise exception 'Questa partita non esiste.'; end if;

  -- Vale solo dallo stato 'voto': due telefoni che chiudono la stessa
  -- accusa insieme eliminerebbero due volte, e il secondo trova la
  -- partita gia' andata avanti.
  if g.stato = 'voto' then
    update impostore_games
       set fuori = p_fuori,
           stato = p_stato,
           ordine = coalesce(p_ordine, ordine),
           giri_totali = coalesce(p_giri, giri_totali),
           turno = case when p_stato = 'in-corso' then 0 else turno end,
           -- Il giro che dice il motore, non un 1 fisso. Il coalesce
           -- copre un telefono con la versione vecchia dell'app, che
           -- questo parametro non lo manda.
           giro = case
                    when p_stato = 'in-corso' then coalesce(p_giro, giro + 1)
                    else giro
                  end,
           -- Il testimone riparte da adesso per chi apre il giro nuovo.
           turno_da = case when p_stato = 'in-corso' then now() else turno_da end,
           vote_id = p_voto,
           rivela_chiesta = '{}'
     where id = p_partita
    returning * into g;
  end if;

  return g;
end $$;

revoke execute on function chiudi_accusa(uuid, uuid[], text, uuid[], int, uuid, int) from public;
grant execute on function chiudi_accusa(uuid, uuid[], text, uuid[], int, uuid, int) to authenticated;

notify pgrst, 'reload schema';

-- All For One — il gruppo sceglie anche quanti giri.
--
-- Da incollare nell'SQL Editor di Supabase ed eseguire.
-- Rieseguibile: se lo rilanci non rompe niente.
--
-- Prima il voto d'apertura decideva solo quanti impostori, e i giri
-- erano fissi a due. Adesso si votano insieme, in una scelta sola: due
-- votazioni di fila sarebbero due momenti morti prima di cominciare, e
-- il secondo lo salterebbe meta' gruppo.

-- La vecchia firma sparisce: lasciarla in giro vorrebbe dire due
-- funzioni con lo stesso nome, e PostgREST sceglierebbe a caso quale
-- chiamare. Con `if exists` non protesta se non c'e'.
drop function if exists avvia_impostore(uuid, uuid[], jsonb, uuid[]);

create or replace function avvia_impostore(
  p_partita uuid,
  p_impostori uuid[],
  p_assegnazioni jsonb,
  p_ordine uuid[],
  p_giri int
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

  -- Solo dalla preparazione: due telefoni che sorteggiano insieme
  -- darebbero due partite diverse alla stessa gente, e il secondo qui
  -- trova la partita gia' partita e non tocca niente.
  if g.stato = 'preparazione' then
    update impostore_games
       set impostori = p_impostori,
           assegnazioni = p_assegnazioni,
           ordine = p_ordine,
           -- coalesce per prudenza: un telefono con la versione vecchia
           -- dell'app manderebbe null, e i giri resterebbero quelli
           -- messi alla creazione invece di azzerarsi.
           giri_totali = coalesce(p_giri, giri_totali),
           stato = 'in-corso',
           turno_da = now()
     where id = p_partita
    returning * into g;
  end if;

  return g;
end $$;

revoke execute on function avvia_impostore(uuid, uuid[], jsonb, uuid[], int) from public;
grant execute on function avvia_impostore(uuid, uuid[], jsonb, uuid[], int) to authenticated;

notify pgrst, 'reload schema';

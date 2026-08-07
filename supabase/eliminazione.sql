-- All For One — l'eliminazione nell'Impostore.
--
-- Da incollare nell'SQL Editor di Supabase ed eseguire.
-- Rieseguibile: se lo rilanci non rompe niente.
--
-- Contiene solo quello che manca al database: le altre colonne e le
-- altre funzioni dell'Impostore ci sono gia'.

-- Chi e' uscito: innocenti eliminati per errore e impostori scoperti.
-- Uno solo perche' la differenza si sa gia' — basta guardare se e' fra
-- gli impostori — e due elenchi da tenere d'accordo sono due elenchi che
-- prima o poi non lo sono.
alter table impostore_games add column if not exists fuori uuid[] not null default '{}';

-- Chiude un giro d'accusa: chi esce, e cosa succede dopo. Tutto in una
-- transazione perche' sono la stessa decisione — chi e' fuori, se si
-- riparte e con che ordine — e applicarle a pezzi lascerebbe partite a
-- meta' se qualcosa fallisce nel mezzo.
--
-- Vale solo dallo stato 'voto': due telefoni che chiudono la stessa
-- accusa insieme eliminerebbero due volte, e il secondo trova la partita
-- gia' andata avanti.
create or replace function chiudi_accusa(
  p_partita uuid,
  p_fuori uuid[],
  p_stato text,
  p_ordine uuid[],
  p_giri int,
  p_voto uuid
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

  if g.stato = 'voto' then
    update impostore_games
       set fuori = p_fuori,
           stato = p_stato,
           ordine = coalesce(p_ordine, ordine),
           giri_totali = coalesce(p_giri, giri_totali),
           turno = case when p_stato = 'in-corso' then 0 else turno end,
           giro = case when p_stato = 'in-corso' then 1 else giro end,
           vote_id = p_voto,
           rivela_chiesta = '{}'
     where id = p_partita
    returning * into g;
  end if;

  return g;
end $$;

revoke execute on function chiudi_accusa(uuid, uuid[], text, uuid[], int, uuid) from public;
grant execute on function chiudi_accusa(uuid, uuid[], text, uuid[], int, uuid) to authenticated;

notify pgrst, 'reload schema';

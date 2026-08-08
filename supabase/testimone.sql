-- All For One — il testimone dell'Impostore.
--
-- Da incollare nell'SQL Editor di Supabase ed eseguire.
-- Rieseguibile: se lo rilanci non rompe niente.
--
-- Chiunque puo' far avanzare il turno — se a qualcuno si scarica il
-- telefono la partita non si blocca — ma per i primi trenta secondi puo'
-- farlo solo chi sta parlando.
--
-- ⚠️ Non e' il countdown che lo spec vieta, e la differenza conta: un
-- countdown mette fretta a chi parla, questo protegge chi parla da chi ha
-- il dito veloce. Alla scadenza non succede niente — nessun turno
-- saltato — si sblocca soltanto il tasto per gli altri.

-- Quando e' cominciato il turno in corso. Il default a now() vale anche
-- per le partite gia' aperte: al peggio il primo turno dopo
-- l'aggiornamento parte col testimone gia' scaduto, che non fa danno.
alter table impostore_games
  add column if not exists turno_da timestamptz not null default now();

-- La stessa funzione di prima, che adesso segna anche quando comincia il
-- turno nuovo. L'orario lo mette il database e non il telefono: sei
-- telefoni con sei orologi diversi darebbero sei conti alla rovescia
-- diversi, e quello indietro di un minuto sbloccherebbe il tasto a tutti
-- subito.
create or replace function avanza_impostore(
  p_partita uuid,
  p_turno_atteso int,
  p_ordine uuid[],
  p_turno int,
  p_giro int,
  p_stato text
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

  if g.stato = 'in-corso' and g.turno = p_turno_atteso then
    update impostore_games
       set ordine = p_ordine,
           turno = p_turno,
           giro = p_giro,
           stato = p_stato,
           turno_da = now()
     where id = p_partita
    returning * into g;
  end if;

  return g;
end $$;

revoke execute on function avanza_impostore(uuid, int, uuid[], int, int, text) from public;
grant execute on function avanza_impostore(uuid, int, uuid[], int, int, text) to authenticated;

notify pgrst, 'reload schema';

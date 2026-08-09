-- Chi si è iscritto alle notifiche, e da quale telefono.
--
-- Una riga per telefono, non per persona: la stessa persona può avere
-- l'app sul telefono e sul tablet, e le due vanno avvisate tutte e due.
--
-- ⚠️ Chiave primaria l'endpoint. È l'indirizzo che il servizio di push
-- del browser assegna a quella installazione: iscriversi due volte dallo
-- stesso telefono riscrive la stessa riga invece di crearne una seconda,
-- e senza questo il gruppo si ritroverebbe con notifiche doppie dopo
-- qualche riapertura.

create table if not exists push_subscriptions (
  endpoint    text primary key,
  member_id   uuid not null references members(id) on delete cascade,
  -- p256dh e auth, come li dà il browser. In jsonb perché non li leggiamo
  -- mai singolarmente: li ripassiamo interi alla libreria che manda.
  chiavi      jsonb not null,
  creato_il   timestamptz not null default now()
);

create index if not exists push_subscriptions_membro on push_subscriptions (member_id);

alter table push_subscriptions enable row level security;

-- ⚠️ Nessuna policy, e quindi NESSUN accesso diretto dall'app.
--
-- Questa tabella non si legge, non si scrive e non si cancella dal
-- telefono: l'elenco degli endpoint lo vede solo il server che manda le
-- notifiche, con la chiave di servizio. Un endpoint in mano a qualcun
-- altro è un modo per far suonare quel telefono senza passare da qui.
--
-- Iscriversi e disiscriversi si fanno con le due funzioni qui sotto, che
-- fanno **una cosa sola ciascuna** e non restituiscono niente.
--
-- ⚠️ Il primo tentativo era diverso, e non funzionava. C'erano tre policy
-- (insert, update, delete) e nessuna di lettura, e sembrava giusto: si
-- scrive e non si legge. Ma il database rifiutava tutto in silenzio.
--
--   `upsert` diventa `insert ... on conflict do update`, e per aggiornare
--   la riga in conflitto Postgres deve prima leggerla.
--
--   E anche una `delete ... where endpoint = ...` non toglieva niente:
--   rispondeva «204, fatto» e la riga restava lì. Senza permesso di
--   lettura le righe da cancellare non sono visibili, quindi non ne
--   cancella nessuna — e non lo dice.
--
-- Verificato mettendo `insert`, `upsert` e `delete` uno accanto all'altro
-- con la stessa sessione anonima dell'app: il primo passava, gli altri
-- due no. È il difetto per cui «Accendi» sul telefono non iscriveva
-- nessuno e la tabella restava vuota.
--
-- `security definer` è la stessa strada già presa per le altre scritture
-- che chiedono più permessi di quanti ne abbia chi le chiama:
-- `registra_rimborso` e `apri_voto_impostore`.

drop policy if exists "push: iscrizione" on push_subscriptions;
drop policy if exists "push: riscrittura" on push_subscriptions;
drop policy if exists "push: disiscrizione" on push_subscriptions;

create or replace function iscrivi_push(
  p_endpoint text,
  p_membro uuid,
  p_chiavi jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Toglie e rimette: lo stesso telefono che si riscrive non fa un
  -- doppione, e se ha cambiato profilo la riga segue il profilo nuovo.
  delete from push_subscriptions where endpoint = p_endpoint;

  insert into push_subscriptions (endpoint, member_id, chiavi)
  values (p_endpoint, p_membro, p_chiavi);
end;
$$;

create or replace function disiscrivi_push(p_endpoint text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from push_subscriptions where endpoint = p_endpoint;
end;
$$;

grant execute on function iscrivi_push(text, uuid, jsonb) to authenticated;
grant execute on function disiscrivi_push(text) to authenticated;

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

-- Iscriversi e disiscriversi si fa dall'app; leggere l'elenco no.
--
-- ⚠️ Niente `select` per gli autenticati: l'elenco degli endpoint lo
-- legge solo il server che manda le notifiche, con la chiave di servizio.
-- Un endpoint in mano a qualcun altro è un modo per mandare notifiche a
-- quel telefono senza passare da qui.
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public'
      and tablename = 'push_subscriptions' and policyname = 'push: iscrizione'
  ) then
    create policy "push: iscrizione"
      on push_subscriptions for insert to authenticated with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public'
      and tablename = 'push_subscriptions' and policyname = 'push: riscrittura'
  ) then
    create policy "push: riscrittura"
      on push_subscriptions for update to authenticated using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public'
      and tablename = 'push_subscriptions' and policyname = 'push: disiscrizione'
  ) then
    create policy "push: disiscrizione"
      on push_subscriptions for delete to authenticated using (true);
  end if;
end $$;

-- Chi sei, per il database.
--
-- ⚠️ Questo file NON chiude niente. Aggiunge una tabella e due funzioni,
-- e da solo non cambia il comportamento dell'app di un millimetro. Le
-- porte si chiudono in `regole-chiuse.sql`, e solo quando tutti e otto
-- i telefoni si sono agganciati.
--
-- L'ordine è quello e non è pignoleria: chiudere mentre qualcuno è
-- ancora fuori vuol dire chiuderlo fuori, e non se ne accorgerebbe
-- nessuno — a porte chiuse un telefono non agganciato non riceve un
-- errore, riceve **zero righe**. Foto sparite, chat sparita, spese
-- sparite, e nessun messaggio che spieghi perché.
--
-- ————————————————————————————————————————————————————————————
-- Perché serve, misurato e non raccontato
--
-- Il 17 agosto, dal computer, senza aprire l'app e senza toccare nessun
-- pulsante:
--
--   1. con la sola chiave pubblica (quella dentro il codice che ogni
--      browser scarica, e che è pubblica per costruzione): **0 righe**
--   2. chiedendo una sessione anonima con quella stessa chiave — una
--      richiesta HTTP, due secondi — e riprovando: **8 membri, 229
--      messaggi, 43 spese, 93 foto**
--
-- Cioè: un mezzo recinto c'era già, perché le regole rispondono solo a
-- chi ha una sessione. Ma la sessione la distribuisce la chiave che sta
-- dentro il sito, quindi il recinto si scavalca chiedendo il permesso a
-- chi lo sorveglia.
--
-- ⚠️ Da qui la regola che vale per tutto il seguito: **«sei entrato» non
-- è una difesa.** L'unica frase che difende qualcosa è «sei uno degli
-- otto», e per poterla scrivere il database deve sapere chi sei.
--
-- Non era un difetto di ieri, era una conseguenza: l'app entra con una
-- sessione **anonima** — un'identità tecnica scollegata dalla persona,
-- che serve solo perché Supabase vuole una sessione — e senza sapere chi
-- sei, l'unica regola di lettura esprimibile era «chiunque sia entrato».

-- ————————————————————————————————————————— il primo tentativo, sostituito

-- C'era una colonna `members.auth_id` e una funzione che la riempiva col
-- codice di 5 lettere, pensate per gli account con la mail. Mai partite:
-- 8 membri, 0 agganciati, verificato prima di toglierle.
--
-- ⚠️ Si tolgono invece di lasciarle lì spente, e la ragione è precisa:
-- erano una seconda risposta alla domanda «chi sei». Chi scriverà le
-- regole di chiusura ne troverebbe due, ne sceglierebbe una, e se sceglie
-- quella morta le regole diventano sempre false — cioè l'app si svuota
-- per tutti senza un errore. Una domanda, una risposta.
drop function if exists aggancia_profilo(text);
alter table members drop column if exists auth_id;

-- —————————————————————————————————————————————— un membro, i suoi telefoni

-- ⚠️ Una **tabella** e non una colonna, ed è la differenza che conta.
-- Leonardo entra dal telefono e dal computer: sono due sessioni diverse,
-- quindi due identità diverse. Con una colonna sola la seconda
-- sovrascriverebbe la prima, e il primo dispositivo smetterebbe di
-- funzionare il giorno della chiusura — di nuovo in silenzio.
create table if not exists member_devices (
  auth_id    uuid primary key references auth.users (id) on delete cascade,
  member_id  uuid not null references members (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists member_devices_member_idx on member_devices (member_id);

-- ⚠️ Protezione accesa e **nessuna regola scritta**: non è una
-- dimenticanza, è la chiusura più stretta possibile. Nessuno può leggere
-- né scrivere questa tabella dall'app — l'elenco di chi entra da dove
-- non deve poterlo consultare nessuno degli otto, e tanto meno un
-- estraneo. Ci arrivano solo le due funzioni qui sotto, che girano coi
-- permessi di chi le ha scritte.
alter table member_devices enable row level security;

-- ————————————————————————————————————————————————— «sei di questo viaggio?»

-- ⚠️ `security definer`, e senza non funziona affatto.
--
-- Per sapere se sei del viaggio bisogna leggere `members`. Ma `members`
-- sarà protetta da questa stessa regola, che per rispondere dovrà
-- leggere `members`. Si morde la coda, e il risultato non è un errore
-- chiaro: è una lettura che torna vuota. `security definer` fa girare la
-- funzione coi permessi di chi l'ha scritta, quindi guarda la tabella
-- senza ripassare dal controllo.
--
-- `stable` perché dentro una singola richiesta la risposta non cambia:
-- permette al database di chiamarla una volta invece che per ogni riga.
create or replace function sono_del_viaggio(p_viaggio text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
      from member_devices d
      join members m on m.id = d.member_id
     where d.auth_id = auth.uid()
       and m.trip_id = p_viaggio
  )
$$;

-- ⚠️ Anche `anon` deve poterla chiamare, e sembra il contrario di quello
-- che si vuole. Le regole di accesso vengono valutate **con i permessi
-- di chi sta chiedendo**: se un anonimo non potesse eseguirla, la sua
-- richiesta fallirebbe con un errore di permessi invece di ricevere un
-- educato «no». Deve poter chiedere, e sentirsi rispondere `false`.
grant execute on function sono_del_viaggio(text) to anon, authenticated;

-- ——————————————————————————————————————————————————————— l'aggancio, in silenzio

-- Il telefono si ricorda già chi è: `all41.memberId` in `localStorage`,
-- scritto la prima volta che si è entrati col codice. Questa funzione non
-- fa che dirlo al database — «la sessione che sto usando adesso è quel
-- membro lì» — e nessuno degli otto deve fare niente: succede da solo
-- alla prima apertura.
--
-- ⚠️ Prende l'id del membro e non il codice di 5 lettere, e non è un
-- dettaglio: il codice ha ~12 milioni di combinazioni, l'id ne ha
-- 2^122. Tirare a indovinare un id non è una strada.
--
-- ⚠️ Ma finché le porte sono aperte **entrambi si possono leggere da
-- fuori**, quindi oggi questa funzione non difende niente e non deve
-- fingere di farlo. La difesa arriva alla chiusura, ed è una riga sola:
-- quando tutti e otto si sono agganciati si toglie il permesso di
-- eseguirla, e da lì un telefono nuovo entra solo se Leonardo riapre.
create or replace function aggancia_dispositivo(p_membro uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  esiste boolean;
begin
  -- ⚠️ Nessun `raise` in tutta la funzione. Gira all'avvio dell'app, e
  -- un errore all'avvio è l'unico posto che non ha una rete sotto: si
  -- torna `null`, il telefono non segna niente e riprova alla prossima
  -- apertura. Che qualcuno non si sia agganciato si vede dal conto in
  -- fondo a questo file, che è il posto giusto per accorgersene.
  if auth.uid() is null or p_membro is null then
    return null;
  end if;

  select exists (select 1 from members where id = p_membro) into esiste;
  if not esiste then
    return null;
  end if;

  -- Se questa sessione era già agganciata a un altro membro, si sposta:
  -- capita a chi passa il telefono, o a me che entro come qualcun altro
  -- per provare una cosa. Vince l'ultimo, che è l'unico che sta usando
  -- quel telefono adesso.
  insert into member_devices (auth_id, member_id)
       values (auth.uid(), p_membro)
  on conflict (auth_id) do update set member_id = excluded.member_id;

  return p_membro;
end $$;

-- ⚠️ REVOCATA A TUTTI, e questo file non la concede più a nessuno.
--
-- Serviva alla migrazione silenziosa degli otto telefoni, che è finita
-- l'8 su 8 il 17 agosto. Da allora le basta l'id di un membro — e quegli
-- id sono stati leggibili dal mondo per cinque settimane.
--
-- ⚠️ Qui c'era un `grant`, e mi ha fregato la notte stessa. La revoca
-- stava in `regole-chiuse.sql`; rilanciando questo file per un'altra
-- ragione, il ponte si è riaperto — **senza nessun errore**, e me ne sono
-- accorto solo perché il controllo generale lo guarda. Due file che
-- dicono cose opposte sulla stessa riga non litigano: vince quello
-- lanciato per ultimo. È la terza volta stanotte, in tre forme diverse.
--
-- Chi arriva da un telefono nuovo passa dalla porta col codice. Se un
-- giorno servisse riaprire, è una riga sola e sta in `regole-aperte.sql`.
revoke execute on function aggancia_dispositivo(uuid) from public, anon, authenticated;

-- ——————————————————————————————————————————————— quante volte puoi bussare

-- ⚠️ Chiuse le porte, il codice di 5 lettere è rimasto **l'unica chiave**,
-- e questo lo rende il punto debole di tutto il resto.
--
-- Il conto: l'alfabeto ha 31 caratteri (niente I L O 0 1, per non
-- confondersi dettandolo), quindi le combinazioni sono 31^5 = 28.629.151,
-- e i codici validi sono 8. Una macchina che prova codici a raffica ha
-- una probabilità concreta di trovarne uno in qualche ora — che è tanto
-- per una persona e niente per un programma.
--
-- Qui si conta quante volte una sessione sbaglia, e dopo qualche
-- tentativo la porta smette di rispondere per un quarto d'ora.
--
-- ⚠️ Il conto è **per sessione** e non per tutti insieme, e la ragione è
-- che il contrario sarebbe peggio del problema: un contatore unico si
-- riempirebbe di apposta, e a quel punto sarebbero gli otto a restare
-- fuori. Meglio un limite che si aggira cambiando sessione — cosa che
-- costa comunque una registrazione ogni pochi tentativi — che uno che si
-- può usare per chiudere fuori il gruppo.
create table if not exists tentativi_codice (
  auth_id   uuid primary key references auth.users (id) on delete cascade,
  sbagliati int not null default 0,
  ultimo    timestamptz not null default now()
);

-- Protezione accesa e nessuna regola: ci arriva solo la funzione qui
-- sotto. Sapere quante volte qualcuno ha sbagliato non serve a nessuno.
alter table tentativi_codice enable row level security;

-- ————————————————————————————————————————————————————————————— la porta

-- ⚠️ Questa funzione è **l'unico modo di rientrare a porte chiuse**, e
-- senza di lei chiudere sarebbe murare.
--
-- Chi svuota la cache, cambia telefono o apre in navigazione privata
-- perde `all41.memberId` e si ritrova davanti al campo del codice. Fino a
-- ieri il codice si cercava leggendo `members` da fuori; a porte chiuse
-- quella lettura torna **vuota**, perché chi non è ancora agganciato non
-- è del viaggio. E l'app, che riceve zero righe, dice «Codice non
-- riconosciuto» — una frase falsa, definitiva, e senza nessun errore
-- da nessuna parte.
--
-- Quindi la ricerca del codice smette di essere una lettura e diventa
-- questa funzione, che gira coi permessi di chi l'ha scritta: trova il
-- profilo, aggancia il telefono e lo restituisce. È il momento esatto in
-- cui uno **dimostra di essere del viaggio**, ed è l'unico posto dove il
-- codice di 5 lettere serve ancora a qualcosa.
-- ⚠️ `setof members` e non `members`, ed è una riga che vale mezz'ora di
-- danno. Scritta come `returns members`, una funzione che fa `return
-- null` non restituisce niente: restituisce **una riga di soli `null`**
-- — `{"id":null,"name":null,...}`. In JavaScript quell'oggetto è
-- **vero**, quindi l'app la scambia per un profilo trovato e fa entrare
-- chi ha sbagliato codice, dentro un profilo senza nome.
--
-- È successo davvero il 17 agosto, provando questa funzione. Ed è la
-- seconda volta in questo progetto: identico difetto, stessa forma, a
-- due settimane di distanza. Con `setof`, «non trovato» è una lista
-- vuota, e una lista vuota non somiglia a niente.
--
-- ⚠️ Cambiare il tipo di ritorno vuole un `drop` prima: `create or
-- replace` da solo fallisce.
drop function if exists entra_col_codice(text);
create function entra_col_codice(p_codice text)
returns setof members
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Quante volte si può sbagliare, e quanto si aspetta dopo.
  --
  -- Otto tentativi sono generosi per cinque lettere: chi le sbaglia otto
  -- volte di fila non sta ricordando male, sta provando. E un quarto
  -- d'ora è niente per una persona e un muro per un programma.
  LIMITE  constant int := 8;
  PAUSA   constant interval := interval '15 minutes';
  m members;
  t tentativi_codice;
begin
  -- Senza sessione non si bussa. La funzione è concessa solo a chi è
  -- entrato, quindi non dovrebbe capitare: se capita, non si prova
  -- nemmeno a contare i tentativi di un anonimo che non esiste.
  if auth.uid() is null then
    return;
  end if;

  select * into t from tentativi_codice where auth_id = auth.uid();

  -- ⚠️ Qui si **solleva**, e in tutto il resto di questo file non si fa
  -- mai. La differenza è chi sta dall'altra parte: le altre funzioni
  -- girano da sole in sottofondo, questa risponde a una persona che ha
  -- appena premuto «Entra».
  --
  -- Se rispondesse «codice non riconosciuto» come a un codice sbagliato,
  -- chi ha davvero sbagliato otto volte penserebbe di aver perso il
  -- profilo per sempre — e non avrebbe nessun modo di scoprire che
  -- bastava aspettare.
  if found and t.sbagliati >= LIMITE and t.ultimo > now() - PAUSA then
    raise exception 'Troppi tentativi sbagliati. Riprova fra 15 minuti.';
  end if;

  select * into m from members where access_code = upper(trim(p_codice));

  if not found then
    -- Il conto sale. E riparte da uno se l'ultimo errore è vecchio: chi
    -- sbaglia due volte oggi e due domani non deve trovarsi murato fuori
    -- al quarto tentativo di una settimana.
    insert into tentativi_codice (auth_id, sbagliati, ultimo)
         values (auth.uid(), 1, now())
    on conflict (auth_id) do update
       set sbagliati = case
             when tentativi_codice.ultimo < now() - PAUSA then 1
             else tentativi_codice.sbagliati + 1
           end,
           ultimo = now();

    -- Qui il «non riconosciuto» è vero, e si può dire: lista vuota.
    return;
  end if;

  -- Codice giusto: il conto si azzera. Senza, uno che sbaglia sette volte
  -- e poi indovina resterebbe a un tentativo dal muro per sempre.
  delete from tentativi_codice where auth_id = auth.uid();

  insert into member_devices (auth_id, member_id)
       values (auth.uid(), m.id)
  on conflict (auth_id) do update set member_id = excluded.member_id;

  return next m;
end $$;

revoke execute on function entra_col_codice(text) from public, anon;
grant execute on function entra_col_codice(text) to authenticated;

-- ————————————————————————————————————————————————————— a che punto siamo

-- ⚠️ Da guardare prima di chiudere le porte, ed è l'unica cosa che dice
-- quando si può: finché una riga qui sotto ha `telefoni` a zero, la
-- chiusura non si lancia.
select m.name,
       count(d.auth_id) as telefoni,
       max(d.created_at) as ultimo_aggancio
  from members m
  left join member_devices d on d.member_id = m.id
 group by m.id, m.name
 order by count(d.auth_id), m.name;

-- All For One — un giro d'accusa, un voto solo.
--
-- Il problema. `apriVoto` faceva due cose in fila: prima l'INSERT del
-- voto, poi l'UPDATE della partita protetto da `vote_id is null`. La
-- protezione c'era, ma arrivava troppo tardi.
--
-- Sei telefoni vedono lo stato passare a 'voto' nello stesso istante,
-- ognuno con la sua copia dove `vote_id` è ancora nullo. Partono sei
-- `apriVoto`. L'UPDATE lo vince uno solo — quello sì — ma le SEI righe in
-- `votes` sono già state scritte tutte. Cinque sondaggi orfani per ogni
-- giro d'accusa, aperti e votabili per chi ne conosce l'id.
--
-- Nell'interfaccia non si vedevano, e per un po' è sembrato innocuo. Non
-- lo è: da quando i giri di una partita si ritrovano per finestra
-- temporale — i voti di categoria `impostore` fra questa partita e la
-- successiva — quegli orfani **cadono dentro la finestra** e vengono
-- contati come giri. Le loro schede sono vuote, quindi non regalano punti
-- a nessuno, ma gonfiano il conto su cui `giriTuttiNoti` decide se il
-- finale può dire "nessuno ha indovinato".
--
-- La correzione è la stessa forma di tutte le altre scritture concorrenti
-- di questo progetto: **una funzione sola, con la riga bloccata**. Chi
-- arriva secondo non crea niente e si ritrova quello vero.

create or replace function apri_voto_impostore(
  p_partita uuid,
  p_viaggio text,
  p_opzioni text[],
  p_scade timestamptz
)
returns impostore_games
language plpgsql
security definer
set search_path = public
as $$
declare
  g impostore_games;
  v uuid;
begin
  -- `for update` blocca la riga: gli altri cinque aspettano qui, e quando
  -- passano trovano vote_id già pieno.
  select * into g from impostore_games where id = p_partita for update;
  if not found then raise exception 'Questa partita non esiste.'; end if;

  -- Chi arriva secondo esce senza scrivere. Non è un errore: è la
  -- risposta giusta, e chi l'ha ricevuta si ritrova la partita vera.
  if g.stato <> 'voto' or g.vote_id is not null then
    return g;
  end if;

  if p_opzioni is null or array_length(p_opzioni, 1) is null then
    raise exception 'Un voto senza opzioni non si apre.';
  end if;

  insert into votes (trip_id, category, question, options, anonymous, tally, expires_at)
  values (
    p_viaggio,
    'impostore',
    'Chi e’ l’impostore?',
    p_opzioni,
    -- Mai anonimo: senza sapere chi ha votato chi non si può dare il
    -- punto a chi ha indovinato.
    false,
    (select coalesce(array_agg(0), '{}') from generate_series(1, array_length(p_opzioni, 1))),
    p_scade
  )
  returning id into v;

  update impostore_games set vote_id = v where id = p_partita returning * into g;

  return g;
end $$;

revoke execute on function apri_voto_impostore(uuid, text, text[], timestamptz) from public;
grant execute on function apri_voto_impostore(uuid, text, text[], timestamptz) to authenticated;

notify pgrst, 'reload schema';

-- All For One — un rimborso registrato una volta sola.
--
-- Il problema. Il tasto «Salda» ce l'hanno in mano tutti e due: chi paga e
-- chi incassa. È voluto — se i contanti te li mette in mano lui, l'app
-- aperta ce l'hai tu — ma vuol dire che lo stesso passaggio di soldi può
-- essere registrato due volte, una per telefono, nel giro di pochi secondi.
--
-- Un debito di 30 € saldato due volte sposta il saldo di 60 € nella
-- direzione sbagliata su due persone: chi doveva dare risulta in credito,
-- chi doveva ricevere risulta a meno trenta. E per accorgersene bisogna
-- aprire la scheda Rimborsi e notare due righe identiche con la stessa
-- data — cioè non se ne accorge nessuno fino alla sera dei conti.
--
-- La correzione è la stessa forma di ogni altra scrittura concorrente del
-- progetto: passa da una funzione, con la finestra guardata dentro una
-- transazione invece che da due telefoni che non si vedono.
--
-- ⚠️ LA SCELTA, detta chiara. Due rimborsi identici — stesse persone,
-- stesso importo — a meno di due minuti l'uno dall'altro sono considerati
-- lo stesso rimborso, e il secondo restituisce il primo invece di
-- aggiungerne un altro.
--
-- È una scelta, non una verità: due passaggi veri di 30 € fra le stesse
-- due persone nello stesso paio di minuti esistono in teoria. Ma il danno
-- dei due casi non è simmetrico. Un doppione silenzioso sposta 60 € e non
-- lo scopre nessuno fino alla fine; un secondo pagamento vero rifiutato lo
-- si vede subito — il saldo non si muove come ci si aspetta — e si
-- riregistra fra due minuti. Si sbaglia dalla parte che si vede.

create or replace function registra_rimborso(
  p_viaggio text,
  p_da uuid,
  p_a uuid,
  p_centesimi int,
  p_minuti int default 2
)
returns payments
language plpgsql
security definer
set search_path = public
as $$
declare
  r payments;
begin
  if p_da = p_a then
    raise exception 'Un rimborso a se stessi non vuol dire niente.';
  end if;
  if p_centesimi is null or p_centesimi <= 0 then
    raise exception 'Un rimborso deve avere un importo.';
  end if;

  -- Ce n'è già uno uguale, appena registrato? Allora è lo stesso, e il
  -- secondo telefono si riprende quello invece di scriverne un altro.
  select * into r
    from payments
   where trip_id = p_viaggio
     and from_member = p_da
     and to_member = p_a
     and amount_cents = p_centesimi
     and deleted_at is null
     and created_at > now() - make_interval(mins => p_minuti)
   order by created_at desc
   limit 1;

  if found then
    return r;
  end if;

  insert into payments (trip_id, from_member, to_member, amount_cents)
  values (p_viaggio, p_da, p_a, p_centesimi)
  returning * into r;

  return r;
end $$;

revoke execute on function registra_rimborso(text, uuid, uuid, int, int) from public;
grant execute on function registra_rimborso(text, uuid, uuid, int, int) to authenticated;

notify pgrst, 'reload schema';

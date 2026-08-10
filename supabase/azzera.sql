-- All41 — la classifica riparte da zero la mattina del 12.
--
-- Fra il rilascio e la partenza il gruppo puo' gia' assegnarsi punti con
-- le proposte: e' voluto, serve a far provare il meccanismo. Ma quei
-- punti non devono contare per il viaggio, o si arriva al 12 con una
-- classifica gia' scritta da due giorni di prove.
--
-- ⚠️ Il taglio e' una data FISSA, non «adesso».
--
-- E' la cosa che rende questa funzione sicura da chiamare in ritardo, o
-- due volte, o tre. Cancella solo quello che sta **prima delle 6 del 12**
-- e ricalcola i punteggi da quello che resta: se parte alle 6:40 invece
-- che alle 6:00 — i cron del piano Hobby non sono puntuali — i punti
-- guadagnati fra le 6:00 e le 6:40 restano dove sono. Con un taglio a
-- «adesso» sarebbero spariti, e nessuno avrebbe capito perche'.
--
-- ⚠️ Gli eventi si cancellano, non si nascondono. La Classifica mostra
-- lo storico accanto al punteggio: lasciando gli eventi vecchi con i
-- totali a zero, la somma a schermo non tornerebbe con il numero sopra —
-- ed e' esattamente il tipo di bugia che questa app non racconta.

create or replace function azzera_prima_del_viaggio()
returns table (cancellati integer, membri integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  taglio timestamptz := '2026-08-12 06:00:00+02';
  quanti integer;
  quanti_membri integer;
begin
  delete from point_events where created_at < taglio;
  get diagnostics quanti = row_count;

  -- ⚠️ Ricalcolato da quello che resta, non messo a zero.
  --
  -- Mettere `score = 0` sarebbe giusto solo se la funzione girasse
  -- esattamente al taglio. Girando dopo cancellerebbe il lavoro di chi
  -- ha gia' giocato, e girando due volte azzererebbe tutto una seconda
  -- volta. Cosi' invece il punteggio e' sempre la somma di quello che
  -- c'e' davvero, e la funzione si puo' chiamare quante volte si vuole.
  update members m
     set score = coalesce(
       (select sum(p.points)
          from point_events p
         where p.member_id = m.id
           and p.status = 'approved'), 0);
  get diagnostics quanti_membri = row_count;

  return query select quanti, quanti_membri;
end $$;

revoke execute on function azzera_prima_del_viaggio() from public;
revoke execute on function azzera_prima_del_viaggio() from anon;
revoke execute on function azzera_prima_del_viaggio() from authenticated;
-- La chiama solo il server, con la chiave di servizio: dal telefono
-- nessuno deve poter azzerare la classifica di tutti.

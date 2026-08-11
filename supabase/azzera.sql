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
-- due volte, o tre. Cancella solo quello che sta **prima delle 19 dell'11**
-- e ricalcola i punteggi da quello che resta: se parte alle 19:40 invece
-- che alle 19:00 — i cron del piano Hobby non sono puntuali — i punti
-- guadagnati fra le 19:00 e le 19:40 restano dove sono. Con un taglio a
-- «adesso» sarebbero spariti, e nessuno avrebbe capito perche'.
--
-- ⚠️ Doveva essere il 12 alle 6, all'arrivo a Quartu. L'Etna ha chiuso
-- Fontanarossa, il volo si e' spostato a Palermo alle 5:45 del 12, e la
-- partenza da casa e' diventata la sera dell'11. Il viaggio comincia
-- quando si esce di casa, non quando si atterra.
--
-- ⚠️ Gli eventi si cancellano, non si nascondono. La Classifica mostra
-- lo storico accanto al punteggio: lasciando gli eventi vecchi con i
-- totali a zero, la somma a schermo non tornerebbe con il numero sopra —
-- ed e' esattamente il tipo di bugia che questa app non racconta.
--
-- ⚠️ E non bastano i punti: si azzerano anche le **partite**.
--
-- L'11 si sono aperti la Dama e All, e i punti non erano l'unica cosa
-- che restava scritta. La Dama tiene la sua classifica contando le
-- partite vinte in `dama_games`, e All il record del giorno in
-- `sheep_records`: due tabelle che nessun ricalcolo di `members.score`
-- tocca. Senza questo, il 12 si arriva con «hai vinto 4-1» maturato
-- giocando sul divano la sera prima, e la classifica della Dama non
-- c'entra niente con il viaggio.

drop function if exists azzera_prima_del_viaggio();

create or replace function azzera_prima_del_viaggio()
returns table (cancellati integer, membri integer, partite integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  taglio timestamptz := '2026-08-11 19:00:00+02';
  quanti integer;
  quanti_membri integer;
  quante_partite integer := 0;
  n integer;
begin
  delete from point_events where created_at < taglio;
  get diagnostics quanti = row_count;

  -- Le partite di prova, con lo stesso taglio fisso dei punti.
  --
  -- ⚠️ Una partita di Dama cominciata l'11 sera e ancora aperta sparisce
  -- da sotto le mani di chi la sta giocando. E' voluto: alle 6 del
  -- mattino nessuno sta muovendo pedine, e una partita a cavallo del
  -- taglio conterebbe meta' prove e meta' viaggio.
  delete from dama_games where created_at < taglio;
  get diagnostics n = row_count;
  quante_partite := quante_partite + n;

  -- L'Impostore resta coperto fino al 12, quindi qui non c'e' niente da
  -- cancellare. Sta scritto lo stesso: se un giorno si aprisse in
  -- anticipo come la Dama, questa riga e' gia' al posto giusto — e una
  -- riga che cancella zero righe non costa niente.
  delete from impostore_games where created_at < taglio;
  get diagnostics n = row_count;
  quante_partite := quante_partite + n;

  -- ⚠️ All si taglia su `updated_at` e non sul `giorno`.
  --
  -- `sheep_records` non ha un `created_at`: ha il **giorno** del record,
  -- che e' una data senza ore. Finche' il taglio era all'alba del 12 le
  -- due cose coincidevano. Con il taglio alle 19 dell'11 no: un record
  -- fatto in aeroporto alle 21 ha `giorno = 11`, e tagliando per giorno
  -- verrebbe buttato via insieme a quelli delle prove del pomeriggio.
  -- `updated_at` e' un istante, e con un istante il confronto torna.
  delete from sheep_records where updated_at < taglio;
  get diagnostics n = row_count;
  quante_partite := quante_partite + n;

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

  return query select quanti, quanti_membri, quante_partite;
end $$;

revoke execute on function azzera_prima_del_viaggio() from public;
revoke execute on function azzera_prima_del_viaggio() from anon;
revoke execute on function azzera_prima_del_viaggio() from authenticated;
-- La chiama solo il server, con la chiave di servizio: dal telefono
-- nessuno deve poter azzerare la classifica di tutti.

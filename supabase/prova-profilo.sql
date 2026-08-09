-- Quattro profili di prova, per poter provare l'app da un browser.
--
-- Quattro e non uno: sotto i quattro giocatori l'Impostore non parte, e
-- senza partita non si prova la meta' del gioco.
--
-- ⚠️ VANNO TOLTI PRIMA DI FAR ENTRARE IL GRUPPO. Un profilo in piu' sballa
-- i saldi delle Spese di tutti e non se ne va da solo. Li porta via
-- `svuota.sql` insieme a tutto il resto, oppure la riga in fondo se si
-- vuole togliere solo loro.
--
-- I codici sono fissi e riconoscibili apposta: PROVA1..PROVA4. Se se ne
-- trova uno in giro a viaggio iniziato, e' rimasta della roba di prova.

insert into members (trip_id, name, avatar_seed, avatar_style, access_code)
select 'sardegna-2026', v.n, v.s, 'adventurer', v.c
from (values
  ('Prova',  'prova1', 'PROVA1'),
  ('Prova2', 'prova2', 'PROVA2'),
  ('Prova3', 'prova3', 'PROVA3'),
  ('Prova4', 'prova4', 'PROVA4')
) as v(n, s, c)
where not exists (select 1 from members where access_code = v.c);

select id, name, access_code from members where access_code like 'PROVA%' order by access_code;

-- Per toglierli senza svuotare tutto il resto:
--   delete from members where access_code like 'PROVA%';

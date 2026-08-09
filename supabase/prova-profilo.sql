-- Un profilo di prova, per poter provare l'app da un browser.
--
-- ⚠️ VA TOLTO PRIMA DI FAR ENTRARE IL GRUPPO. Un profilo in più sballa i
-- saldi delle Spese di tutti e non se ne va da solo. Lo porta via
-- `svuota.sql` insieme a tutto il resto, oppure la riga in fondo a questo
-- file se si vuole togliere solo lui.
--
-- Il codice d'accesso è fisso e riconoscibile apposta: `PROVA1`. Se lo si
-- trova in giro a viaggio iniziato, è questo profilo che è rimasto.

insert into members (trip_id, name, avatar_seed, avatar_style, access_code)
select 'sardegna-2026', 'Prova', 'prova', 'adventurer', 'PROVA1'
where not exists (select 1 from members where access_code = 'PROVA1');

select id, name, access_code from members where access_code = 'PROVA1';

-- Per toglierlo da solo, senza svuotare tutto:
--   delete from members where access_code = 'PROVA1';

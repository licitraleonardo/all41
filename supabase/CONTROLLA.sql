-- ====================================================================
-- COM’È MESSO IL DATABASE — solo lettura, non cambia niente
-- ====================================================================
--
-- Quattro righe: se dicono tutte “a posto”, DA-LANCIARE.sql è arrivato
-- tutto. Si può rilanciare quando si vuole, non tocca nessun dato.
--
-- ⚠️ GENERATO da strumenti/unisci-sql.mjs — non modificarlo a mano.


-- ====================================================================
-- È ANDATA? Quattro righe, tutte devono dire "a posto".
-- ====================================================================

select
  'La Dama esiste' as cosa,
  case when to_regclass('public.dama_games') is not null
       then 'a posto' else 'MANCA — rilancia il file' end as com_e
union all
select
  'La Dama parla in tempo reale',
  case when exists (
         select 1 from pg_publication_tables
         where pubname = 'supabase_realtime' and tablename = 'dama_games')
       then 'a posto'
       else 'MANCA — le mosse dell''altro non arriveranno mai' end
union all
select
  'Il testimone dei 30 secondi',
  case when exists (
         select 1 from information_schema.columns
         where table_name = 'impostore_games' and column_name = 'turno_da')
       then 'a posto' else 'MANCA — il tasto resta libero per tutti' end
union all
select
  'L''Impostore parte e conta i giri',
  case when exists (
         select 1 from pg_proc
         where proname = 'avvia_impostore' and pronargs = 5)
       and exists (
         select 1 from pg_proc
         where proname = 'chiudi_accusa' and pronargs = 7)
       then 'a posto' else 'MANCA — la partita non parte o resta su Giro 1' end
;

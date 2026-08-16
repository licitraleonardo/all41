-- A che punto siamo con la fortezza.
--
--   npm run sql:lancia supabase/chi-si-e-agganciato.sql
--
-- ⚠️ Legge e basta, non cambia niente: si può lanciare quante volte si
-- vuole.
--
-- È l'unica cosa che dice quando si possono chiudere le porte. Finché
-- una riga qui sotto ha `telefoni` a zero, la chiusura non si lancia —
-- perché a porte chiuse un telefono non agganciato non riceve un errore,
-- riceve zero righe: foto sparite, chat sparita, spese sparite, e nessun
-- messaggio che spieghi perché.
--
-- Chi manca deve solo **aprire l'app**. L'aggancio è automatico e non si
-- vede; arriva col primo aggiornamento, quindi a qualcuno può servire
-- riaprirla una seconda volta.

select m.name                     as chi,
       count(d.auth_id)           as telefoni,
       max(d.created_at)          as ultimo_aggancio
  from members m
  left join member_devices d on d.member_id = m.id
 group by m.id, m.name
 order by count(d.auth_id), m.name;

-- Il telefono di chi si registra, per le Info.
--
-- ⚠️ Sta sul database e non nel codice, al contrario dei numeri di
-- emergenza: quelli sono fissi e devono esserci anche con lo storage
-- vuoto, questo lo scrive ognuno per sé. La copia locale delle letture
-- (`conCache`, chiave `membri`) fa sì che una volta scaricato resti
-- leggibile anche senza rete — che è la promessa fatta a chi lo lascia.
--
-- Volutamente `text` e non un tipo con vincoli: il controllo del formato
-- sta in `lib/telefono.js`, dove si può dare un messaggio in italiano
-- invece di un errore del database. Qui basta che ci stia.
--
-- Nullable, e nullable resta: lasciarlo è facoltativo, e un `not null`
-- trasformerebbe una domanda in un pedaggio.
alter table members add column if not exists phone text;

comment on column members.phone is
  'Facoltativo, lasciato in fase di registrazione. Compare nelle Info del viaggio.';

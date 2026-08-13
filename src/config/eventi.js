// Gli eventi che si prendono lo schermo.
//
// Non sono notifiche e non sono cartelli: sono le poche cose che
// meritano di fermare quello che stavi facendo, una volta sola, con i
// coriandoli. Finora ce n'erano due, e vivevano dentro `Celebrazione`:
// l'MVP della giornata e una Legge appena scoperta.
//
// ⚠️ I testi stanno qui e non nel componente. Un evento è per definizione
// una cosa che si scrive per l'occasione — «avete mangiato troppo
// porceddu» non è una stringa di sistema — e vanno tenuti dove si
// riscrivono senza aprire il codice che li disegna.

// L'arrabbiatura del Testamento: il rimescolamento dei punti del 13
// agosto.
//
// Il punteggio non lo capiva più nessuno, e chi ne aveva tanti meno di
// tutti. Invece di correggerlo in silenzio — che avrebbe cambiato i
// numeri sotto gli occhi del gruppo senza spiegare niente — si è
// rimescolato una volta sola e lo si è annunciato.
export const TESTAMENTO_ARRABBIATO = {
  // ⚠️ È anche l'identificativo delle righe sul database
  // (`point_events.rule_id`) e la chiave del segno che ognuno ha già
  // visto lo schermo. Cambiandolo qui, l'evento si rivede da capo su
  // tutti i telefoni.
  id: 'testamento-arrabbiato',

  occhiello: '📜 Il Testamento si è arrabbiato',
  titolo: 'Avete mangiato troppo porceddu',
  testo: 'I punti sono stati rimessi a posto da capo. Ricominciate a guadagnarveli.',

  // Quanto resta a schermo prima di chiudersi da sola. Più lunga delle
  // altre celebrazioni: qui sotto c'è una classifica da leggere, non un
  // nome solo.
  secondi: 9,
}

// Il segno, sul telefono, di chi l'ha già visto. Sta in `localStorage` e
// non sul database di proposito: «l'ho già visto» è una cosa di questo
// schermo, e chi apre l'app dal portatile ha diritto di vederlo lì.
export function chiaveVisto(idEvento) {
  return `all41.evento.${idEvento}`
}

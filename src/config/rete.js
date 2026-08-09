// Quanto si aspetta la rete prima di dire che non risponde.
//
// Sta qui e non accanto alle singole sezioni perché è una regola sola per
// tutta l'app: con una tacca di segnale una richiesta **non fallisce,
// aspetta**, e senza un tetto nessun `catch` scatta mai. È la stessa forma
// di difetto trovata tre volte in due giorni — l'SOS che restava su
// "Invio…", la foto che non arrivava mai in coda, e la scheda Spese ferma
// sulla rotella.
//
// I due numeri delle scritture stanno invece vicino a quello che
// governano, perché dipendono da cosa si sta mandando: l'SOS ha dieci
// secondi (`SECONDI_ATTESA` in `azioni.js`) perché è un rigo di testo e
// chi aspetta deve poter decidere se telefonare; l'upload di una foto ne
// ha quarantacinque (`SECONDI_UPLOAD` in `foto.js`) perché sono 300 KB.

// Dodici secondi per una lettura.
//
// Sotto gli otto si scambia per guasto una rete solo lenta, e servire la
// copia vecchia quando quella fresca stava arrivando è un peggioramento.
// Sopra i quindici la rotella diventa "l'app è rotta" per chi guarda: la
// pazienza di chi ha il telefono in mano davanti agli amici è più corta di
// quella di chi aspetta che parta un messaggio.
//
// ⚠️ Scaduta NON vuol dire annullata: `conScadenza` lascia correre la
// richiesta. Se arriva al quindicesimo secondo la copia è già stata
// servita, ma il dato buono non è perso — la prossima lettura lo trova, e
// dove c'è il realtime arriva anche da solo.
export const SECONDI_LETTURA = 12

// ------------------------------------------------- il pavimento, sotto tutto
//
// I tetti qui sopra coprono tre punti su una sessantina. Sono i tre a cui
// qualcuno ha pensato — e non basta pensarci, perché la volta scorsa
// `caricaFoto` ha avvolto con cura le sue due chiamate di rete e si è
// lasciata fuori il controllo dei limiti una riga sopra. Con quello appeso,
// la foto non finiva nemmeno nella coda costruita apposta per non perderla.
//
// Questi sono il pavimento: si applicano a OGNI chiamata che passa dal
// client, comprese quelle che nessuno andrebbe a cercare — la sessione
// anonima all'avvio, il conteggio dei limiti, la lettura degli SOS aperti
// sugli altri sette telefoni.
//
// Sono generosi apposta. Non servono a dare una risposta pronta: servono a
// garantire che una risposta arrivi. Chi vuole essere più svelto mette un
// tetto suo più stretto sopra, com'è già per l'SOS e per le foto — e quello
// resta la decisione di prodotto.
//
// ⚠️ Il pavimento dev'essere sempre PIÙ ALTO di ogni tetto interno, o i
// numeri scelti con cura smettono di significare qualcosa.
export const SECONDI_RETE = {
  // Entrare. Trenta secondi sono tanti per una schermata che dice "Un
  // attimo.", ma è la cosa da cui dipende tutto il resto: meglio farla
  // aspettare che rimandarla indietro quando ce l'avrebbe fatta.
  auth: 30,

  // Leggere e scrivere righe. Le letture che passano da `conCache` hanno
  // già i loro dodici secondi e non arrivano mai qui; questo prende le
  // altre, e tutte le scritture.
  //
  // ⚠️ PostgREST ritenta le GET fino a tre volte da solo, e questo tetto
  // avvolge un tentativo per volta: nel caso peggiore sono tre volte
  // trenta. Resta finito, che è tutto quello che serve — prima era
  // infinito. Il tetto di `conCache`, che sta attorno all'intera sequenza,
  // continua a essere quello che conta per le letture normali.
  rest: 30,

  // Mandare file. Un vocale di un minuto o un PDF non compresso sono un
  // altro ordine di grandezza rispetto a una riga di database, e tagliarli
  // a trenta secondi vorrebbe dire non farli passare mai con poco segnale.
  storage: 90,
}

// La chiave pubblica delle notifiche.
//
// ⚠️ Sta nel codice, in chiaro, ed e' giusto cosi': la meta' pubblica di
// una coppia VAPID serve proprio a essere spedita a tutti i browser. La
// meta' privata sta fra le variabili d'ambiente di Vercel, e senza quella
// nessuno puo' mandare niente.
export const CHIAVE_PUBBLICA_PUSH =
  'BMmTtsxcu7RHWiDxA9vAxFuz78WHL0b-BwavuBESjwTCbnHiTXzMreZ-e5v7eLLA5D5vHeh5uNj0PvLUfFWw2g8'

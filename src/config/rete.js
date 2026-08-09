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

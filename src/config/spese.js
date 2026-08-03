// Regole della sezione Spese, fuori dai componenti.
//
// È l'unica sezione fuori dal sistema punti: qui non si guadagna e non si
// perde niente, e Allan non commenta i soldi degli altri. Nessun limite di
// velocità, nessuna Legge, nessuna battuta.

// Verifica bloccante n.4: ogni lettura ha un tetto. Cinque giorni per
// otto persone non arrivano a cento spese nemmeno volendo, ma il tetto
// c'è comunque perché la regola non ha eccezioni.
export const TETTO_ELENCO = 100

export const MAX_DESCRIZIONE = 60

// Cinquemila euro. Non è un limite di buon senso sul viaggio, è una rete
// contro lo zero di troppo: 4500 al posto di 45,00 sballa i conti di
// tutti e nessuno se ne accorge subito.
export const MAX_CENTESIMI = 500000

// L'autore può togliere una sua spesa senza scadenza, al contrario di
// messaggi e foto che si cancellano entro cinque minuti. Un importo
// storto lo scopri quando fai i conti la sera, non entro cinque minuti
// dall'averlo scritto — e una cifra sbagliata che resta lì per cinque
// giorni li sbaglia a tutti.
export const ELIMINA_SENZA_SCADENZA = true

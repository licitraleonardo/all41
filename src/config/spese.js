// Regole della sezione Spese, fuori dai componenti.
//
// È l'unica sezione fuori dal sistema punti: qui non si guadagna e non si
// perde niente, e Allan non commenta i soldi degli altri. Nessun limite di
// velocità, nessuna Legge, nessuna battuta.

// Verifica bloccante n.4: ogni lettura ha un tetto.
//
// ⚠️ Era cento, ed è la stessa forma del difetto già pagato con
// `chiudiScaduti`: un tetto scelto pensando «non ci arriviamo mai» che
// diventa un troncamento silenzioso. Con le righe eliminate che occupavano
// un posto ciascuna, la sera del 16 — quando si tira la riga — le spese dei
// primi due giorni sarebbero semplicemente sparite dai conti di tutti.
//
// E non lo prendeva nessuna prova: i saldi troncati sommano comunque a zero,
// perché è un sottoinsieme coerente. Sono sbagliati e tornano lo stesso.
//
// Adesso sono cinquecento, e soprattutto le eliminate non si leggono più
// (vedi `leggiSpese`), quindi il tetto conta solo righe vere.
export const TETTO_ELENCO = 500

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

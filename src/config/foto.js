// Una foto da telefono pesa 3-5 MB. Otto persone per cinque giorni fanno
// tranquillamente 2-3 GB: significa superare lo storage gratuito, upload
// lentissimi sotto l'ombrellone con una tacca, e traffico consumato da
// tutti quando aprono la galleria.
//
// Ridimensionare a 1600px sul lato lungo e riesportare in JPEG 0.8 porta
// un file da 4 MB a circa 300 KB. Sono venti righe di codice che decidono
// se la feature funziona o no in mobilità.

export const LATO_LUNGO_MAX = 1600
export const QUALITA = 0.8

// Verifica bloccante n.4: ogni lettura ha un tetto, con caricamento
// incrementale a scorrimento.
export const PER_PAGINA = 40

export const TIPI_ACCETTATI = 'image/*'

// Quante foto mai partite si tengono da parte sul telefono. Oltre questo
// non si accumula: se il viaggio finisce con venti foto in attesa, il
// problema non è la coda.
export const MASSIMO_IN_CODA = 20

// Quanto si aspetta l'upload prima di dire che non ha risposto.
//
// Serve per lo stesso motivo dell'SOS: con una tacca di segnale la fetch
// non fallisce, resta appesa. E lì il danno è peggiore, perché è proprio
// il fallimento che accende la coda — senza errore la foto non viene
// messa da parte, e chi ha appena scattato non ha un secondo posto dove
// ritrovarla.
//
// Quarantacinque e non dieci come l'SOS: qui si stanno spedendo 300 KB, e
// con una tacca venti o trenta secondi sono una rete lenta, non una rete
// morta. La compressione resta fuori dal conto — su un iPhone il
// decodificatore HEIC pesa 3 MB e li scarica lui.
export const SECONDI_UPLOAD = 45

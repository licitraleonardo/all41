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

// Documenti del viaggio.
//
// Il problema vero: QR dell'escursione in barca, biglietti del traghetto,
// PDF delle prenotazioni oggi vivono sepolti nella chat di uno solo, e
// servono sempre nel momento peggiore — davanti a chi controlla, con una
// tacca di segnale.
//
// ⚠️ NON è un'area personale e non va chiamata così. Con auth anonima e
// codice di accesso, "privato" non è realmente privato: chi apre il
// database vede tutto. Il flag "solo per me" toglie un documento dalla
// vista degli altri, e basta. I testi lo dicono in chiaro, perché
// promettere una privacy che l'app non può mantenere è peggio che non
// offrirla.

export const TIPI_ACCETTATI = 'image/*,application/pdf'

// Un QR ridotto a 1600px e riesportato a 0,8 può diventare illeggibile,
// ed è esattamente la cosa che deve funzionare al primo colpo. I
// documenti passano più larghi e più puliti delle foto dell'album.
export const LATO_LUNGO_MAX = 2400
export const QUALITA = 0.92

// I PDF non si comprimono: passano com'è. Sopra questa soglia però non
// si caricano — su una tacca di segnale un file da venti mega non parte
// e basta, e resta lì a far pensare che l'app sia rotta.
export const MAX_BYTE = 10 * 1024 * 1024

export const MAX_TITOLO = 60

export const TETTO_ELENCO = 60

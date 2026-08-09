// Sondaggio lampo: domande preimpostate, non testo libero. Serve a
// decidere in dieci secondi mentre si è in piedi davanti a un ristorante,
// non a scrivere un questionario.

export const SONDAGGI = [
  { id: 'mangia-qui', domanda: 'Si mangia qui?', opzioni: ['Sì', 'Cerchiamo altro'] },
  { id: 'ci-spostiamo', domanda: 'Ci spostiamo?', opzioni: ['Sì', 'Stiamo qui'] },
  { id: 'torna-casa', domanda: 'Si torna a casa?', opzioni: ['Sì', 'Restiamo'] },
  { id: 'bagno', domanda: 'Ultimo bagno?', opzioni: ['Sì', 'Basta così'] },
]

// Un sondaggio di logistica serve adesso: dopo un quarto d'ora la domanda
// non ha più senso e si chiude da sola.
export const DURATA_MINUTI = 15

// Quali voti il primo che apre l'app può chiudere perché scaduti.
//
// Non tutti. Senza un server, la scadenza la fa scattare chi apre l'app —
// ed è giusto per le domande che hanno una data di morte vera:
//
//   logistics      "si mangia qui?" dopo un quarto d'ora non vuol dire più
//                  niente, e restare aperto è peggio che chiudersi
//   photo-of-day   la finestra della caccia si chiude, ed è quello che
//                  decide chi ha vinto la sfida
//
// ⚠️ `point-proposal` è uscito da qui il 9 agosto, ed è lo stesso difetto
// dell'Impostore per un'altra porta.
//
// Una proposta di punti non va solo chiusa: va chiusa **e applicata**. Se
// ne occupa `risolvi_proposta`, che fa tutte e due le cose insieme — e per
// farle ha bisogno di trovare il voto ancora aperto (`closed_at is null`,
// vedi `risolviProposte`). `chiudiScaduti` gli arrivava davanti, chiudeva
// il voto e basta: da lì `risolviProposte` non lo trovava più.
//
// Il risultato è il peggiore possibile per un sistema a punti. Una
// proposta votata e **approvata dal gruppo** non pagava mai: il punto
// restava `pending`, non entrava in classifica, spariva dal banner e dallo
// storico, e non scattavano nemmeno le Leggi della chiusura. Nessun
// errore, e i punti non si recuperano dopo.
//
// All'avvio partivano insieme (`App.jsx`), e a vincere la corsa era quasi
// sempre `chiudiScaduti`, che è una query semplice.
//
// L'Impostore no, e non è un dettaglio: il suo voto **non ha una
// scadenza vera**. `vota_impostore` nel database controlla `closed_at` ma
// di proposito NON controlla `expires_at` — una partita in otto persone
// dura quanto dura, e non si mette fretta a un tavolo. Quei trenta minuti
// sulla riga ci sono solo perché la colonna non ammette il vuoto.
//
// Chiuderlo lo pianta e basta: da lì `vota_impostore` risponde "Il voto è
// chiuso" a tutti, la partita resta ferma sullo stato `voto` e non esiste
// nessun modo di uscirne. Bastava che qualcuno riaprisse l'app mezz'ora
// dopo aver aperto l'accusa — cioè una cena.
//
// ⚠️ Il filtro sta nella *lettura*, non nella chiusura, e conta: la
// ricerca dei voti scaduti si ferma a venti. Venti voti dell'Impostore
// rimasti aperti dalle sere prima riempirebbero tutti i posti, e il
// sondaggio di stasera non verrebbe chiuso mai — un difetto diverso, dallo
// stesso errore.
export const CATEGORIE_CHE_SCADONO = ['logistics', 'photo-of-day']

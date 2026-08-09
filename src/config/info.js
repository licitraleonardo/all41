import { VIAGGIO } from './viaggio.js'

// Le informazioni pratiche: dove si dorme e chi si chiama se serve.
//
// Sta nel codice e non sul database apposta: e' l'unico pezzo dell'app
// che potrebbe servire col telefono che non prende e uno che ha fretta.
// Una sezione di emergenza che si scarica dalla rete e' una sezione di
// emergenza rotta.
//
// ⚠️ Qui dentro non si scrive niente "a memoria". Un numero inventato in
// una sezione che si chiama emergenze e' peggio che non avere la
// sezione: chi lo trova ci crede. Quello che manca resta scritto come
// mancante, e si aggiunge quando qualcuno lo verifica davvero.
//
// 📌 Regola per chi aggiunge: **ogni numero porta la sua fonte**, scritta
// nel commento sopra. Non "l'ho trovato su internet" ma dove, cosi' chi
// arriva fra un anno puo' ricontrollarlo in trenta secondi invece di
// rifare la ricerca da capo. Verificati il 9 agosto 2026.

export const DOVE = {
  nome: "Villaggio S'oru 'e Mari",
  comune: 'Quartu Sant’Elena (CA)',
  quando: VIAGGIO.etichetta,
  checkIn: 'Check-in mercoledì 12 alle 17:00',
  // Trascritto dallo spec del viaggio, non cercato in rete: è la stessa
  // riga che sta in sardegna-trip-app-spec.md. Serve a chi arriva in
  // taxi dall'aeroporto e deve dettarlo al tassista.
  indirizzo: "Villaggio S'oru 'e Mari, 37 — Quartu Sant'Elena",
  // ⚠️ Resta mancante, ma per un motivo diverso da quello che si credeva.
  //
  // S'oru 'e Mari **non è un residence con una reception**: è una località
  // residenziale sulla costa, dove l'indirizzo è "Villaggio S'oru 'e Mari,
  // <numero civico>" — al 13 c'è una casa di riposo, all'83/B un B&B, al 37
  // stiamo noi. Quindi un "telefono del villaggio" da cercare non esiste:
  // quello che serve è il numero di **chi ci affitta la casa**, e ce l'ha
  // solo Leonardo.
  telefono: null,
}

// ------------------------------------------------------------ emergenze
//
// Qui dentro solo numeri **gratuiti, attivi 24 ore su 24, e validi su
// tutta l'isola**. Sono tre, e sono tre apposta: in emergenza si scorre
// una lista con gli occhi, e ogni riga in più è tempo. Tutto il resto —
// guardia medica, farmacia, capitaneria — sta nella lista sotto, che si
// legge con calma.
export const EMERGENZE = [
  {
    numero: '112',
    cosa: 'Emergenze, qualunque cosa sia',
    dettaglio: 'Carabinieri, polizia, ambulanza, vigili del fuoco: risponde una centrale sola',
    quando: 'Sempre — anche senza credito, senza SIM, col telefono bloccato',
  },
  // Fonte: guardiacostiera.gov.it, pagina della Capitaneria di porto di
  // Cagliari — "1530 Emergenza in mare".
  // Ci sta perché dormiamo sulla spiaggia e il 14 si va in barca a vela:
  // è l'unico numero che manda direttamente chi ha un mezzo in acqua.
  {
    numero: '1530',
    cosa: 'Emergenza in mare',
    dettaglio: 'Guardia Costiera. Per chi è in acqua, in barca, o non si vede più rientrare',
    quando: 'Sempre, gratis',
  },
  // Fonte: sardegnaambiente.it, pagina del servizio 1515 del Corpo
  // forestale e di vigilanza ambientale della Regione Sardegna. Attivo dal
  // 2 maggio 2005, h24, 365 giorni l'anno, su tutto il territorio isolano,
  // da fisso e da mobile, chiamata gratuita.
  // Ci sta perché è metà agosto in Sardegna: è il numero degli incendi.
  {
    numero: '1515',
    cosa: 'Incendi e emergenze ambientali',
    dettaglio: 'Corpo forestale della Regione. Se vedi del fumo, si chiama questo',
    quando: 'Sempre, gratis',
  },
]

// -------------------------------------------------------- numeri utili
//
// Non sono emergenze: sono le cose che servono alle tre di notte quando
// nessuno sta morendo ma qualcuno sta male, o serve una farmacia, o va
// richiamato qualcuno. Ognuno dice **quando** è aperto, perché un numero
// che non risponde alle 3 è peggio di un numero che dice "chiuso".
export const UTILI = [
  // Fonte: asl8cagliari.it, scheda "Guardia Medica Distretto 3 — Quartu
  // S. Elena e Flumini di Quartu" della ASL 8 di Cagliari.
  // ⚠️ Il civico non torna fra le fonti: la ASL scrive 19, gli elenchi
  // telefonici 21. La via è quella, e la guardia medica ha l'insegna.
  {
    numero: '070 826494',
    cosa: 'Guardia medica di Quartu',
    dettaglio: 'Via Bizet, Quartu Sant’Elena. Copre Quartu e Flumini, ed è gratuita',
    quando: 'Notti feriali 20–8; dalle 10 del sabato alle 8 del lunedì',
  },
  // Fonte: farmaciaperra.it, pagina "Dove siamo" della farmacia stessa.
  // È la farmacia di Flumini, cioè la più vicina al villaggio.
  // ⚠️ La farmacia **di turno** cambia ogni settimana: non è un numero
  // fisso e non si può scrivere qui. Il turno è esposto sulla porta di
  // ogni farmacia — compresa questa, che è a due minuti.
  {
    numero: '070 891155',
    cosa: 'Farmacia (Flumini di Quartu)',
    dettaglio: 'Via Leonardo da Vinci. Il turno notturno è affisso sulla porta',
    quando: 'Lunedì–sabato 8–20',
  },
  // Fonte: sardegnasalute.it, scheda della Regione Sardegna sulla "Casa di
  // cura polispecialistica Sant'Elena".
  // ⚠️ È una struttura **privata** e non ho trovato conferma che il suo
  // pronto soccorso sia aperto 24 ore: per un'urgenza vera si fa il 112 e
  // decidono loro dove mandarti. Questo serve a sapere dov'è la cosa più
  // vicina, non a scegliere al posto di chi risponde al 112.
  {
    numero: '070 86051',
    cosa: 'Casa di cura Sant’Elena (privata)',
    dettaglio: 'Viale Marconi 160, Quartu. Per un’urgenza vera fai prima il 112',
    quando: 'Centralino',
  },
  // Fonte: guardiacostiera.gov.it, pagina della Capitaneria di porto di
  // Cagliari. Il centralino è per le pratiche, non per le emergenze: se
  // qualcuno è in mare si fa 1530.
  {
    numero: '070 60517303',
    cosa: 'Capitaneria di porto, Cagliari',
    dettaglio: 'Via dei Calafati 19. Per informazioni, non per emergenze (quelle: 1530)',
    quando: 'Orario d’ufficio',
  },
  // Fonte: Leonardo, 9 agosto. Sono i due contatti del viaggio.
  {
    numero: '327 739 9331',
    cosa: 'Escursioni in barca a vela',
    dettaglio: 'Il contatto della gita',
  },
  {
    numero: '389 685 1106',
    cosa: 'Ichnusa Rent a Van',
    dettaglio: 'Il noleggio del van',
  },
]

// Quello che manca, scritto come manca. Serve a due cose: non far
// credere che la sezione sia completa, e ricordare cosa chiedere.
export const DA_TROVARE = [
  'Il numero di chi ci affitta la casa — non esiste un centralino del villaggio',
  'Orario e molo della barca del 14',
]

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

export const DOVE = {
  nome: "Villaggio S'oru 'e Mari",
  comune: 'Quartu Sant’Elena (CA)',
  quando: VIAGGIO.etichetta,
  checkIn: 'Check-in mercoledì 12 alle 17:00',
  // Da riempire: l'indirizzo esatto e il telefono della struttura.
  indirizzo: null,
  telefono: null,
}

// Il 112 e' l'unico numero unico d'emergenza in Italia: vale ovunque, da
// qualunque telefono, anche senza credito e senza scheda. Gli altri
// cambiano per comune, quindi qui non ce ne sono finche' non li verifica
// qualcuno sul posto.
export const EMERGENZE = [
  {
    numero: '112',
    cosa: 'Emergenze',
    dettaglio: 'Unico per carabinieri, polizia, ambulanza e vigili del fuoco',
  },
]

// Quello che manca, scritto come manca. Serve a due cose: non far
// credere che la sezione sia completa, e ricordare cosa chiedere.
export const DA_TROVARE = [
  'Indirizzo esatto e telefono del villaggio',
  'Guardia medica di Quartu Sant’Elena',
  'Farmacia più vicina, e quella di turno',
  'Numero del noleggio van, se serve richiamarli',
]

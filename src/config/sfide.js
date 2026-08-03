import { giornoCorrente } from '../lib/giorni.js'

// Caccia al tesoro fotografica.
//
// Tre scelte che vengono da come deve sentirsi, non dal codice:
//
// 1. Ogni sfida è legata a un giorno vero dell'itinerario, e si vede solo
//    quel giorno. Non c'è mai un elenco di tutto: si scoprono strada
//    facendo, come le Leggi. Quelle dei giorni passati restano visibili
//    solo se le hai vinte.
// 2. Le sfide parlano di posti che vedrete davvero — i fenicotteri di
//    Molentargius, le torri spagnole fra Punta Molentis e Porto Giunco,
//    il faro di Capo Carbonara. Sono nell'itinerario, non inventate.
// 3. La prima è collettiva e non competitiva: serve che la faccia tutto
//    il gruppo, non che uno la faccia meglio.
//
// tipo:
//   'collettiva'  la vincono tutti insieme quando ognuno ha caricato
//   'competitiva' una foto sola nella giornata vince; se sono due o più
//                 si apre un voto anonimo a fine giornata

export const SFIDE = [
  // ——— 12 agosto: arrivo, Poetto, Molentargius ———
  {
    id: 'ci-siamo-tutti',
    tipo: 'collettiva',
    giorno: 12,
    titolo: 'Ci siamo tutti',
    testo: 'Un selfie a testa. Si chiude quando l’ha caricato ognuno.',
    punti: 10,
  },
  {
    id: 'fenicottero',
    tipo: 'competitiva',
    giorno: 12,
    titolo: 'Il fenicottero',
    testo: 'Uno vero, verso lo Stagno di Molentargius. Vale anche di lontano.',
    punti: 20,
  },
  {
    id: 'carrello',
    tipo: 'competitiva',
    giorno: 12,
    titolo: 'La spesa più discutibile',
    testo: 'Una cosa nel carrello che nessuno ricorda di aver messo.',
    punti: 10,
  },

  // ——— 13 agosto: Costa Rei, Cala Sinzias ———
  {
    id: 'macchia',
    tipo: 'competitiva',
    giorno: 13,
    titolo: 'Ginepro, lentisco o mirto',
    testo: 'La macchia che tiene insieme le dune. Una pianta, da vicino.',
    punti: 15,
  },
  {
    id: 'acqua-trasparente',
    tipo: 'competitiva',
    giorno: 13,
    titolo: 'Si vede il fondo',
    testo: 'Acqua così limpida che si contano i sassi.',
    punti: 10,
  },
  {
    id: 'mirto',
    tipo: 'competitiva',
    giorno: 13,
    titolo: 'Il primo mirto',
    testo: 'Il bicchierino, dopo cena. Prova documentale.',
    punti: 10,
  },

  // ——— 14 agosto: barca, Capo Carbonara ———
  {
    id: 'torre-spagnola',
    tipo: 'competitiva',
    giorno: 14,
    titolo: 'La torre',
    testo: 'Una torre di avvistamento del ’500, fra Punta Molentis e Porto Giunco.',
    punti: 20,
  },
  {
    id: 'tuffo',
    tipo: 'competitiva',
    giorno: 14,
    titolo: 'Il tuffo peggiore',
    testo: 'Dalla barca. Vince il più brutto, non il più bello.',
    punti: 15,
  },
  {
    id: 'isola-cavoli',
    tipo: 'competitiva',
    giorno: 14,
    titolo: 'L’Isola dei Cavoli',
    testo: 'Il nome viene dal cavolo selvatico sulle rocce. Trovatelo, o accontentatevi dell’isola.',
    punti: 20,
  },

  // ——— 15 agosto: Villasimius ———
  {
    id: 'faro',
    tipo: 'competitiva',
    giorno: 15,
    titolo: 'Il faro di Capo Carbonara',
    testo: 'Il sentiero parte da Porto Giunco. Trenta minuti e una vista.',
    punti: 20,
  },
  {
    id: 'culurgiones',
    tipo: 'competitiva',
    giorno: 15,
    titolo: 'La treccia',
    testo: 'Un culurgione, con la sua chiusura fatta a mano. Prima di mangiarlo.',
    punti: 15,
  },
  {
    id: 'ferragosto',
    tipo: 'competitiva',
    giorno: 15,
    titolo: 'Quanta gente',
    testo: 'È Ferragosto di sabato. Documentate la folla.',
    punti: 10,
  },

  // ——— 16 agosto: ultimo giorno ———
  {
    id: 'seada',
    tipo: 'competitiva',
    giorno: 16,
    titolo: 'La seada',
    testo: 'Formaggio fritto e miele, l’ultima occasione.',
    punti: 15,
  },
  {
    id: 'ultimo-bagno',
    tipo: 'competitiva',
    giorno: 16,
    titolo: 'L’ultimo bagno',
    testo: 'Chi entra in acqua per ultimo prima di ripartire.',
    punti: 10,
  },
]

export const SFIDE_PER_ID = Object.fromEntries(SFIDE.map((s) => [s.id, s]))

// Le sfide di un giorno preciso dell'itinerario.
export function sfideDelGiorno(giorno) {
  return SFIDE.filter((s) => s.giorno === giorno)
}

// Quali sfide mostrare adesso.
//
// Solo quelle del giorno in corso, più quelle già vinte, che restano come
// trofeo. Niente elenco completo: si scoprono aprendo l'app nel posto
// giusto, non leggendo una lista di cose da fare.
//
// Pura di proposito, e in questo file e non in lib/sfide.js: quella
// importa Supabase, e qui non serve un database per sapere che giorno è.
export function sfideDaMostrare(vinte, adesso = new Date()) {
  const oggi = giornoCorrente(adesso)
  const diOggi = oggi ? sfideDelGiorno(oggi.giorno) : []
  const conquistate = SFIDE.filter((s) => vinte[s.id] && !diOggi.includes(s))
  return { diOggi, conquistate }
}

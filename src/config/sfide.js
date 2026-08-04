import { dataDiOggi, giornoCorrente } from '../lib/giorni.js'
import { VIAGGIO } from './viaggio.js'

// Caccia al tesoro fotografica.
//
// Tre scelte che vengono da come deve sentirsi, non dal codice:
//
// 1. Ogni sfida è legata a un giorno vero dell'itinerario e compare quel
//    giorno. Non c'è mai un elenco di tutto: si scoprono strada facendo,
//    come le Leggi. Ma una volta comparse NON scadono più: in viaggio il
//    telefono si guarda tre volte al giorno, e una sfida che muore a
//    mezzanotte muore quasi sempre senza che nessuno l'abbia vista.
// 2. Le sfide parlano di posti che vedrete davvero — i fenicotteri di
//    Molentargius, le torri spagnole fra Punta Molentis e Porto Giunco,
//    il faro di Capo Carbonara. Sono nell'itinerario, non inventate.
// 3. La prima è collettiva e non competitiva: serve che la faccia tutto
//    il gruppo, non che uno la faccia meglio.
//
// tipo:
//   'collettiva'  la vincono tutti insieme quando ognuno ha caricato
//   'competitiva' durante il viaggio si raccolgono foto e basta: niente
//                 vincitori, niente punti. Si decide tutto dopo, con le
//                 date qui sotto

// La caccia al tesoro si chiude DOPO il viaggio, e questo risolve un
// problema di equilibrio che i numeri rendevano evidente: tredici sfide
// competitive da 10-20 punti mettevano in palio 190 punti, mentre tutte
// le dodici Leggi attive messe insieme ne valgono 31 in valore assoluto.
// Una sfida vinta contava quanto due o quattro Leggi, e la classifica
// diventava la classifica della caccia al tesoro.
//
// Adesso ne entra uno solo: il premio a chi ne ha vinte di più. Le
// singole vittorie contano per arrivarci, ma non pagano da sole.
export const CACCIA = {
  // Il giorno dopo il rientro si aprono le votazioni su tutto quello che
  // ha almeno due foto in gara.
  apreIlVoto: '2026-08-17',
  // Tre giorni per votare, e per caricare l'ultima foto di chi ci ha
  // messo di più a scaricare il telefono.
  chiude: '2026-08-20',
  // A chi ne ha vinte di più. In pareggio nessuno, come per il resto.
  premioPrimo: 10,
  // A chi è rimasto l'unico ad aver mandato una foto per una sfida:
  // vince quella sfida, e scopre una Legge.
  puntiUnico: 2,
}

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
// Le sfide comparse restano: quelle di oggi in cima, sotto quelle dei
// giorni scorsi che nessuno ha ancora vinto, e in fondo le vinte come
// trofeo. Fuori dal viaggio si vede tutto quello che era gia' comparso.
export function sfideDaMostrare(vinte, adesso = new Date()) {
  const oggi = giornoCorrente(adesso)
  const diOggi = oggi ? sfideDelGiorno(oggi.giorno) : []

  // Una sfida e' "comparsa" se il suo giorno e' arrivato. Prima del
  // viaggio non ce n'e' nessuna; dopo, ci sono tutte.
  const comparse = SFIDE.filter((s) => sfidaComparsa(s, adesso))

  const aperte = comparse.filter((s) => !vinte[s.id] && !diOggi.includes(s))
  const conquistate = comparse.filter((s) => vinte[s.id] && !diOggi.includes(s))

  return { diOggi, aperte, conquistate }
}

export function sfidaComparsa(sfida, adesso = new Date()) {
  const data = dataDiOggi(adesso)
  if (data < VIAGGIO.dataInizio) return false
  if (data > VIAGGIO.dataFine) return true

  const giornoDiOggi = Number(data.slice(8, 10))
  return sfida.giorno <= giornoDiOggi
}

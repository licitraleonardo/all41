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
  //
  // ⚠️ È l'ULTIMO GIORNO IN CUI SI VOTA, non il primo in cui non si vota
  // più: il 20 si vota fino a sera. Decisione di Leonardo del 9 agosto —
  // prima `cacciaChiusa` usava `>=` e il 20 era già chiuso a mezzanotte,
  // coi bottoni accesi tutto il giorno su una finestra che non c'era più.
  chiude: '2026-08-20',
  // A chi ne ha vinte di più. In pareggio nessuno, come per il resto.
  premioPrimo: 10,
  // A chi è rimasto l'unico ad aver mandato una foto per una sfida:
  // vince quella sfida, e scopre una Legge.
  puntiUnico: 2,
}

// Fino a quando si può votare una gara. È la fine della finestra della
// caccia, non ventiquattr'ore da quando la gara si apre.
//
// Prima era `adesso + 24h`, un residuo di quando le gare erano
// giornaliere: una gara aperta il 17 moriva il 18, mentre la
// configurazione qui sopra promette di poter votare fino al 20. Chi
// apriva l'app il 19 convinto di avere tempo trovava i bottoni spariti,
// e nessuno gli diceva perché.
//
// Funzione pura, provata da riga di comando: da qui dipende chi vince.
export function scadenzaDelVoto(oggi, chiude = CACCIA.chiude) {
  // Fine della giornata di chiusura, non il suo inizio: il 20 si vota
  // tutto il giorno.
  const fine = new Date(`${chiude}T23:59:59`)

  // Se la finestra è già passata — una gara che si apre in ritardo per
  // una foto arrivata all'ultimo — non nasce morta: si dà comunque un
  // giorno, altrimenti `chiudiScaduti` la chiuderebbe prima che qualcuno
  // possa votarla.
  const adesso = oggi instanceof Date ? oggi : new Date(oggi)
  if (fine.getTime() <= adesso.getTime()) {
    return new Date(adesso.getTime() + 24 * 3600 * 1000).toISOString()
  }
  return fine.toISOString()
}

export const SFIDE = [
  // ——— 12 agosto: arrivo, Poetto, Molentargius ———
  // ⚠️ Anticipata all'11: è l'unica sfida che compare prima che il
  // viaggio cominci.
  //
  // Il gruppo è entrato nell'app la sera prima di partire e non aveva
  // niente da fare insieme. Questa è il rompighiaccio, e si può fare da
  // casa: è un selfie a testa, non richiede di essere in Sardegna.
  //
  // ⚠️ Ma anticipare la comparsa **non** anticipa la chiusura, ed è la
  // differenza che tiene in piedi tutto il resto: la sfida si vede e si
  // può fare stasera, e si chiude il 12. Vedi `sfidaChiudibile` in
  // `lib/sfide.js`.
  //
  // La prima versione la faceva valere zero punti, e sembrava la cosa
  // ovvia — «anticipata senza punti». Costava tre cose che non si
  // vedevano da qui: il 12, giorno vero dell'arrivo, si sarebbe trovata
  // già chiusa e una delle tre sfide del giorno sparita; la Legge XXIX
  // prende il suo valore da questa riga (`config/leggi.js`) e a zero
  // sarebbe scivolata dai Trofei alle Punizioni del Testamento; e la
  // Legge non sarebbe mai stata **scoperta**, perché una Legge si scopre
  // scattando e questa sarebbe scattata a viaggio non ancora cominciato,
  // cioè congelata. Rimandare la chiusura non costa niente di tutto ciò.
  {
    id: 'ci-siamo-tutti',
    tipo: 'collettiva',
    anticipata: true,
    giorno: 12,
    titolo: 'Ci siamo tutti',
    testo: 'Un selfie a testa. Si chiude quando ci siamo tutti.',
    // Tre e non dieci: paga a testa e non a un vincitore solo, quindi in
    // otto vale ventiquattro punti. A dieci ne valeva ottanta, cioè più
    // di tutte le Leggi messe insieme — per un selfie.
    punti: 3,
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

  // ⚠️ Prima che il viaggio cominci «oggi» non è nessun giorno del
  // viaggio, e senza questa riga l'unica sfida visibile finiva sotto
  // «Ancora aperte» — che vuol dire *l'avevi già vista e non l'hai
  // ancora fatta*, e la sera prima di partire non l'aveva vista nessuno.
  //
  // Dopo il 16 no: fuori dal viaggio, dalla parte finita, non c'è
  // nessun «oggi» e le sfide comparse tornano dove stanno le altre.
  const primaDiPartire = dataDiOggi(adesso) < VIAGGIO.dataInizio
  const diOggi = oggi
    ? sfideDelGiorno(oggi.giorno)
    : primaDiPartire
      ? SFIDE.filter((s) => s.anticipata)
      : []

  // Una sfida e' "comparsa" se il suo giorno e' arrivato. Prima del
  // viaggio non ce n'e' nessuna; dopo, ci sono tutte.
  const comparse = SFIDE.filter((s) => sfidaComparsa(s, adesso))

  const aperte = comparse.filter((s) => !vinte[s.id] && !diOggi.includes(s))
  const conquistate = comparse.filter((s) => vinte[s.id] && !diOggi.includes(s))

  return { diOggi, aperte, conquistate }
}

export function sfidaComparsa(sfida, adesso = new Date()) {
  const data = dataDiOggi(adesso)

  // ⚠️ Le anticipate ci sono anche prima che il viaggio cominci, e sono
  // l'unica eccezione: tutto il resto della caccia compare il suo
  // giorno.
  //
  // Comparire, però, non è chiudersi. Una sfida anticipata si vede e si
  // può fare la sera prima, ma **non si chiude** finché il viaggio non
  // comincia — e la ragione sta in `forseChiudiCollettiva`
  // (`lib/sfide.js`), che è dove va guardata.
  if (sfida.anticipata) return true

  if (data < VIAGGIO.dataInizio) return false
  if (data > VIAGGIO.dataFine) return true

  const giornoDiOggi = Number(data.slice(8, 10))
  return sfida.giorno <= giornoDiOggi
}

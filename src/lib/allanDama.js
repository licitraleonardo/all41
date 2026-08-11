import { ALLAN } from '../config/dama.js'
import { BIANCO, NERO, applicaMossa, esito, mosseLegali } from './dama.js'

// Allan che gioca a dama. Niente Supabase, come il motore delle regole:
// una scacchiera entra, una mossa esce. Per questo la partita contro di
// lui **funziona senza rete** senza che nessuno abbia dovuto scrivere
// niente per l'offline — non c'è nessuna rete da cui dipendere.
//
// ⚠️ E per la stessa ragione non tocca `dama_games`: chi gioca contro
// Allan non entra in classifica. Se ci entrasse, la coppa della Dama la
// vincerebbe chi ha più tempo libero e una macchina da battere, e
// smetterebbe di voler dire qualcosa. La guardia sta in `Dama.jsx`,
// perché è lì che si assegnano i punti.

// Quanto vale un pezzo. La dama vale meno di due pedine di proposito:
// con le regole di casa nostra (niente dame volanti, e la pedina può
// mangiare la dama) una dama è comoda, non è una vittoria.
const PEDINA = 100
const DAMA_PEZZO = 175

// Vittoria e sconfitta stanno fuori dalla scala dei pezzi, così nessuna
// somma di vantaggio materiale può pareggiare un finale.
const VINTA = 100000

function avversario(colore) {
  return colore === BIANCO ? NERO : BIANCO
}

// Quanto è avanzata una pedina verso la promozione, da 0 a 7. Il bianco
// sale (riga che cala), il nero scende.
function avanzamento(indice, colore) {
  const riga = Math.floor(indice / 8)
  return colore === BIANCO ? 7 - riga : riga
}

// ⚠️ La valutazione è volutamente corta.
//
// Un'euristica ricca renderebbe Allan più forte, e più forte qui non
// vuol dire migliore: deve essere un avversario che si può battere. Tre
// cose sole, e sono quelle che chiunque abbia giocato da bambino
// riconosce come "gioca bene": conta i pezzi, spinge verso la
// promozione, e sta ai bordi dove non lo mangiano.
export function valuta(stato, colore) {
  let punteggio = 0

  for (let i = 0; i < 64; i += 1) {
    const pezzo = stato.caselle[i]
    if (!pezzo) continue

    const suo = pezzo.colore === colore ? 1 : -1
    punteggio += suo * (pezzo.dama ? DAMA_PEZZO : PEDINA)

    if (!pezzo.dama) {
      punteggio += suo * avanzamento(i, pezzo.colore) * 6
    }

    // I bordi sono l'unico posto della scacchiera dove non si può essere
    // mangiati: una pedina di lato vale un po' di più di una in mezzo.
    const colonna = i % 8
    if (colonna === 0 || colonna === 7) punteggio += suo * 8
  }

  return punteggio
}

// Minimax con potatura alfa-beta. `colore` è sempre quello di Allan:
// il punteggio è visto da lui, in tutti i rami.
function cerca(stato, profondita, alfa, beta, colore, scade) {
  const fine = esito(stato)
  if (fine.finita) {
    if (!fine.vincitore) return 0
    // ⚠️ La profondità entra nel punteggio: fra due vittorie Allan
    // sceglie quella più vicina, e fra due sconfitte quella più lontana.
    // Senza, sapendo di aver perso giocherebbe a caso — e uno che si
    // arrende a metà partita non è un avversario.
    return fine.vincitore === colore ? VINTA + profondita : -VINTA - profondita
  }
  if (profondita === 0) return valuta(stato, colore)

  // Scaduto il tempo si smette di scendere e si valuta quello che c'è.
  // Il risultato è meno buono, non sbagliato.
  if (scade && Date.now() > scade) return valuta(stato, colore)

  const massimizza = stato.turno === colore
  const mosse = mosseLegali(stato)
  let migliore = massimizza ? -Infinity : Infinity

  for (const m of mosse) {
    const punteggio = cerca(applicaMossa(stato, m), profondita - 1, alfa, beta, colore, scade)
    if (massimizza) {
      if (punteggio > migliore) migliore = punteggio
      if (migliore > alfa) alfa = migliore
    } else {
      if (punteggio < migliore) migliore = punteggio
      if (migliore < beta) beta = migliore
    }
    if (beta <= alfa) break
  }

  return migliore
}

// Le mosse di Allan ordinate dalla migliore alla peggiore, a una data
// profondità. Esportata perché è quello che le prove guardano: «ha
// scelto bene» si verifica solo potendo vedere anche le altre.
export function mosseValutate(stato, profondita, scade) {
  const colore = stato.turno
  return mosseLegali(stato)
    .map((mossa) => ({
      mossa,
      punteggio: cerca(applicaMossa(stato, mossa), profondita - 1, -Infinity, Infinity, colore, scade),
    }))
    .sort((a, b) => b.punteggio - a.punteggio)
}

// La mossa che gioca Allan.
//
// ⚠️ Approfondimento progressivo, non profondità fissa.
//
// Una profondità fissa è una scommessa su quanto sia complicata la
// posizione, e le posizioni non sono tutte uguali: a inizio partita ci
// sono sette mosse, in mezzo a una catena di prese anche trenta. Con un
// numero fisso o Allan è lento quando la scacchiera è piena, o è stupido
// quando è vuota. Così invece cerca a profondità 1, poi 2, poi 3, e si
// ferma quando il tempo è finito: **il risultato migliore che sta dentro
// il tempo che ha**, qualunque sia la posizione.
//
// Il tempo conta più della forza: la ricerca gira sul telefono di chi sta
// giocando, e un avversario che ci mette due secondi a ogni mossa rende
// la partita noiosa molto prima di renderla difficile.
export function scegliMossa(stato, { casuale = Math.random, adesso = Date.now } = {}) {
  const mosse = mosseLegali(stato)
  if (mosse.length === 0) return null
  if (mosse.length === 1) return mosse[0]

  const scade = adesso() + ALLAN.millisecondiMax
  let ordinate = mosse.map((mossa) => ({ mossa, punteggio: 0 }))

  for (let p = 1; p <= ALLAN.profonditaMax; p += 1) {
    if (Date.now() > scade) break
    ordinate = mosseValutate(stato, p, scade)
  }

  // ⚠️ E ogni tanto sbaglia apposta.
  //
  // Un motore che gioca sempre la mossa migliore, a questa profondità,
  // vince quasi sempre — e un avversario che non si batte mai si smette
  // di sfidare dopo due partite. «Medio» non è una via di mezzo fra
  // forte e debole: è forte abbastanza da far ragionare, debole
  // abbastanza da far vincere.
  //
  // Non sbaglia mai quando c'è una vittoria o una sconfitta in vista: lì
  // giocare male non è caratteriale, è rotto.
  const finaleInVista = Math.abs(ordinate[0].punteggio) >= VINTA
  if (!finaleInVista && ordinate.length > 1 && casuale() < ALLAN.sbaglia) {
    return ordinate[1].mossa
  }

  return ordinate[0].mossa
}

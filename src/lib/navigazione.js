// Dove sei nell'app, e come ci sei arrivato.
//
// Serve al tasto indietro del telefono: da un tab, senza fogli aperti,
// prima usciva dall'app. Deve invece rifare la strada — Oggi → Gioco →
// Dama, e indietro ti riporta a Gioco, poi a Oggi, e solo allora fuori.
//
// ⚠️ **Ogni voce di cronologia porta la fotografia INTERA di dove sei**,
// non solo la cosa che è cambiata.
//
// È l'unico modo che regge una ricaricata. Dopo un refresh la memoria di
// come ci sei arrivato è persa, e una voce che dicesse solo «qui è
// cambiato il tab» non basterebbe più a ricostruire dove tornare. Una
// fotografia intera si riapplica sempre, anche a freddo.

const CHIAVE_TAB = 'tab'

// Le sotto-schede che esistono, con il loro valore buono e quelli
// ammessi. Le registra chi le usa, alla prima chiamata: così la
// fotografia sa cosa contiene senza che questo file conosca le schermate.
const conosciute = new Map()

let stato = { schede: {} }
const ascoltatori = new Set()

// ⚠️ Quanti riordini di cronologia abbiamo chiesto noi e non sono ancora
// tornati indietro.
//
// `history.back()` non fa niente sul momento: mette in coda un evento che
// arriva dopo. Chi lo raccoglie deve sapere se è il dito di qualcuno sul
// tasto indietro o una nostra pulizia.
//
// Ci ho già provato una volta tenendo questo conto **dentro il foglio**,
// e non regge: quando un foglio si chiude col bottone il riordino parte
// dalla sua pulizia, cioè quando quel foglio non c'è più, e nessuno
// raccoglieva l'evento. Il conto restava alto e finiva per ingoiare la
// prima pressione vera.
//
// Qui invece l'ascoltatore è uno solo e c'è sempre: il conto non può
// restare appeso a un componente che se n'è andato.
let riordiniInCorso = 0

function leggiSalvato(chiave) {
  try {
    return sessionStorage.getItem(chiave)
  } catch {
    return null
  }
}

function salva(chiave, valore) {
  try {
    sessionStorage.setItem(chiave, valore)
  } catch {
    // Safari in navigazione privata può rifiutare: pazienza, si riparte
    // dalla scheda predefinita alla prossima apertura.
  }
}

// Il valore buono per una scheda: quello salvato se è ancora fra quelli
// ammessi, altrimenti il predefinito.
//
// La validazione serve ai deploy: se una sotto-scheda cambia nome fra una
// versione e l'altra, il valore vecchio ricade sul predefinito invece di
// lasciare una schermata vuota.
function valida(chiave, valore) {
  const c = conosciute.get(chiave)
  if (!c) return valore
  return c.valide.includes(valore) ? valore : c.predefinita
}

export function registraScheda(chiave, predefinita, valide) {
  const gia = conosciute.get(chiave)
  if (gia && gia.predefinita === predefinita) return
  conosciute.set(chiave, { predefinita, valide })
  if (stato.schede[chiave] === undefined) {
    stato = {
      ...stato,
      schede: { ...stato.schede, [chiave]: valida(chiave, leggiSalvato(chiave)) },
    }
    // ⚠️ La voce su cui siamo va riscritta, adesso che sappiamo una cosa
    // in piu' su dove siamo.
    //
    // Questo file parte all'import, cioe' PRIMA che le schermate esistano
    // e dicano quali sotto-schede hanno. Senza questa riga la prima voce
    // di cronologia resta la fotografia vuota scattata in quel momento, e
    // il tasto indietro, arrivandoci, non ripristina niente: si torna
    // indietro e non si muove nulla. Provato, e succedeva.
    aggiornaVoceCorrente()
  }
}

// La voce su cui siamo adesso descrive dove siamo adesso. Non aggiunge un
// passo: annota quello su cui si e' gia'.
function aggiornaVoceCorrente() {
  try {
    if (window.history.state?.all41Foglio) return
    window.history.replaceState(fotografia(), '')
  } catch {
    // Pazienza: si resta senza tasto indietro.
  }
}

export function leggiStato() {
  return stato
}

export function iscrivi(ascoltatore) {
  ascoltatori.add(ascoltatore)
  return () => ascoltatori.delete(ascoltatore)
}

function avvisa() {
  for (const a of ascoltatori) a()
}

function applica(schede, { salvando = true } = {}) {
  const pulite = {}
  for (const [k, v] of Object.entries(schede)) {
    pulite[k] = valida(k, v)
    if (salvando) salva(k, pulite[k])
  }
  stato = { schede: { ...stato.schede, ...pulite } }
  avvisa()
}

// La fotografia di adesso, quella che finisce nella voce di cronologia.
function fotografia() {
  return { all41: { schede: { ...stato.schede } } }
}

// Cambiare schermata: si aggiorna e si lascia una voce nella cronologia,
// così il tasto indietro ha qualcosa da togliere che non è l'app.
export function vaiA(chiave, valore) {
  const pulito = valida(chiave, valore)
  if (stato.schede[chiave] === pulito) return

  applica({ [chiave]: pulito })
  try {
    window.history.pushState(fotografia(), '')
  } catch {
    // Cronologia piena o contesto strano: la navigazione funziona lo
    // stesso, solo senza tasto indietro.
  }
}

// ⚠️ Quanti fogli sono aperti sopra la navigazione.
//
// Si contano, e non si guarda `history.state`: premendo indietro DA un
// foglio l'evento porta la voce **sotto** di lui — cioè la navigazione —
// non quella del foglio. Guardando lo stato dell'evento il foglio non si
// riconoscerebbe mai, e il tasto indietro cambierebbe tab lasciando il
// foglio aperto sopra.
let livelliAperti = 0

// Aprire un foglio lascia una voce sua: il tasto indietro la toglie per
// prima, prima di toccare la navigazione.
export function apriLivello() {
  livelliAperti += 1
  try {
    window.history.pushState({ all41Foglio: true }, '')
  } catch {
    livelliAperti -= 1
  }
}

// Chiuso col bottone o col tocco fuori: si rimette a posto la cronologia,
// così la pressione seguente non va a vuoto.
export function chiudiLivello() {
  if (livelliAperti === 0) return
  livelliAperti -= 1
  riordiniInCorso += 1
  try {
    window.history.back()
  } catch {
    riordiniInCorso -= 1
  }
}

// Chi vuole sapere che è stato premuto indietro mentre lui era aperto.
const suiFogli = new Set()

export function quandoTornaIndietroDaUnFoglio(fn) {
  suiFogli.add(fn)
  return () => suiFogli.delete(fn)
}

// Serve alle prove: da fuori non si vede niente di questo.
export function statoInterno() {
  return { livelliAperti, riordiniInCorso }
}

// ------------------------------------------------- l'unico ascoltatore

function avvio() {
  if (typeof window === 'undefined' || window.__all41Navigazione) return
  window.__all41Navigazione = true

  // La prima voce descrive dove siamo adesso, così tornarci è possibile.
  // `replaceState` e non `pushState`: non si aggiunge un passo, si
  // annota quello su cui si è già.
  try {
    const gia = window.history.state?.all41
    if (gia?.schede) applica(gia.schede, { salvando: false })
    window.history.replaceState(fotografia(), '')
  } catch {
    // Pazienza: si parte senza cronologia.
  }

  window.addEventListener('popstate', (evento) => {
    // È un nostro riordino che torna a galla, non un dito sul tasto.
    if (riordiniInCorso > 0) {
      riordiniInCorso -= 1
      return
    }

    // ⚠️ C'è un foglio aperto sopra: il tasto indietro chiude quello, e
    // la navigazione non si muove. Prima si chiude quello che sta sopra,
    // poi si torna indietro fra le schermate — è l'ordine in cui uno se
    // lo aspetta, ed è l'ordine in cui le voci sono impilate.
    if (livelliAperti > 0) {
      livelliAperti -= 1
      for (const f of suiFogli) f()
      return
    }

    const foto = evento.state?.all41
    if (!foto?.schede) return
    applica(foto.schede)
  })
}

avvio()

export { CHIAVE_TAB }

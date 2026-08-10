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

// ⚠️ Anche il profilo e la modifica del profilo passano di qui.
//
// Sono schermate a tutta pagina, non sotto-schede, e stavano fuori dalla
// cronologia: toccando la foto del profilo il tasto indietro non tornava
// nel viaggio, usciva dall'app.
//
// Ci stanno **solo queste due**. Le altre viste — `avvio`, `guasto`,
// `onboarding`, `nonConfigurato` — non sono posti dove si va, sono stati
// in cui l'app si trova: tornare indietro dentro un guasto o dentro
// l'ingresso è peggio che non tornare.
const CHIAVE_VISTA = 'vista'
export const VISTE_CON_CRONOLOGIA = ['dentro', 'profilo', 'modifica']

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

// ⚠️ `ricorda: false` per le schermate che NON devono sopravvivere a una
// ricaricata.
//
// Le sotto-schede sì: chi tira giù per aggiornare la classifica vuole la
// classifica. Ma il profilo no — ricaricando si deve tornare nel viaggio,
// non ritrovarsi sulla propria foto. La cronologia serve lo stesso, che è
// tutto il punto di questa aggiunta.
export function registraScheda(chiave, predefinita, valide, { ricorda = true } = {}) {
  const gia = conosciute.get(chiave)
  if (gia && gia.predefinita === predefinita) return
  conosciute.set(chiave, { predefinita, valide, ricorda })
  if (stato.schede[chiave] === undefined) {
    stato = {
      ...stato,
      schede: {
        ...stato.schede,
        [chiave]: valida(chiave, ricorda ? leggiSalvato(chiave) : predefinita),
      },
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
    if (salvando && conosciute.get(k)?.ricorda !== false) salva(k, pulite[k])
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

// Toccare un tab in basso ci porta alla sua PRIMA scheda, sempre.
//
// Vai in Foto → Sfide, poi in Gruppo, poi torni in Foto: devi trovare
// l'Album. Chi tocca un tab sta ricominciando da lì, e ritrovarsi nella
// sotto-scheda di venti minuti fa è una sorpresa — mentre il tasto
// indietro, che invece **deve** riportarti esattamente dove eri, continua
// a farlo perché applica la fotografia intera e non passa di qui.
//
// «Ci vado adesso» e «ci sono già stato» sono due cose diverse, e restano
// due strade diverse.
//
// ⚠️ Nessuna mappa tab → sotto-schede da tenere aggiornata: si rimettono
// al predefinito **tutte** quelle registrate. Una mappa a mano si
// dimentica alla prima sezione nuova, e si dimentica in silenzio.
//
// `dentro` serve a chi arriva da un avviso e sa già dove vuole atterrare:
// prima quelle due chiamate scrivevano di nascosto in `sessionStorage`
// sperando che qualcuno lo rileggesse, e funzionava solo la prima volta
// che quella schermata veniva creata.
export function vaiAlTab(valore, dentro = {}) {
  const prossime = { [CHIAVE_TAB]: valida(CHIAVE_TAB, valore) }

  for (const [chiave, c] of conosciute) {
    // Il tab lo stiamo decidendo qui. La vista no: `profilo` e `modifica`
    // non sono sotto-schede di un tab, sono un altro asse -- e la barra
    // dei tab non esiste nemmeno, là dentro.
    if (chiave === CHIAVE_TAB || chiave === CHIAVE_VISTA) continue
    prossime[chiave] = c.predefinita
  }

  for (const [chiave, v] of Object.entries(dentro)) prossime[chiave] = v

  // Toccare il tab su cui sei già, con tutto al suo posto, non deve
  // costare una pressione in più per uscirne.
  if (Object.entries(prossime).every(([k, v]) => stato.schede[k] === v)) return

  applica(prossime)
  try {
    window.history.pushState(fotografia(), '')
  } catch {
    // Cronologia piena: la navigazione funziona, senza tasto indietro.
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

// ⚠️ Chiusure chieste e non ancora eseguite.
//
// Costato il 10 agosto, ed e' il difetto peggiore che questo file abbia
// avuto: appena entrato nell'app, aprivi la mappa, toccavi fuori — e
// uscivi dall'app.
//
// La causa e' `StrictMode`, che in sviluppo monta, smonta e rimonta ogni
// effetto **nello stesso istante**. Il foglio quindi faceva
// apri → chiudi → apri di fila, e siccome `history.back()` non fa niente
// sul momento ma mette in coda un evento, l'ordine reale diventava:
// impila, impila di nuovo, e solo dopo torna indietro. Un passo vero
// mangiato in silenzio: da li' in poi il foglio era aperto ma tu stavi
// gia' dietro alla sua voce, e la prossima uscita usciva dall'app.
//
// Appena entrati non c'e' cronologia di scorta, ed e' per questo che si
// vedeva li' e non altrove: piu' avanti quel passo rubato ti riportava
// solo a una schermata di prima, senza far male a nessuno.
//
// La correzione: la chiusura non torna indietro subito, aspetta la fine
// del giro. Se nel frattempo si apre un foglio — il rimontaggio di
// StrictMode, oppure un foglio che ne apre un altro — i due si annullano
// e la voce si riusa, senza toccare la cronologia.
let chiusureInAttesa = 0

// Aprire un foglio lascia una voce sua: il tasto indietro la toglie per
// prima, prima di toccare la navigazione.
export function apriLivello() {
  livelliAperti += 1

  // C'e' una chiusura in volo: la sua voce non e' ancora stata tolta, e
  // questo foglio se la prende invece di impilarne un'altra.
  if (chiusureInAttesa > 0) {
    chiusureInAttesa -= 1
    return
  }

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
  chiusureInAttesa += 1

  // ⚠️ Alla fine del giro, non adesso. E' tutta la correzione: dentro
  // questo giro puo' ancora arrivare un'apertura che la annulla.
  queueMicrotask(() => {
    if (chiusureInAttesa === 0) return
    chiusureInAttesa -= 1
    riordiniInCorso += 1
    try {
      window.history.back()
    } catch {
      riordiniInCorso -= 1
    }
  })
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

export { CHIAVE_TAB, CHIAVE_VISTA }

// Il tasto indietro: rifare la strada al contrario.
//
// ⚠️ Questa prova esiste perche' provarlo nel browser non basta, e oggi
// me l'ha insegnato tre volte: la cronologia di una scheda si sporca coi
// tentativi precedenti, alcuni «indietro» ricaricano la pagina invece di
// scatenare un evento, e un `import` con la data attaccata crea una
// seconda copia del modulo — cosi' si legge lo stato di una e si applica
// quello dell'altra. Tre misure sbagliate di fila, e il codice non
// c'entrava niente.
//
// Qui invece la cronologia e' finta e si comporta sempre allo stesso
// modo: si impila, si torna indietro, e l'evento arriva **dopo**, come
// nel browser vero. E' l'unico modo per provare davvero il pezzo
// delicato, cioe' che un riordino chiesto da noi non venga scambiato per
// un dito sul tasto.

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio !== undefined) console.log('       ', JSON.stringify(dettaglio))
  }
}

// ------------------------------------------------- la cronologia finta

const inCoda = []

class Cronologia {
  constructor() {
    this.voci = [{ state: null }]
    this.i = 0
  }
  get state() {
    return this.voci[this.i].state
  }
  get length() {
    return this.voci.length
  }
  pushState(s) {
    // Come il browser: quello che sta avanti si butta.
    this.voci = this.voci.slice(0, this.i + 1)
    this.voci.push({ state: s })
    this.i += 1
  }
  replaceState(s) {
    this.voci[this.i].state = s
  }
  // ⚠️ **Si sposta dopo, non adesso.** E qui «dopo» vale per lo
  // spostamento e non solo per l'evento.
  //
  // Fino al 10 agosto questa finta spostava `i` subito e rimandava solo
  // l'avviso. Sembra un dettaglio ed e' la differenza fra prendere un
  // difetto e non vederlo: il difetto che ha fatto uscire dall'app
  // toccando fuori dalla mappa stava tutto nel fatto che, fra il `back()`
  // e il momento in cui il browser lo esegue, **si puo' impilare un'altra
  // voce**. Con lo spostamento immediato quella finestra non esiste, e la
  // prova restava verde su un codice rotto. L'ho visto succedere: la
  // prima versione di questa prova passava anche col difetto dentro.
  back() {
    // ⚠️ **Il bersaglio si fissa adesso, il salto avviene dopo.**
    //
    // E' l'ultimo dettaglio, ed e' quello che fa scattare la trappola:
    // Chrome decide dove andare nell'istante in cui chiami `back()`, e le
    // voci impilate nel frattempo non lo spostano. Quindi
    // «impila, chiudi, impila» finisce **sotto** al punto di partenza, e
    // l'uscita seguente esce dall'app.
    //
    // Misurato nel browser vero il 10 agosto: il `popstate` atterrava
    // sulla fotografia e non sul foglio, che con lo spostamento calcolato
    // al momento dell'esecuzione sarebbe stato impossibile.
    const bersaglio = this.i - 1
    if (bersaglio < 0) return
    inCoda.push({ vaiA: bersaglio })
  }
}

const ascoltatori = []
const finestra = {
  history: new Cronologia(),
  addEventListener(nome, fn) {
    if (nome === 'popstate') ascoltatori.push(fn)
  },
  removeEventListener() {},
}

// Il giro finisce: prima si svuotano i microtask (dove adesso vive la
// chiusura differita di un foglio), poi si consegnano gli eventi.
async function fineGiro() {
  await new Promise((r) => setTimeout(r, 0))
  consegna()
}

// Consegna gli eventi messi in coda, come farebbe il browser al giro
// dopo.
function consegna() {
  while (inCoda.length) {
    const richiesta = inCoda.shift()
    // Adesso il browser esegue davvero il salto: prima sposta, poi avvisa.
    if (richiesta.vaiA !== undefined) finestra.history.i = richiesta.vaiA
    const e = { state: finestra.history.state }
    for (const a of [...ascoltatori]) a(e)
  }
}

const deposito = new Map()
globalThis.window = finestra
globalThis.sessionStorage = {
  getItem: (k) => (deposito.has(k) ? deposito.get(k) : null),
  setItem: (k, v) => deposito.set(k, v),
}

const nav = await import('../src/lib/navigazione.js')

nav.registraScheda('tab', 'oggi', ['oggi', 'gruppo', 'foto', 'gioco', 'info'])
nav.registraScheda('scheda.gruppo', 'chat', ['chat', 'vocali', 'cassetto'])
nav.registraScheda('scheda.gioco', 'allbo', [
  'allbo',
  'testamento',
  'impostore',
  'dama',
  'pecora',
])
nav.registraScheda('scheda.allbo', 'classifica', ['classifica', 'stat'])
nav.registraScheda('scheda.cassetto', 'spese', ['spese', 'documenti'])

const dove = () => {
  const s = nav.leggiStato().schede
  return `${s.tab}/${s['scheda.gruppo']}/${s['scheda.gioco']}`
}

console.log('\nsi rifa la strada al contrario')
{
  prova('si parte da Oggi', dove() === 'oggi/chat/allbo', dove())

  nav.vaiA('tab', 'gruppo')
  nav.vaiA('scheda.gruppo', 'vocali')
  nav.vaiA('tab', 'gioco')
  nav.vaiA('scheda.gioco', 'dama')
  prova('si arriva in Dama', dove() === 'gioco/vocali/dama', dove())

  const tappe = []
  for (let i = 0; i < 4; i++) {
    finestra.history.back()
    consegna()
    tappe.push(dove())
  }

  // ⚠️ Tornando indietro si ripassa da dove si e' passati, in ordine.
  prova('1º indietro: la Dama si sfila', tappe[0] === 'gioco/vocali/allbo', tappe[0])
  prova('2º indietro: si torna in Gruppo', tappe[1] === 'gruppo/vocali/allbo', tappe[1])
  prova('3º indietro: torna la Chat', tappe[2] === 'gruppo/chat/allbo', tappe[2])
  prova('4º indietro: si torna a Oggi', tappe[3] === 'oggi/chat/allbo', tappe[3])
}

console.log('\ntre livelli di schede, e il ritorno li rifa tutti')
{
  // ⚠️ Il Cassetto e' il terzo livello: tab -> Cassetto -> Documenti.
  // La fotografia e' una mappa piatta di chiavi e non un albero, quindi
  // il terzo livello non costa niente in piu' -- ma andava provato, non
  // dato per buono.
  const s = () => nav.leggiStato().schede

  nav.vaiA('tab', 'gruppo')
  nav.vaiA('scheda.gruppo', 'cassetto')
  nav.vaiA('scheda.cassetto', 'documenti')
  prova('si arriva ai documenti', s()['scheda.cassetto'] === 'documenti')

  finestra.history.back()
  consegna()
  prova('1o indietro: tornano le spese', s()['scheda.cassetto'] === 'spese', s()['scheda.cassetto'])
  prova('e il Cassetto resta aperto', s()['scheda.gruppo'] === 'cassetto')

  finestra.history.back()
  consegna()
  prova('2o indietro: si esce dal Cassetto', s()['scheda.gruppo'] === 'chat', s()['scheda.gruppo'])
  prova('e il tab e ancora Gruppo', s().tab === 'gruppo')

  finestra.history.back()
  consegna()
  prova('3o indietro: si cambia tab', s().tab !== 'gruppo', s().tab)
}

console.log('\nandare dove sei gia non lascia un passo a vuoto')
{
  // Toccare due volte lo stesso tab non deve costare due pressioni per
  // uscirne.
  const prima = finestra.history.length
  nav.vaiA('tab', 'oggi')
  nav.vaiA('tab', 'oggi')
  prova('nessuna voce in piu', finestra.history.length === prima, {
    prima,
    dopo: finestra.history.length,
  })
}

console.log('\nun foglio aperto si chiude prima della schermata')
{
  nav.vaiA('tab', 'gioco')
  const dopoIlTab = dove()

  let chiusure = 0
  const stacca = nav.quandoTornaIndietroDaUnFoglio(() => {
    chiusure += 1
  })

  nav.apriLivello()
  finestra.history.back()
  consegna()

  prova('il foglio si chiude', chiusure === 1)
  // ⚠️ E la schermata NON si muove: prima si chiude quello che sta
  // sopra, poi si torna indietro. Se si muovesse, il tasto indietro
  // cambierebbe tab lasciando il foglio aperto sopra.
  prova('e la schermata resta dov era', dove() === dopoIlTab, dove())

  // Il secondo indietro invece torna indietro davvero.
  finestra.history.back()
  consegna()
  prova('il secondo indietro cambia schermata', dove() !== dopoIlTab, dove())
  stacca()
}

console.log('\nchiudere un foglio col bottone non lascia una pressione a vuoto')
{
  // ⚠️ E' il compromesso che questo lavoro toglie. Prima la voce del
  // foglio non si toglieva mai: chi chiudeva col bottone e poi premeva
  // indietro vedeva il telefono non fare niente per una volta.
  nav.vaiA('tab', 'gruppo')
  const partenza = dove()
  const voci = finestra.history.length

  nav.apriLivello()
  prova('aprire lascia una voce', finestra.history.length === voci + 1)

  nav.chiudiLivello() // come premere «Lascia stare»
  await fineGiro() // il riordino parte a fine giro e torna a galla
  prova('chiudere la toglie', finestra.history.length === voci + 1)
  prova('e la schermata non si e mossa', dove() === partenza, dove())

  // E adesso la pressione seguente deve tornare indietro DAVVERO.
  finestra.history.back()
  consegna()
  prova('la pressione dopo non va a vuoto', dove() !== partenza, dove())
}

console.log('\nun riordino nostro non viene scambiato per un dito')
{
  // Il caso che aveva rotto tutto stamattina: si chiude un foglio e se ne
  // apre un altro nello stesso istante. L'evento del primo arriva quando
  // il secondo e' gia' aperto.
  let chiusure = 0
  const stacca = nav.quandoTornaIndietroDaUnFoglio(() => {
    chiusure += 1
  })

  nav.apriLivello()
  nav.chiudiLivello()
  nav.apriLivello() // il secondo foglio si apre PRIMA che l'evento arrivi
  await fineGiro()

  prova('il foglio nuovo non si chiude da solo', chiusure === 0, chiusure)

  // E il tasto indietro vero continua a funzionare.
  finestra.history.back()
  consegna()
  prova('e il tasto indietro chiude quello aperto', chiusure === 1, chiusure)
  stacca()
}

console.log('\napri-chiudi-apri nello stesso giro non ruba un passo indietro')
{
  // ⚠️ E' il difetto del 10 agosto, quello che faceva uscire dall'app
  // toccando fuori dalla mappa appena entrati.
  //
  // `StrictMode` monta, smonta e rimonta ogni effetto nello stesso
  // istante: il foglio faceva apri → chiudi → apri di fila. Con la
  // chiusura immediata l'ordine reale diventava «impila, impila, torna
  // indietro» — e quel passo indietro era un passo VERO, mangiato in
  // silenzio. Appena entrati non c'e' cronologia di scorta, e il passo
  // dopo usciva dall'app.
  // ⚠️ Si guarda **dove siamo**, non quante voci ci sono: il difetto
  // rubava una posizione, e la lunghezza non se ne accorge.
  nav.vaiAlTab('oggi')
  const dovEro = finestra.history.i

  nav.apriLivello()
  nav.chiudiLivello()
  nav.apriLivello() // il rimontaggio di StrictMode, nello stesso giro
  await fineGiro()

  prova('si sale di un passo solo', finestra.history.i === dovEro + 1, {
    prima: dovEro,
    adesso: finestra.history.i,
  })
  prova(
    'e ci stiamo sopra, non dietro',
    finestra.history.state?.all41Foglio === true,
    finestra.history.state
  )

  // La prova che conta: chiudendolo si torna esattamente da dove si era
  // partiti, non un passo piu' indietro.
  nav.chiudiLivello()
  await fineGiro()
  prova('e chiudendolo si torna esattamente li', finestra.history.i === dovEro, {
    atteso: dovEro,
    adesso: finestra.history.i,
  })
  prova('senza fogli rimasti aperti', nav.statoInterno().livelliAperti === 0)
}

console.log('\nuna fotografia di una versione vecchia non lascia lo schermo vuoto')
{
  // Una sotto-scheda rinominata fra un deploy e l'altro: il valore
  // vecchio arriva dalla cronologia e non esiste piu'.
  for (const a of ascoltatori) {
    a({ state: { all41: { schede: { tab: 'gruppo', 'scheda.gioco': 'sezione-che-non-esiste' } } } })
  }
  const s = nav.leggiStato().schede
  prova('ricade sul predefinito', s['scheda.gioco'] === 'allbo', s['scheda.gioco'])
  prova('e il resto passa', s.tab === 'gruppo')
}

console.log('\nentrare in un tab riparte dalla prima scheda')
{
  // ⚠️ Le due meta' di questa prova vanno lette insieme.
  //
  // Se combaciassero -- se anche il tasto indietro riportasse alla prima
  // scheda -- la regola sarebbe sbagliata: vorrebbe dire che tornare
  // indietro ha smesso di rifare la strada e si e' messo a resettare.
  // «Ci vado adesso» e «ci sono gia' stato» devono restare due cose
  // diverse, ed e' l'unico modo di accorgersi se smettessero di esserlo.
  const s = () => nav.leggiStato().schede

  nav.vaiAlTab('gruppo')
  nav.vaiA('scheda.gruppo', 'vocali')
  nav.vaiAlTab('gioco')
  prova('cambiando tab si va dove hai chiesto', s().tab === 'gioco', s().tab)

  nav.vaiAlTab('gruppo')
  prova('tornandoci, riparte dalla chat', s()['scheda.gruppo'] === 'chat', s()['scheda.gruppo'])

  // E l'altra meta': la stessa strada, ma col tasto indietro.
  //
  // ⚠️ Due pressioni e non una, e la prima e' istruttiva: disfa «sono
  // tornato in Gruppo» e ti rimette nel Gioco. La sotto-scheda dei vocali
  // li' e' gia' chat, perche' l'azzeramento e' successo quando sei uscito
  // dal Gruppo ed e' stato fotografato cosi'. La seconda pressione disfa
  // «sono andato nel Gioco», e li' i vocali ci sono ancora.
  finestra.history.back()
  consegna()
  prova('1o indietro: si torna nel Gioco', s().tab === 'gioco', s().tab)

  finestra.history.back()
  consegna()
  prova('2o indietro: torna il Gruppo', s().tab === 'gruppo', s().tab)
  prova('e i vocali sono ancora li', s()['scheda.gruppo'] === 'vocali', s()['scheda.gruppo'])
}

console.log('\nun tab rimette a posto TUTTE le sotto-schede, non la sua')
{
  // ⚠️ Nessuna mappa tab -> sotto-schede: si azzerano tutte quelle
  // registrate. Una mappa a mano si dimentica alla prima sezione nuova, e
  // si dimentica in silenzio -- nessuno scrive una prova per una sezione
  // che non sa di aver lasciato indietro.
  const s = () => nav.leggiStato().schede

  nav.vaiAlTab('gruppo')
  nav.vaiA('scheda.gruppo', 'cassetto')
  nav.vaiA('scheda.cassetto', 'documenti')
  nav.vaiA('scheda.gioco', 'dama')

  nav.vaiAlTab('oggi')
  prova('anche quella di un altro tab', s()['scheda.gioco'] === 'allbo', s()['scheda.gioco'])
  prova('e quella di terzo livello', s()['scheda.cassetto'] === 'spese', s()['scheda.cassetto'])
}

console.log('\nchi arriva da un avviso atterra dove voleva')
{
  // Le Leggi da leggere e le sfide a dama saltano dentro una sotto-scheda
  // precisa. Se l'azzeramento le travolgesse, il tasto «leggi» aprirebbe
  // la classifica e la Legge resterebbe col pallino.
  const s = () => nav.leggiStato().schede

  nav.vaiAlTab('oggi')
  nav.vaiAlTab('gioco', { 'scheda.gioco': 'testamento' })
  prova('si atterra sul Testamento', s()['scheda.gioco'] === 'testamento', s()['scheda.gioco'])

  // E ci si atterra anche arrivando dal tab dove sei gia'.
  nav.vaiAlTab('gioco', { 'scheda.gioco': 'dama' })
  prova('e ci si arriva anche da dentro', s()['scheda.gioco'] === 'dama', s()['scheda.gioco'])
}

console.log('\ntoccare il tab su cui sei gia non costa una pressione')
{
  nav.vaiAlTab('oggi')
  const voci = finestra.history.length
  nav.vaiAlTab('oggi')
  prova('nessuna voce in piu', finestra.history.length === voci, {
    prima: voci,
    dopo: finestra.history.length,
  })
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} cose non vanno.\n`)
process.exit(falliti === 0 ? 0 : 1)

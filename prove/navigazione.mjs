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
  back() {
    if (this.i === 0) return
    this.i -= 1
    // ⚠️ **Dopo**, non adesso. E' tutto il punto: nel browser vero
    // `back()` mette in coda un evento, e chi lo raccoglie non e' detto
    // sia chi l'ha chiesto.
    inCoda.push({ state: this.state })
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

// Consegna gli eventi messi in coda, come farebbe il browser al giro
// dopo.
function consegna() {
  while (inCoda.length) {
    const e = inCoda.shift()
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

nav.registraScheda('tab', 'oggi', ['oggi', 'gruppo', 'foto', 'gioco', 'altro'])
nav.registraScheda('scheda.gruppo', 'chat', ['chat', 'vocali'])
nav.registraScheda('scheda.gioco', 'classifica', ['classifica', 'dama'])

const dove = () => {
  const s = nav.leggiStato().schede
  return `${s.tab}/${s['scheda.gruppo']}/${s['scheda.gioco']}`
}

console.log('\nsi rifa la strada al contrario')
{
  prova('si parte da Oggi', dove() === 'oggi/chat/classifica', dove())

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
  prova('1º indietro: la Dama si sfila', tappe[0] === 'gioco/vocali/classifica', tappe[0])
  prova('2º indietro: si torna in Gruppo', tappe[1] === 'gruppo/vocali/classifica', tappe[1])
  prova('3º indietro: torna la Chat', tappe[2] === 'gruppo/chat/classifica', tappe[2])
  prova('4º indietro: si torna a Oggi', tappe[3] === 'oggi/chat/classifica', tappe[3])
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
  consegna() // il riordino torna a galla
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
  consegna()

  prova('il foglio nuovo non si chiude da solo', chiusure === 0, chiusure)

  // E il tasto indietro vero continua a funzionare.
  finestra.history.back()
  consegna()
  prova('e il tasto indietro chiude quello aperto', chiusure === 1, chiusure)
  stacca()
}

console.log('\nuna fotografia di una versione vecchia non lascia lo schermo vuoto')
{
  // Una sotto-scheda rinominata fra un deploy e l'altro: il valore
  // vecchio arriva dalla cronologia e non esiste piu'.
  for (const a of ascoltatori) {
    a({ state: { all41: { schede: { tab: 'gruppo', 'scheda.gioco': 'sezione-che-non-esiste' } } } })
  }
  const s = nav.leggiStato().schede
  prova('ricade sul predefinito', s['scheda.gioco'] === 'classifica', s['scheda.gioco'])
  prova('e il resto passa', s.tab === 'gruppo')
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} cose non vanno.\n`)
process.exit(falliti === 0 ? 0 : 1)

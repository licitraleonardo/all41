// Il motore del gioco, provato senza canvas e senza browser.
//
// La proprietà che conta più di tutte è l'ultima: un giocatore che gioca
// bene deve poter andare avanti all'infinito. Se il generatore mettesse
// due ostacoli troppo vicini, prima o poi uscirebbe una combinazione
// impossibile — e un gioco che uccide senza scampo non è difficile, è
// rotto. Non si scopre giocando: si scopre facendo giocare un pilota
// automatico per ore simulate.

import {
  finestraSopra,
  probabilitaDoppietta,
  nuovoMondo,
  avvia,
  salta,
  passo,
  punteggio,
  riquadroGiocatore,
  staccoExtra,
  probabilitaVolante,
  velocitaDi,
  ALTEZZA_SALTO,
  TEMPO_DI_VOLO,
} from '../src/lib/pecora.js'
import { FISICA, MURO, NAVICELLA, RITMO, MONDO, SAGOME, TEMA, muroDi } from '../src/config/pecora.js'

let falliti = 0
const SCENA_LARGA = MONDO.larghezza
const SCENA_X = MONDO.giocatoreX

function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio) console.log('       ', JSON.stringify(dettaglio).slice(0, 300))
  }
}

const DT = 1 / 60

console.log('\nsalto')
prova(
  'si arriva più in alto dell’ostacolo più alto',
  ALTEZZA_SALTO > Math.max(...TEMA.ostacoli.map((t) => SAGOME[t].altezza)),
  { ALTEZZA_SALTO }
)

let m = salta(nuovoMondo(7))
prova('il primo tocco fa partire la partita', m.stato === 'corsa')

let maxAltezza = 0
let sottoZero = false
for (let i = 0; i < 200; i += 1) {
  m = passo(m, DT)
  maxAltezza = Math.max(maxAltezza, m.giocatore.y)
  if (m.giocatore.y < 0) sottoZero = true
}
prova('non si sprofonda mai sotto terra', !sottoZero)
prova('il salto arriva dove dice la fisica', Math.abs(maxAltezza - ALTEZZA_SALTO) < 6, {
  maxAltezza,
  ALTEZZA_SALTO,
})

// Niente doppio salto: a mezz'aria il comando non fa niente.
m = salta(nuovoMondo(7))
m = passo(m, DT)
const inAria = m.giocatore.vy
prova('a mezz’aria non si salta di nuovo', salta(m).giocatore.vy === inAria)

console.log('\nritmo degli ostacoli')

// Si lascia correre a lungo e si controlla che due ostacoli non nascano
// mai più vicini di quanto si percorre in un salto alla velocità di quel
// momento. È la condizione fisica di superabilità, senza il margine di
// sicurezza che sta in configurazione: se qualcuno abbassasse `stacco`
// sotto 1, questa prova se ne accorgerebbe.
m = avvia(nuovoMondo(99))
let peggiorRapportoFraBlocchi = Infinity
let peggiorBlocco = 0
let blocchiVisti = 0
let quantiGenerati = 0
const visti = new Map()

for (let i = 0; i < 60 * 60 * 3; i += 1) {
  m = passo(m, DT)
  if (m.stato === 'finita') m = { ...m, stato: 'corsa' } // qui morire non conta

  for (const o of m.ostacoli) {
    if (visti.has(o.id)) continue
    // I gemelli di una doppietta nascono nello stesso istante, quindi
    // condividono la distanza: è così che si riconosce un blocco.
    visti.set(o.id, { distanza: m.distanza, larghezza: o.larghezza, x: o.x, velocita: m.velocita })
    quantiGenerati += 1
  }
}

const perNascita = new Map()
for (const [, v] of visti) {
  const chiave = Math.round(v.distanza * 100)
  if (!perNascita.has(chiave)) perNascita.set(chiave, [])
  perNascita.get(chiave).push(v)
}

const blocchi = [...perNascita.entries()]
  .sort((a, b) => a[0] - b[0])
  .map(([, pezzi]) => ({
    distanza: pezzi[0].distanza,
    velocita: pezzi[0].velocita,
    inizio: Math.min(...pezzi.map((q) => q.x)),
    fine: Math.max(...pezzi.map((q) => q.x + q.larghezza)),
  }))

blocchiVisti = blocchi.length
for (let i = 0; i < blocchi.length; i += 1) {
  const b = blocchi[i]
  // Quanto è largo rispetto al massimo scavalcabile a quella velocità:
  // sopra 1 sarebbe una condanna, non una difficoltà.
  const tetto = finestraSopra(46) * b.velocita - SAGOME[TEMA.protagonista].larghezza
  if (tetto > 0) peggiorBlocco = Math.max(peggiorBlocco, (b.fine - b.inizio) / tetto)

  const prima = blocchi[i - 1]
  if (!prima) continue
  const stacco = b.distanza - prima.distanza - (prima.fine - prima.inizio)
  peggiorRapportoFraBlocchi = Math.min(peggiorRapportoFraBlocchi, stacco / (b.velocita * TEMPO_DI_VOLO))
}

prova('di ostacoli ne nascono parecchi', quantiGenerati > 100, { quantiGenerati })

// Il contratto non è più "due ostacoli non si toccano mai": adesso ci
// sono le doppiette, due attaccati da scavalcare con un salto solo.
// La regola giusta è che o fra un blocco e il successivo c'è un salto
// intero, oppure i due stanno nello stesso blocco — e quel blocco resta
// più stretto di quanto la fisica consenta di scavalcare.
prova(
  'fra un blocco e l’altro c’è sempre un salto intero',
  peggiorRapportoFraBlocchi >= 1,
  { peggiore: Math.round(peggiorRapportoFraBlocchi * 100) / 100 }
)
prova(
  'e nessun blocco è più largo di quanto si riesca a scavalcare',
  peggiorBlocco <= 1,
  { peggiore: Math.round(peggiorBlocco * 100) / 100, blocchiVisti }
)

console.log('\nil gabbiano')
const gabbiano = SAGOME[TEMA.volante]
const pecora = SAGOME[TEMA.protagonista]
prova(
  'restando a terra ci si passa sotto',
  pecora.altezza <= gabbiano.quota,
  { altezzaPecora: pecora.altezza, quotaGabbiano: gabbiano.quota }
)
prova(
  'saltando ci si sbatte contro',
  ALTEZZA_SALTO + pecora.altezza > gabbiano.quota
)

console.log('\nla corsa non smette mai di accelerare')
{
  // Prima era una retta: `v0 + a*t`. Dopo il primo minuto non cambiava
  // piu' niente e il gioco restava uguale a se' stesso per sempre — «e'
  // troppo facile» nasce li'. Adesso l'accelerazione stessa cresce.
  const campioni = [0, 5, 10, 20, 30, 40]
  const cresce = campioni.every((s, i) => i === 0 || velocitaDi(s) > velocitaDi(campioni[i - 1]))
  prova('accelera sempre, finche non tocca il tetto', cresce, campioni.map(velocitaDi))

  // E accelera in modo **crescente**: il guadagno del secondo mezzo
  // minuto deve essere maggiore di quello del primo. E' la differenza
  // fra una retta e una curva, ed e' quello che si sente giocando.
  const primoTratto = velocitaDi(15) - velocitaDi(0)
  const secondoTratto = velocitaDi(30) - velocitaDi(15)
  prova('e accelera sempre di piu', secondoTratto > primoTratto, { primoTratto, secondoTratto })

  prova('ma non supera mai il tetto', velocitaDi(10000) === FISICA.velocitaMax)
  prova('e il tetto lo tocca davvero', velocitaDi(60) === FISICA.velocitaMax)

  // ⚠️ La riga con i denti, e vale piu' di tutte le altre di questo
  // blocco.
  //
  // La scena e' larga 500 unita' e Allan corre a 52: un ostacolo entra
  // in campo e gli arriva addosso dopo (500-52)/velocita secondi. Quello
  // e' tutto il tempo che una persona ha per vederlo, decidere e saltare.
  // Il tempo di reazione umano sta sui 0,25 s: sotto quella soglia il
  // gioco non e' difficile, e' un dado — e la regola di questo file, da
  // sempre, e' che un gioco che uccide senza scampo e' rotto.
  //
  // Alzando `velocitaMax` per rendere il gioco piu' duro si passa quella
  // soglia senza nessun errore: si vede solo gente che muore e non capisce
  // perche'. Questa riga e' l'unico posto che se ne accorge.
  const REAZIONE = 0.35
  const visto = (SCENA_LARGA - SCENA_X) / FISICA.velocitaMax
  prova('e al massimo un ostacolo si vede abbastanza a lungo', visto >= REAZIONE, {
    secondi: Number(visto.toFixed(3)),
    minimo: REAZIONE,
  })
}

console.log('\nla difficoltà cresce')
prova(
  'il respiro fra gli ostacoli si stringe',
  staccoExtra(0) > staccoExtra(2000) && staccoExtra(2000) > staccoExtra(4500)
)
prova(
  'ma non scende mai sotto lo zero: il minimo resta intatto',
  staccoExtra(999999) >= 0,
  { finale: staccoExtra(999999) }
)
prova('il gabbiano non c’è nei primi metri', probabilitaVolante(100) === 0)
prova(
  'e poi si fa vedere sempre più spesso',
  probabilitaVolante(1000) < probabilitaVolante(4500),
  { a1000: probabilitaVolante(1000), a4500: probabilitaVolante(4500) }
)

console.log('\nla navicella')
m = avvia(nuovoMondo(21))
prova('non c’è all’inizio', m.navicella.arrivata === false)
prova('parte da sopra il cielo', m.navicella.quota === NAVICELLA.quotaDArrivo)

const tipiVisti = new Set()
const quoteSparate = new Set()
let scesa = null
for (let i = 0; i < 60 * 180; i += 1) {
  m = passo(m, DT)
  if (m.stato === 'finita') m = { ...m, stato: 'corsa' }
  if (m.navicella.arrivata && scesa === null && m.navicella.quota <= NAVICELLA.quote[2]) {
    scesa = Math.round(m.navicella.quota)
  }
  for (const o of m.ostacoli) {
    tipiVisti.add(o.tipo)
    if (o.tipo === TEMA.raggio) quoteSparate.add(o.quota)
  }
  if (punteggio(m) > NAVICELLA.soglia + 4000) break
}

prova('arriva sempre allo stesso punteggio', m.navicella.arrivata === true)
prova('ed è scesa dal cielo fino alle sue quote', scesa !== null, { scesa })
prova('e da lì in poi spara', tipiVisti.has(TEMA.raggio), {
  tipiVisti: [...tipiVisti],
})
prova(
  'i raggi escono solo dalle tre quote della navicella',
  [...quoteSparate].every((q) => NAVICELLA.quote.includes(q)),
  { quoteSparate: [...quoteSparate] }
)
prova('e prima o poi le usa tutte e tre', quoteSparate.size === 3, {
  quoteSparate: [...quoteSparate],
})

// Prima della soglia non deve arrivare.
let n = avvia(nuovoMondo(21))
for (let i = 0; i < 60 * 5; i += 1) {
  n = passo(n, DT)
  if (n.stato === 'finita') n = { ...n, stato: 'corsa' }
}
prova('prima della soglia non si vede', n.navicella.arrivata === false, {
  punti: punteggio(n),
})

console.log('\ni raggi si schivano')
const raggio = SAGOME[TEMA.raggio]
const allan = SAGOME[TEMA.protagonista]
const [rasoTerra, centro, alto] = NAVICELLA.quote

// Raso terra: prende chi resta giù, si scavalca saltando.
prova('raso terra prende chi non salta', allan.altezza > rasoTerra)
prova('e si scavalca saltando', ALTEZZA_SALTO > rasoTerra + raggio.altezza)

// Al centro: passa sopra la testa di chi sta a terra, ma la traiettoria
// del salto lo attraversa due volte, salendo e scendendo. Chi salta a
// caso lo prende; chi salta al momento giusto ci passa sopra — ed è
// giusto così, è l'unico punto del gioco dove conta il tempismo e non
// solo il riflesso.
prova('al centro non tocca chi resta a terra', allan.altezza <= centro)
prova('ma il salto lo attraversa', ALTEZZA_SALTO > centro + raggio.altezza)

// In alto: l'apice del salto resta sotto. È un respiro.
prova('in alto passa sopra anche saltando', ALTEZZA_SALTO + allan.altezza < alto)

console.log('\nfermi si muore')
m = avvia(nuovoMondo(3))
let morto = false
for (let i = 0; i < 60 * 30 && !morto; i += 1) {
  m = passo(m, DT)
  if (m.stato === 'finita') morto = true
}
prova('chi non salta mai prima o poi la prende', morto)

console.log('\nlo stesso seme rifà la stessa partita')
function partita(seme, passi) {
  let x = avvia(nuovoMondo(seme))
  for (let i = 0; i < passi; i += 1) x = passo(x, DT)
  return x
}
const a1 = partita(42, 1200)
const a2 = partita(42, 1200)
const b1 = partita(43, 1200)
prova(
  'stesso seme, stessi ostacoli',
  JSON.stringify(a1.ostacoli) === JSON.stringify(a2.ostacoli)
)
prova(
  'semi diversi, partite diverse',
  JSON.stringify(a1.ostacoli) !== JSON.stringify(b1.ostacoli)
)

console.log('\ncambio di scheda')
m = avvia(nuovoMondo(11))
for (let i = 0; i < 300; i += 1) m = passo(m, DT)
const primaDelSalto = m.distanza
const dopoUnBuco = passo(m, 5) // cinque secondi persi in una volta
prova(
  'un buco di cinque secondi non teletrasporta',
  dopoUnBuco.distanza - primaDelSalto < m.velocita * 0.06,
  { avanzato: dopoUnBuco.distanza - primaDelSalto }
)

console.log('\nun pilota automatico deve sopravvivere all’infinito')

// Salta quando l'ostacolo di terra più vicino è entrato nella finestra
// utile, e resta a terra per il gabbiano. Se il generatore producesse
// una coppia impossibile, qui morirebbe.
function pilota(mondo) {
  const io = riquadroGiocatore(mondo)
  const davanti = mondo.ostacoli
    .filter((o) => o.x + o.larghezza > io.x)
    .sort((x, y) => x.x - y.x)
  if (!davanti.length) return mondo
  if (davanti[0].quota > 0) return mondo // il gabbiano si passa restando giù

  // Il blocco da scavalcare non è il primo ostacolo: è tutta la fila di
  // ostacoli attaccati. Prima questo pilota guardava solo il primo e
  // saltava troppo presto, ricadendo in mezzo alla coppia — moriva dove
  // un giocatore vero avrebbe semplicemente saltato più tardi.
  let fine = davanti[0].x + davanti[0].larghezza
  for (const o of davanti.slice(1)) {
    if (o.quota > 0) break
    if (o.x - fine > 20) break
    fine = Math.max(fine, o.x + o.larghezza)
  }

  const larghezzaBlocco = fine - davanti[0].x
  const distanza = davanti[0].x - (io.x + io.larghezza)

  // Si stacca da terra in modo che il passaggio sopra il blocco cada
  // attorno al culmine del salto, dove c'è più aria sotto i piedi.
  const meta = TEMPO_DI_VOLO / 2
  const quando = mondo.velocita * meta - (io.larghezza + larghezzaBlocco) / 2

  if (distanza <= quando && mondo.giocatore.y === 0) return salta(mondo)
  return mondo
}

let sopravvissuto = 0
let mortePilota = null
const tipiIncontrati = new Set()
for (const seme of [1, 7, 42, 99, 512, 20260812]) {
  let g = avvia(nuovoMondo(seme))
  // Dieci minuti simulati per ogni seme: ben oltre qualunque partita
  // vera in spiaggia.
  for (let i = 0; i < 60 * 60 * 10; i += 1) {
    g = pilota(g)
    g = passo(g, DT)
    for (const o of g.ostacoli) tipiIncontrati.add(o.tipo)
    if (g.stato === 'finita') {
      mortePilota = {
        seme,
        punteggio: punteggio(g),
        secondi: Math.round(g.tempo),
        ostacoli: g.ostacoli.map((o) => ({ tipo: o.tipo, x: Math.round(o.x) })),
      }
      break
    }
  }
  if (g.stato === 'corsa') sopravvissuto += 1
}

prova(
  'nessuna combinazione impossibile in sessanta minuti simulati',
  sopravvissuto === 6,
  mortePilota
)
prova(
  'e nel frattempo ha incontrato di tutto, raggi compresi',
  [...TEMA.ostacoli, TEMA.volante, TEMA.raggio].every((t) => tipiIncontrati.has(t)),
  { incontrati: [...tipiIncontrati] }
)

const aUnMinuto = (() => {
  let g = avvia(nuovoMondo(5))
  const tappe = []
  for (let i = 0; i < 60 * 150; i += 1) {
    g = pilota(g)
    g = passo(g, DT)
    if (i === 60 * 60) tappe.push({ quando: 60, velocita: g.velocita, punti: punteggio(g) })
  }
  return { g, tappe }
})()

prova('a un minuto il punteggio è già alto', aUnMinuto.tappe[0].punti > 1000, aUnMinuto.tappe[0])
prova(
  'a un minuto corre già molto più che all’inizio',
  aUnMinuto.tappe[0].velocita > FISICA.velocitaIniziale * 2,
  aUnMinuto.tappe[0]
)
prova(
  'la velocità arriva al tetto e non lo supera mai',
  aUnMinuto.g.velocita === FISICA.velocitaMax,
  { velocita: aUnMinuto.g.velocita }
)
prova(
  'a quel punto il respiro è già sotto quello di rodaggio',
  staccoExtra(aUnMinuto.g.distanza) <= RITMO.staccoExtraFinale + 0.001,
  { stacco: Math.round(staccoExtra(aUnMinuto.g.distanza) * 1000) / 1000 }
)

console.log('\nil muro: oltre il record il gioco stringe')
{
  const muro = muroDi(0)
  prova('senza record si eredita quello finto', muro === MURO.recordFinto, { muro })
  prova('con un record vero il muro è quello', muroDi(1200) === 1200)
  prova('un record più basso del finto non abbassa il muro', muroDi(120) === MURO.recordFinto)

  const prima = staccoExtra((muro - 50) * 10, muro)
  const dopo = staccoExtra((muro + 200) * 10, muro)
  prova('appena prima del muro si respira ancora', prima > dopo, { prima, dopo })
  prova(
    'oltre il muro il respiro si chiude quasi del tutto',
    dopo <= RITMO.staccoExtraOltreIlMuro + 0.001,
    { dopo }
  )
  prova('ma non va mai sotto zero: il minimo resta intatto', staccoExtra(9e9, muro) >= 0)

  prova(
    'oltre il muro le doppiette escono più spesso',
    probabilitaDoppietta((muro + 200) * 10, muro) > probabilitaDoppietta((muro - 50) * 10, muro)
  )
  prova('e nei primi metri non escono affatto', probabilitaDoppietta(100, muro) === 0)

  // Chi ha un record alto incontra la parte dura più tardi: e' il senso
  // del muro, non un premio.
  prova(
    'chi ha il record alto arriva più lontano prima di soffrire',
    staccoExtra(7000, 600) < staccoExtra(7000, 2000)
  )
}

console.log('\nle quote della navicella')
{
  const somma = NAVICELLA.pesiQuote.reduce((a, b) => a + b, 0)
  prova('i pesi stanno in piedi', Math.abs(somma - 1) < 0.001, { somma })
  prova(
    'la quota alta esce meno delle altre due',
    NAVICELLA.pesiQuote[2] < NAVICELLA.pesiQuote[0] &&
      NAVICELLA.pesiQuote[2] < NAVICELLA.pesiQuote[1],
    { pesi: NAVICELLA.pesiQuote }
  )
}

console.log('\ni tre raggi')
{
  prova('sono tre sagome diverse', new Set(TEMA.raggi).size === 3)
  for (const r of TEMA.raggi) {
    const s = SAGOME[r]
    prova(
      `${r}: raso terra si scavalca`,
      ALTEZZA_SALTO > s.altezza,
      { altezza: s.altezza, salto: Math.round(ALTEZZA_SALTO) }
    )
    prova(
      `${r}: e ci si passa sotto quando è al centro`,
      SAGOME[TEMA.protagonista].altezza <= NAVICELLA.quote[1]
    )
  }
  const lungo = SAGOME['raggio-lungo']
  prova(
    'il più largo resta scavalcabile anche alla velocità minima',
    lungo.larghezza <
      finestraSopra(lungo.altezza) * FISICA.velocitaIniziale -
        SAGOME[TEMA.protagonista].larghezza,
    { largo: lungo.larghezza }
  )
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} falliti.\n`)
process.exit(falliti === 0 ? 0 : 1)

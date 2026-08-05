// Il motore del gioco, provato senza canvas e senza browser.
//
// La proprietà che conta più di tutte è l'ultima: un giocatore che gioca
// bene deve poter andare avanti all'infinito. Se il generatore mettesse
// due ostacoli troppo vicini, prima o poi uscirebbe una combinazione
// impossibile — e un gioco che uccide senza scampo non è difficile, è
// rotto. Non si scopre giocando: si scopre facendo giocare un pilota
// automatico per ore simulate.

import {
  nuovoMondo,
  avvia,
  salta,
  passo,
  punteggio,
  riquadroGiocatore,
  staccoExtra,
  probabilitaVolante,
  ALTEZZA_SALTO,
  TEMPO_DI_VOLO,
} from '../src/lib/pecora.js'
import { FISICA, NAVICELLA, RITMO, SAGOME, TEMA } from '../src/config/pecora.js'

let falliti = 0
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
let peggiorRapporto = Infinity
let quantiGenerati = 0
const visti = new Map()

for (let i = 0; i < 60 * 60 * 3; i += 1) {
  m = passo(m, DT)
  if (m.stato === 'finita') m = { ...m, stato: 'corsa' } // qui morire non conta

  for (const o of m.ostacoli) {
    if (visti.has(o.id)) continue
    // Nascono tutti nello stesso punto, fuori dallo schermo a destra:
    // quello che li separa non è la x ma quanta strada è passata fra una
    // nascita e l'altra.
    visti.set(o.id, { distanza: m.distanza, larghezza: o.larghezza })
    quantiGenerati += 1

    const precedente = visti.get(o.id - 1)
    if (!precedente) continue

    const stacco = m.distanza - precedente.distanza - precedente.larghezza
    const serve = m.velocita * TEMPO_DI_VOLO
    peggiorRapporto = Math.min(peggiorRapporto, stacco / serve)
  }
}

prova('di ostacoli ne nascono parecchi', quantiGenerati > 100, { quantiGenerati })
prova(
  'mai due più vicini di un salto intero',
  peggiorRapporto >= 1,
  { peggiorRapporto: Math.round(peggiorRapporto * 100) / 100 }
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
    .sort((x, y) => x.x - y.x)[0]
  if (!davanti) return mondo
  if (davanti.quota > 0) return mondo // il gabbiano si passa restando giù

  const distanza = davanti.x - (io.x + io.larghezza)
  const finestra = mondo.velocita * TEMPO_DI_VOLO * 0.42
  if (distanza <= finestra && mondo.giocatore.y === 0) return salta(mondo)
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
  'a quel punto lo stacco in più è quello finale',
  Math.abs(staccoExtra(aUnMinuto.g.distanza) - RITMO.staccoExtraFinale) < 0.001
)

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} falliti.\n`)
process.exit(falliti === 0 ? 0 : 1)

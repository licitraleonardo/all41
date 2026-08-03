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
  ALTEZZA_SALTO,
  TEMPO_DI_VOLO,
} from '../src/lib/pecora.js'
import { FISICA, SAGOME, TEMA } from '../src/config/pecora.js'

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
for (const seme of [1, 7, 42, 99, 512, 20260812]) {
  let g = avvia(nuovoMondo(seme))
  // Dieci minuti simulati per ogni seme: ben oltre qualunque partita
  // vera in spiaggia.
  for (let i = 0; i < 60 * 60 * 10; i += 1) {
    g = pilota(g)
    g = passo(g, DT)
    if (g.stato === 'finita') {
      mortePilota = { seme, punteggio: punteggio(g), secondi: Math.round(g.tempo) }
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

const finale = (() => {
  let g = avvia(nuovoMondo(5))
  for (let i = 0; i < 60 * 60; i += 1) {
    g = pilota(g)
    g = passo(g, DT)
  }
  return g
})()
prova('e intanto il punteggio sale', punteggio(finale) > 1000, {
  punti: punteggio(finale),
})
prova(
  'la velocità arriva al tetto e ci resta',
  finale.velocita === FISICA.velocitaMax,
  { velocita: finale.velocita }
)

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} falliti.\n`)
process.exit(falliti === 0 ? 0 : 1)

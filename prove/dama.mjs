// Le prove della Dama. Come per la Pecora e i conti: casi scritti a mano
// che fissano il verso delle regole, più partite casuali con seme fisso
// su cui si verificano le proprietà che devono valere sempre.
//
//   node prove/dama.mjs

import {
  BIANCO,
  NERO,
  applicaMossa,
  esito,
  mosseLegali,
  mossaDaTesto,
  mossaInTesto,
  partitaNuova,
  ricostruisci,
  toccaA,
} from '../src/lib/dama.js'
import { DAMA } from '../src/config/dama.js'

let passate = 0
let fallite = 0

function prova(nome, condizione) {
  if (condizione) {
    passate += 1
  } else {
    fallite += 1
    console.error(`  FALLITA: ${nome}`)
  }
}

// Un generatore col seme fisso: se una partita fallisce, si rilancia
// identica invece di sperare che ricapiti.
function mulberry32(seme) {
  let a = seme
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Una scacchiera scritta a mano: '.' vuota, 'b'/'n' pedine, 'B'/'N' dame.
// Otto righe da otto, dall'alto in basso, come si vede a schermo.
function scacchiera(righe, turno) {
  const caselle = Array(64).fill(null)
  righe.forEach((r, ri) => {
    ;[...r].forEach((ch, ci) => {
      if (ch === '.') return
      caselle[ri * 8 + ci] = {
        colore: ch.toLowerCase() === 'b' ? BIANCO : NERO,
        dama: ch === 'B' || ch === 'N',
      }
    })
  })
  return { caselle, turno, senzaPresa: 0 }
}

console.log('Apertura')
{
  const inizio = partitaNuova()
  const mosse = mosseLegali(inizio)
  prova('il bianco apre con 7 mosse', mosse.length === 7)
  prova('nessuna presa in apertura', mosse.every((m) => m.prese.length === 0))
  prova('24 pedine in campo', inizio.caselle.filter(Boolean).length === 24)
  prova('tocca al bianco', inizio.turno === BIANCO)
  prova('il bianco muove sulle mosse pari', toccaA(0) === BIANCO && toccaA(1) === NERO)
}

console.log('La presa è obbligatoria')
{
  // Il nero a portata: il bianco ha anche mosse semplici, ma non contano.
  const s = scacchiera(
    [
      '........',
      '........',
      '........',
      '........',
      '...n....',
      '..b.....',
      '........',
      '.b......',
    ],
    BIANCO
  )
  const mosse = mosseLegali(s)
  prova('restano solo le prese', mosse.every((m) => m.prese.length > 0))
  prova('la presa è una', mosse.length === 1)
  prova('parte dalla pedina giusta', mosse[0].da === 42)
  const dopo = applicaMossa(s, mosse[0])
  // La preda sta in (4,3)=35, si salta da (5,2)=42 a (3,4)=28.
  prova('la preda sparisce', dopo.caselle[35] === null)
  prova('si atterra oltre', dopo.caselle[28]?.colore === BIANCO)

  // La mossa semplice, che sarebbe legale senza la presa, va rifiutata.
  let rifiutata = false
  try {
    applicaMossa(s, { da: 57, passi: [48] })
  } catch {
    rifiutata = true
  }
  prova('la mossa semplice viene rifiutata', rifiutata)
}

console.log('La catena si completa')
{
  const s = scacchiera(
    [
      '........',
      '........',
      '........',
      '..n.n...',
      '........',
      '..n.....',
      '.b......',
      '........',
    ],
    BIANCO
  )
  const mosse = mosseLegali(s)
  const doppia = mosse.find((m) => m.prese.length === 2)
  prova('esiste la presa doppia', Boolean(doppia))
  prova('la catena non si ferma a metà', mosse.every((m) => m.prese.length === 2))
}

console.log('La promozione chiude la mossa')
{
  const s = scacchiera(
    [
      '........',
      '..n.n...',
      '...b....',
      '........',
      '........',
      '........',
      '........',
      '........',
    ],
    BIANCO
  )
  const mosse = mosseLegali(s)
  prova('si mangia e si promuove', mosse.every((m) => m.prese.length === 1 && m.promuove))
  const dopo = applicaMossa(s, mosse[0])
  const arrivo = mosse[0].passi[mosse[0].passi.length - 1]
  prova('in fondo c\'è una dama', dopo.caselle[arrivo]?.dama === true)
  // Con due prede in riga 1, una pedina normale continuerebbe la catena:
  // la promozione la ferma dopo la prima.
  prova('una preda sola, non due', mosse.every((m) => m.prese.length === 1))
}

console.log('La dama torna indietro, la pedina no')
{
  const s = scacchiera(
    [
      '........',
      '........',
      '........',
      '...B....',
      '........',
      '........',
      '........',
      '........',
    ],
    BIANCO
  )
  prova('la dama ha quattro direzioni', mosseLegali(s).length === 4)

  const p = scacchiera(
    [
      '........',
      '........',
      '........',
      '...b....',
      '........',
      '........',
      '........',
      '........',
    ],
    BIANCO
  )
  prova('la pedina ne ha due', mosseLegali(p).length === 2)
}

console.log('Chi non può muovere ha perso')
{
  // Nero di turno, chiuso nell'angolo dalla dama bianca.
  const s = scacchiera(
    [
      'n.......',
      '.B......',
      '..B.....',
      '........',
      '........',
      '........',
      '........',
      '........',
    ],
    NERO
  )
  // Il nero in 0 non può muovere (9 sarebbe presa ma 18 è occupata):
  // la presa richiede l'atterraggio libero.
  const e = esito(s)
  prova('bloccato = sconfitto', e.finita && e.vincitore === BIANCO)
}

console.log('La patta arriva da sola')
{
  const s = scacchiera(
    [
      'N.......',
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
      '.......B',
    ],
    BIANCO
  )
  s.senzaPresa = DAMA.pattaDopo
  const e = esito(s)
  prova('dopo il limite è patta', e.finita && e.vincitore === null)
}

console.log('Il testo va e torna')
{
  const s = partitaNuova()
  for (const m of mosseLegali(s)) {
    const t = mossaInTesto(m)
    const r = mossaDaTesto(t)
    prova(`"${t}" torna identica`, r.da === m.da && r.passi.join() === m.passi.join())
  }
  let storta = false
  try {
    mossaDaTesto('99x105')
  } catch {
    storta = true
  }
  prova('il testo storto esplode invece di passare', storta)
}

console.log('Partite casuali: 200 con seme fisso')
{
  let finite = 0
  let patte = 0
  for (let seme = 1; seme <= 200; seme += 1) {
    const caso = mulberry32(seme)
    let stato = partitaNuova()
    const mosse = []
    let pezziPrima = 24

    for (let giro = 0; giro < 500; giro += 1) {
      const e = esito(stato)
      if (e.finita) {
        finite += 1
        if (e.vincitore === null) patte += 1
        break
      }
      const legali = mosseLegali(stato)
      const scelta = legali[Math.floor(caso() * legali.length)]

      // Proprietà: se esiste una presa, tutte le mosse sono prese.
      if (legali.some((m) => m.prese.length > 0) && legali.some((m) => m.prese.length === 0)) {
        prova(`seme ${seme}: presa obbligatoria violata`, false)
        break
      }

      stato = applicaMossa(stato, scelta)
      mosse.push(mossaInTesto(scelta))

      // Proprietà: i pezzi non aumentano mai.
      const pezziDopo = stato.caselle.filter(Boolean).length
      if (pezziDopo > pezziPrima) {
        prova(`seme ${seme}: i pezzi sono aumentati`, false)
        break
      }
      pezziPrima = pezziDopo

      // Proprietà: nessun pezzo su casella chiara.
      const fuoriPosto = stato.caselle.some((p, i) => p && (Math.floor(i / 8) + (i % 8)) % 2 === 0)
      if (fuoriPosto) {
        prova(`seme ${seme}: pezzo su casella chiara`, false)
        break
      }
    }

    // Proprietà: la partita ricostruita dalle mosse è identica a quella
    // giocata — è quello che tiene d'accordo due telefoni.
    const rigiocata = ricostruisci(mosse)
    if (JSON.stringify(rigiocata) !== JSON.stringify(stato)) {
      prova(`seme ${seme}: la ricostruzione diverge`, false)
    }
  }
  prova(`tutte le 200 finiscono (finite: ${finite})`, finite === 200)
  console.log(`  (patte: ${patte} su 200)`)
}

console.log('')
if (fallite > 0) {
  console.error(`${fallite} prove fallite, ${passate} passate.`)
  process.exit(1)
}
console.log(`Tutte verdi: ${passate} prove.`)

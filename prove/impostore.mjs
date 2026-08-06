// L'Impostore. Da qui escono punti e soprattutto segreti: se le parole
// finiscono nella persona sbagliata la partita e' rovinata e nessuno se
// ne accorge finche' non e' tardi.

import {
  avanza,
  diTurno,
  esito,
  mescola,
  preparaPartita,
  premi,
  quantiMancano,
  quantiPerRivelare,
  bastaPerRivelare,
  tuttiHannoVotato,
  schedePerId,
} from '../src/lib/impostore.js'
import { COPPIE, IMPOSTORE, NESSUNA_PAROLA } from '../src/config/impostore.js'
import { PER_ID } from '../src/config/leggi.js'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio) console.log('       ', JSON.stringify(dettaglio))
  }
}

// Un generatore prevedibile: le partite si devono poter rigiocare uguali.
function dado(semi) {
  let s = semi >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

const OTTO = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const COPPIA = ['Mare', 'Lago']

console.log('\nle parole')
{
  const p = preparaPartita({ giocatori: OTTO, coppia: COPPIA, casuale: dado(1) })

  prova('tutti ricevono una parola', Object.keys(p.assegnazioni).length === 8)
  prova(
    'gli impostori hanno la parola diversa',
    p.impostori.every((id) => p.assegnazioni[id] === 'Lago'),
    p.assegnazioni
  )
  prova(
    'tutti gli altri hanno la stessa',
    OTTO.filter((id) => !p.impostori.includes(id)).every((id) => p.assegnazioni[id] === 'Mare')
  )
  prova('nessuno resta senza', Object.values(p.assegnazioni).every(Boolean))
  prova('in otto ci sono due impostori', p.impostori.length === 2, p.impostori)
  prova('gli impostori sono persone diverse', new Set(p.impostori).size === p.impostori.length)
  prova(
    'gli impostori giocano davvero',
    p.impostori.every((id) => OTTO.includes(id))
  )
}

{
  const p = preparaPartita({
    giocatori: OTTO,
    coppia: COPPIA,
    variante: 'senza-parola',
    casuale: dado(7),
  })
  prova(
    'nella variante classica l’impostore non ha parola',
    p.impostori.every((id) => p.assegnazioni[id] === NESSUNA_PAROLA)
  )
  prova(
    'ma gli altri sì',
    OTTO.filter((id) => !p.impostori.includes(id)).every((id) => p.assegnazioni[id] === 'Mare')
  )
}

console.log('\nquanti impostori')
{
  const conta = (n) =>
    preparaPartita({
      giocatori: OTTO.slice(0, n),
      coppia: COPPIA,
      casuale: dado(3),
    }).impostori.length

  prova('in quattro, uno', conta(4) === 1)
  prova('in sei, uno', conta(6) === 1)
  prova('in sette, due', conta(7) === 2)
  prova('in otto, due', conta(8) === 2)
  prova(
    'sotto il minimo non si parte',
    (() => {
      try {
        preparaPartita({ giocatori: ['a', 'b', 'c'], coppia: COPPIA })
        return false
      } catch {
        return true
      }
    })()
  )
}

console.log('\nnessuno sa di essere impostore per caso')
{
  // Su mille partite ognuno deve capitare impostore piu' o meno quanto
  // gli altri: un sorteggio storto darebbe sempre gli stessi.
  const volte = Object.fromEntries(OTTO.map((id) => [id, 0]))
  for (let i = 0; i < 1000; i++) {
    for (const id of preparaPartita({ giocatori: OTTO, coppia: COPPIA, casuale: dado(i) })
      .impostori) {
      volte[id] += 1
    }
  }
  const valori = Object.values(volte)
  const atteso = (1000 * 2) / 8
  prova(
    'il sorteggio non ha favoriti',
    valori.every((v) => Math.abs(v - atteso) < atteso * 0.35),
    volte
  )
}

console.log('\nil giro di parole')
{
  const partenza = { ordine: [...OTTO], turno: 0, giro: 1, giriTotali: 2 }

  prova('si comincia dal primo', diTurno(partenza) === OTTO[0])

  let s = partenza
  for (let i = 0; i < 7; i++) s = avanza({ ...s, casuale: dado(2) })
  prova('dopo sette "fatto" siamo all’ultimo', s.turno === 7 && s.giro === 1)
  prova('e la partita non e’ ancora al voto', s.stato === 'in-corso')

  s = avanza({ ...s, casuale: dado(2) })
  prova('l’ottavo apre il secondo giro', s.giro === 2 && s.turno === 0, s)
  prova(
    'e rimescola l’ordine',
    s.ordine.join() !== OTTO.join() && [...s.ordine].sort().join() === OTTO.join(),
    s.ordine
  )

  for (let i = 0; i < 7; i++) s = avanza({ ...s, casuale: dado(2) })
  prova('il secondo giro non finisce prima', s.stato === 'in-corso' && s.giro === 2)

  s = avanza({ ...s, casuale: dado(2) })
  prova('finiti i due giri si vota', s.stato === 'voto', s)

  prova(
    'nessuno parla due volte nello stesso giro',
    new Set(s.ordine).size === s.ordine.length
  )
}

console.log('\nquanto manca')
{
  prova(
    'a inizio partita mancano tutti i turni',
    quantiMancano({ ordine: OTTO, turno: 0, giro: 1, giriTotali: 2 }) === 16
  )
  prova(
    'all’ultimo turno ne manca uno',
    quantiMancano({ ordine: OTTO, turno: 7, giro: 2, giriTotali: 2 }) === 1
  )
}

console.log('\nle schede come arrivano dal database')
{
  // Il database salva il numero dell'opzione, non chi e' stato accusato.
  // E una scheda puo' portarne piu' di uno: con due impostori se ne
  // indicano due, altrimenti tocca sceglierne uno e sperare.
  const grezze = { c: 0, d: [0, 1], e: 1, f: 7 }
  const tradotte = schedePerId(grezze, OTTO)

  prova('un numero solo diventa un elenco di uno', tradotte.c.join() === 'a', tradotte)
  prova('un elenco diventa un elenco di persone', tradotte.d.join() === 'a,b', tradotte)
  prova('lo zero non si perde per strada', tradotte.c.includes('a'))
  prova('i numeri fuori elenco si buttano', !('x' in schedePerId({ x: 99 }, OTTO)))
  prova(
    'una scheda con soli numeri sbagliati sparisce',
    !('y' in schedePerId({ y: [99, 100] }, OTTO))
  )
  prova('senza schede non esplode', Object.keys(schedePerId(undefined, OTTO)).length === 0)
}

console.log('\nil voto, con un impostore solo')
{
  const impostori = ['a']
  const schede = schedePerId({ c: 0, d: 0, e: 1, f: 0 }, OTTO)
  const r = esito({ impostori, giocatori: OTTO, schede })

  prova('si accusa uno solo, il piu\u2019 votato', r.accusati.join() === 'a', r.accusati)
  prova('ed e\u2019 scoperto', r.scoperti.join() === 'a')
  prova('nessun impunito', r.impuniti.length === 0)
  prova('indovina chi l\u2019ha indicato', r.indovini.sort().join() === 'c,d,f', r.indovini)
}

console.log('\nil voto, con due impostori')
{
  const impostori = ['a', 'b']
  const schede = schedePerId(
    { c: [0, 1], d: [0, 1], e: [0, 2], f: [1, 2], g: [0, 1], h: [0, 1] },
    OTTO
  )
  const r = esito({ impostori, giocatori: OTTO, schede })

  prova('si accusano in due, quanti sono gli impostori', r.accusati.length === 2, r.accusati)
  prova('e sono quelli giusti', r.accusati.sort().join() === 'a,b')
  prova('scoperti tutti e due', r.scoperti.sort().join() === 'a,b')
  prova('nessuno la fa franca', r.impuniti.length === 0)
  prova(
    'ha indovinato chi ne ha indicato almeno uno vero',
    r.indovini.sort().join() === 'c,d,e,f,g,h',
    r.indovini
  )
}

{
  const impostori = ['a', 'b']
  const schede = schedePerId(
    { c: [0, 2], d: [0, 2], e: [0, 2], f: [0, 2], g: [0, 3], h: [0, 3] },
    OTTO
  )
  const r = esito({ impostori, giocatori: OTTO, schede })

  prova('ne becca uno e sbaglia l\u2019altro', r.accusati.sort().join() === 'a,c', r.accusati)
  prova('a e\u2019 scoperto', r.scoperti.join() === 'a')
  prova('b la fa franca', r.impuniti.join() === 'b')
  prova('ma chi ha indicato a ha comunque indovinato', r.indovini.length === 6)
}

{
  const impostori = ['a', 'b']
  const schede = schedePerId({ c: [2, 3], d: [2, 3], e: [2, 3], f: [3, 4] }, OTTO)
  const r = esito({ impostori, giocatori: OTTO, schede })
  prova('nessun impostore scoperto', r.scoperti.length === 0)
  prova('tutti e due impuniti', r.impuniti.sort().join() === 'a,b')
  prova('e nessun indovino', r.indovini.length === 0, r.indovini)
}

{
  const r = esito({ impostori: ['a'], giocatori: OTTO, schede: {} })
  prova('senza voti non si accusa nessuno', r.accusati.length === 0)
  prova('e l\u2019impostore la fa franca', r.impuniti.join() === 'a')
}

{
  // Gli impostori votano anche loro, ma non prendono mai il premio da
  // indovino: nemmeno indicando il complice.
  const impostori = ['a', 'b']
  const schede = schedePerId({ a: [1, 2], b: [0, 2], c: [0, 1] }, OTTO)
  const r = esito({ impostori, giocatori: OTTO, schede })
  prova('un impostore non indovina mai', !r.indovini.includes('a') && !r.indovini.includes('b'))
  prova('l\u2019innocente che li becca si', r.indovini.join() === 'c', r.indovini)
}


console.log('\ni punti')
{
  const impostori = ['a', 'b']
  // Tutti indicano solo 'a': scoperto lui, 'b' la fa franca.
  const schede = schedePerId({ c: 0, d: 0, e: 0, f: 0, g: 0, h: 0 }, OTTO)
  const p = premi({ impostori, giocatori: OTTO, schede })

  const perMembro = {}
  for (const a of p.assegnazioni) perMembro[a.membroId] = (perMembro[a.membroId] ?? 0) + a.punti

  prova(
    'l’impunito prende i punti della sua Legge',
    perMembro.b === PER_ID['impostore-impunito'].punti,
    perMembro
  )
  prova('lo scoperto non prende niente', !('a' in perMembro))
  prova(
    'chi ha indovinato prende i punti della sua',
    ['c', 'd', 'e', 'f', 'g', 'h'].every((id) => perMembro[id] === PER_ID['smascheratore'].punti),
    perMembro
  )
  prova(
    'ogni punto cita la Legge da cui viene',
    p.assegnazioni.every((a) => PER_ID[a.leggeId]),
    p.assegnazioni.map((a) => a.leggeId)
  )
  prova(
    'nessuno viene pagato due volte',
    p.assegnazioni.length === new Set(p.assegnazioni.map((a) => a.membroId + a.leggeId)).size
  )
}

console.log('\nrivelare prima che abbiano votato tutti')
{
  const partita = { giocatori: OTTO }

  prova('quando hanno votato tutti non c’è niente da chiedere',
    tuttiHannoVotato(partita, OTTO))
  prova('se ne manca uno, no', !tuttiHannoVotato(partita, OTTO.slice(0, 7)))
  prova('e a partita vuota nemmeno', !tuttiHannoVotato({ giocatori: [] }, []))

  prova('in otto serve che lo chiedano in cinque', quantiPerRivelare(8) === 5)
  prova('in sette in quattro', quantiPerRivelare(7) === 4)
  prova('in quattro in tre', quantiPerRivelare(4) === 3)
  prova('sempre piu’ della meta’', [4, 5, 6, 7, 8, 9, 10].every((n) => quantiPerRivelare(n) > n / 2))

  prova('uno solo non basta mai', !bastaPerRivelare(partita, ['a']))
  prova('quattro su otto nemmeno: e’ meta’, non piu’ della meta’',
    !bastaPerRivelare(partita, ['a', 'b', 'c', 'd']))
  prova('cinque su otto bastano', bastaPerRivelare(partita, ['a', 'b', 'c', 'd', 'e']))
  prova('e senza nessuna richiesta no', !bastaPerRivelare(partita, []))
}

console.log('\nle coppie di parole')
{
  prova('ce ne sono almeno cento', COPPIE.length >= 100, COPPIE.length)
  prova(
    'sono tutte coppie di due parole vere',
    COPPIE.every((c) => c.length === 2 && c[0]?.trim() && c[1]?.trim())
  )
  prova(
    'le due parole di una coppia sono diverse',
    COPPIE.every(([a, b]) => a.toLowerCase() !== b.toLowerCase())
  )
  const doppie = COPPIE.map(([a]) => a.toLowerCase()).filter((a, i, t) => t.indexOf(a) !== i)
  prova('nessuna parola del gruppo ripetuta', doppie.length === 0, doppie)
  prova('i giri di default sono due', IMPOSTORE.giriTotali === 2)
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} prove fallite.\n`)
process.exit(falliti === 0 ? 0 : 1)

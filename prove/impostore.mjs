// L'Impostore. Da qui escono punti e soprattutto segreti: se le parole
// finiscono nella persona sbagliata la partita e' rovinata e nessuno se
// ne accorge finche' non e' tardi.

import {
  avanza,
  diTurno,
  esito,
  preparaPartita,
  premi,
  quantiMancano,
  quantiPerRivelare,
  stessaParola,
  chiPuoTentare,
  bastaPerRivelare,
  vivi,
  impostoriVivi,
  innocentiVivi,
  eFuori,
  impostoriInMaggioranza,
  dopoAccusa,
  bastaPerCominciare,
  maggioranza,
  sceltaVincente,
  tuttiHannoVotato,
  schedePerId,
  puoAvanzare,
  secondiDelTestimone,
  raccontaFinale,
  conteggioAffidabile,
  ALTRO_GIRO,
  opzioniDelVoto,
  siRiparte,
  quantiVoglionoUnAltroGiro,
} from '../src/lib/impostore.js'
import { readFileSync } from 'node:fs'
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

  // ⚠️ Finito il giro si vota, sempre. Quanti giri fare non lo decide
  // piu' un numero scelto a partita non ancora cominciata: lo decide il
  // gruppo nel voto, dove "un altro giro" e' una delle risposte.
  s = avanza({ ...s, casuale: dado(2) })
  prova('l’ottavo manda al voto', s.stato === 'voto', s)
  prova('e il giro resta quello', s.giro === 1)

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

console.log('\ndopo un’eliminazione i conti stanno sui vivi')
{
  // 'a' e' stato eliminato: restano in sette.
  const dopo = { giocatori: OTTO, fuori: ['a'] }
  const sette = OTTO.slice(1)

  // Col conto sugli otto di partenza questa restava falsa per sempre, e
  // la schermata diceva "manca ancora qualcuno" aspettando il voto di
  // chi era gia' uscito.
  prova('votano tutti e sette: e’ tutti', tuttiHannoVotato(dopo, sette))
  prova('se ne manca uno dei sette, no', !tuttiHannoVotato(dopo, sette.slice(0, 6)))
  prova(
    'il voto di chi e’ uscito non completa il conto',
    !tuttiHannoVotato(dopo, ['a', ...sette.slice(0, 6)])
  )

  // La soglia scende con i vivi: in sette bastano quattro, non cinque.
  prova('in sette bastano quattro richieste', bastaPerRivelare(dopo, sette.slice(0, 4)))
  prova('tre non bastano', !bastaPerRivelare(dopo, sette.slice(0, 3)))
  prova(
    'le richieste di chi e’ uscito non contano',
    !bastaPerRivelare(dopo, ['a', ...sette.slice(0, 3)])
  )

  // Due eliminati: in sei ne servono quattro.
  const dueFuori = { giocatori: OTTO, fuori: ['a', 'b'] }
  const sei = OTTO.slice(2)
  prova('in sei ne servono quattro', bastaPerRivelare(dueFuori, sei.slice(0, 4)))
  prova('tre su sei no: e’ meta’', !bastaPerRivelare(dueFuori, sei.slice(0, 3)))
  prova('e votano tutti e sei', tuttiHannoVotato(dueFuori, sei))
}

console.log('\nil colpo di coda: la parola indovinata')
{
  prova('uguale e uguale', stessaParola('Mare', 'Mare'))
  prova('le maiuscole non contano', stessaParola('MARE', 'mare'))
  prova('gli spazi ai lati nemmeno', stessaParola('  mare  ', 'mare'))
  prova('gli accenti nemmeno', stessaParola('caffe', 'caff\u00e8'))
  prova('e nemmeno al contrario', stessaParola('Caff\u00c8', 'caffe'))
  prova('l\u2019apostrofo storto vale come quello dritto', stessaParola("S\u2019oru", "s'oru"))
  prova('due spazi in mezzo valgono per uno', stessaParola('pane  carasau', 'pane carasau'))

  prova('parole diverse restano diverse', !stessaParola('mare', 'lago'))
  prova('una parola dentro l\u2019altra non basta', !stessaParola('mar', 'mare'))
  prova('il vuoto non indovina niente', !stessaParola('', ''))
  prova('nemmeno gli spazi soli', !stessaParola('   ', 'mare'))
  prova('e nemmeno il nulla', !stessaParola(null, 'mare') && !stessaParola(undefined, 'mare'))
}

console.log('\nchi puo\u2019 tentare il colpo')
{
  const impostori = ['a', 'b']
  const schede = schedePerId({ c: [0, 2], d: [0, 2], e: [0, 2], f: [0, 2] }, OTTO)

  const puo = chiPuoTentare({ impostori, giocatori: OTTO, schede })
  prova('solo chi e\u2019 stato beccato', puo.join() === 'a', puo)
  prova('chi l\u2019ha fatta franca non tenta: ha gia\u2019 vinto', !puo.includes('b'))
  prova(
    'se non becchi nessuno non tenta nessuno',
    chiPuoTentare({ impostori, giocatori: OTTO, schede: {} }).length === 0
  )
}

console.log('\ni punti quando il colpo riesce')
{
  const impostori = ['a', 'b']
  const schede = schedePerId({ c: [0, 2], d: [0, 2], e: [0, 2], f: [0, 2] }, OTTO)

  const perso = premi({ impostori, giocatori: OTTO, schede })
  const vinto = premi({ impostori, giocatori: OTTO, schede, colpoRiuscito: true })

  const somma = (p) => {
    const per = {}
    for (const a of p.assegnazioni) per[a.membroId] = (per[a.membroId] ?? 0) + a.punti
    return per
  }

  prova(
    'senza colpo: b impunito, e chi ha beccato prende il suo',
    somma(perso).b > 0 && somma(perso).c > 0,
    somma(perso)
  )
  prova('col colpo riuscito pagano tutti e due gli impostori', somma(vinto).a > 0 && somma(vinto).b > 0, somma(vinto))
  prova(
    'e chi li aveva beccati non prende piu\u2019 niente',
    somma(vinto).c === undefined && somma(vinto).d === undefined,
    somma(vinto)
  )
  prova('il colpo si porta dietro la sua bandierina', vinto.colpoRiuscito === true)
  prova('e senza colpo resta abbassata', perso.colpoRiuscito === false)
  prova(
    'nessuno viene pagato due volte nemmeno col colpo',
    vinto.assegnazioni.length ===
      new Set(vinto.assegnazioni.map((a) => a.membroId + a.leggeId)).size
  )
}

console.log('\nil voto d\u2019apertura: quando si parte')
{
  prova('in sette bastano quattro voti', bastaPerCominciare(4, 7))
  prova('tre no', !bastaPerCominciare(3, 7))
  prova('in otto ne servono cinque', bastaPerCominciare(5, 8) && !bastaPerCominciare(4, 8))
  prova('in quattro ne servono tre', bastaPerCominciare(3, 4) && !bastaPerCominciare(2, 4))
  prova('e votando tutti si parte comunque', bastaPerCominciare(7, 7))
  prova('senza giocatori non si parte', !bastaPerCominciare(0, 0))
  prova(
    'la soglia e\u2019 la stessa che serve per rivelare',
    [4, 5, 6, 7, 8].every((n) => maggioranza(n) === quantiPerRivelare(n))
  )
}

console.log('\nil voto d\u2019apertura: cosa ha vinto')
{
  const scelte = [1, 2]

  prova('vince chi ha piu\u2019 voti', sceltaVincente([1, 3], scelte, 2) === 2)
  prova('anche se e\u2019 il meno consigliato', sceltaVincente([3, 1], scelte, 2) === 1)
  prova('a parita\u2019 vince la consigliata', sceltaVincente([2, 2], scelte, 2) === 2)
  prova('e se la consigliata e\u2019 l\u2019altra, vince quella', sceltaVincente([2, 2], scelte, 1) === 1)
  prova('senza nemmeno un voto si prende la consigliata', sceltaVincente([0, 0], scelte, 2) === 2)

  // Due telefoni che chiudono il voto nello stesso istante devono far
  // partire la stessa partita: la regola dev'essere sempre la stessa.
  const a = sceltaVincente([2, 2], scelte, 2)
  const b = sceltaVincente([2, 2], scelte, 2)
  prova('e la risposta non cambia fra una chiamata e l\u2019altra', a === b)
}

console.log('\nchi e\u2019 dentro e chi e\u2019 fuori')
{
  const p = { giocatori: OTTO, impostori: ['a', 'b'], fuori: ['c', 'a'] }

  prova('i vivi sono quelli non usciti', vivi(p).join() === 'b,d,e,f,g,h', vivi(p))
  prova('un impostore uscito non e\u2019 piu\u2019 vivo', impostoriVivi(p).join() === 'b')
  prova('gli innocenti vivi non contano gli impostori', innocentiVivi(p).join() === 'd,e,f,g,h')
  prova('eFuori dice chi e\u2019 uscito', eFuori(p, 'c') && !eFuori(p, 'd'))
  prova('senza il campo fuori sono tutti dentro', vivi({ giocatori: OTTO, impostori: [] }).length === 8)
}

console.log('\nquando gli impostori vincono per numeri')
{
  const con = (fuori) => impostoriInMaggioranza({ giocatori: OTTO, impostori: ['a', 'b'], fuori })

  prova('in otto con due impostori, no', !con([]))
  prova('tolti due innocenti (2 contro 4), ancora no', !con(['c', 'd']))
  prova('tolti tre (2 contro 3), ancora no', !con(['c', 'd', 'e']))
  prova('tolti quattro: due contro due, hanno vinto', con(['c', 'd', 'e', 'f']))
  prova('se gli impostori sono fuori non vincono mai', !con(['a', 'b']))
  // Con un impostore solo servono uno contro uno: uno contro due non
  // basta, perche' in due lo votano ancora.
  prova(
    'un impostore contro due innocenti non ha ancora vinto',
    !impostoriInMaggioranza({ giocatori: OTTO, impostori: ['a'], fuori: ['c', 'd', 'e', 'f', 'g'] })
  )
  prova(
    'uno contro uno si',
    impostoriInMaggioranza({ giocatori: OTTO, impostori: ['a'], fuori: ['c', 'd', 'e', 'f', 'g', 'h'] })
  )
}

console.log('\ncosa succede dopo un\u2019accusa')
{
  const base = { giocatori: OTTO, impostori: ['a', 'b'], fuori: [] }
  const fisso = () => 0.5

  {
    // Il gruppo li becca tutti e due: si va al colpo di coda.
    const schede = schedePerId({ c: [0, 1], d: [0, 1], e: [0, 1] }, OTTO)
    const r = dopoAccusa(base, schede, fisso)
    prova('beccati entrambi, si va al colpo', r.stato === 'colpo', r)
    prova('e sono segnati come scoperti', r.scopertiOra.sort().join() === 'a,b')
    prova('nessun innocente eliminato', r.eliminatiOra.length === 0)
    prova('ha vinto il gruppo', r.vincitore === 'gruppo')
    prova('e sono usciti tutti e due', r.fuori.sort().join() === 'a,b')
  }

  {
    // Sbagliano entrambe le accuse: due innocenti fuori, si continua.
    const schede = schedePerId({ c: [3, 4], f: [3, 4], g: [3, 4] }, OTTO)
    const r = dopoAccusa(base, schede, fisso)
    prova('sbagliando si continua', r.stato === 'in-corso', r)
    prova('escono i due innocenti accusati', r.eliminatiOra.sort().join() === 'd,e')
    prova('nessuno scoperto', r.scopertiOra.length === 0)
    prova('nessun vincitore ancora', r.vincitore === null)
    prova('si riparte dal primo di turno', r.turno === 0)
    prova('e il giro sale invece di azzerarsi', r.giro === (base.giro ?? 1) + 1)
    prova('e i morti non sono nell\u2019ordine', !r.ordine.includes('d') && !r.ordine.includes('e'))
    prova('ma i vivi ci sono tutti', r.ordine.length === 6)
  }

  {
    // Ne beccano uno e sbagliano l'altro: si continua a tre contro uno.
    const schede = schedePerId({ c: [0, 3], f: [0, 3], g: [0, 3] }, OTTO)
    const r = dopoAccusa(base, schede, fisso)
    prova('uno beccato e uno sbagliato: si continua', r.stato === 'in-corso', r)
    prova('a e\u2019 scoperto', r.scopertiOra.join() === 'a')
    prova('d e\u2019 eliminato', r.eliminatiOra.join() === 'd')
  }

  {
    // Gia' ridotti all'osso: un altro errore e gli impostori vincono.
    const quasi = { giocatori: OTTO, impostori: ['a', 'b'], fuori: ['c', 'd'] }
    const schede = schedePerId({ e: [4, 5], f: [4, 5], g: [4, 5] }, ['a','b','c','d','e','f','g','h'])
    const r = dopoAccusa(quasi, schede, fisso)
    prova('sbagliando ancora, vincono gli impostori', r.vincitore === 'impostori', r)
    prova('e la partita finisce', r.stato === 'finita')
  }

  {
    // Nessuno vota: non esce nessuno e si continua.
    const r = dopoAccusa(base, {}, fisso)
    prova('senza voti non esce nessuno', r.fuori.length === 0, r)
    prova('e si continua', r.stato === 'in-corso')
  }

  {
    // Chi e' gia' fuori non si vota e non rientra.
    const dopoUnGiro = { giocatori: OTTO, impostori: ['a', 'b'], fuori: ['d'] }
    const schede = schedePerId({ c: ['e', 'f'] }, OTTO)
    const r = dopoAccusa(dopoUnGiro, schede, fisso)
    prova('chi era gia\u2019 fuori resta fuori', r.fuori.includes('d'))
    prova('e non compare due volte', r.fuori.filter((x) => x === 'd').length === 1, r.fuori)
  }
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
  // Non c'e' piu' un numero di giri deciso prima: si parte da uno e il
  // gruppo decide a ogni fine giro se ne serve un altro.
  prova('si parte da un giro', IMPOSTORE.giriTotali === 1)
  prova('e i giri non si votano piu’ all’apertura', IMPOSTORE.scelteGiri === undefined)
}


console.log('Il testimone: trenta secondi in cui il turno lo passa solo chi parla')
{
  const base = {
    ordine: ['a', 'b', 'c', 'd'],
    turno: 1,          // parla b
    giro: 1,
    giriTotali: 2,
    stato: 'in-corso',
  }
  const t0 = Date.parse('2026-08-14T21:00:00Z')
  const fra = (secondi) => ({ ...base, turnoDa: new Date(t0).toISOString() })
  const adesso = (secondi) => t0 + secondi * 1000

  const p = fra()
  prova('chi parla passa subito', puoAvanzare(p, 'b', adesso(0)))
  prova('gli altri no, all’istante zero', !puoAvanzare(p, 'a', adesso(0)))
  prova('gli altri no, a dieci secondi', !puoAvanzare(p, 'c', adesso(10)))
  prova('gli altri no, a ventinove', !puoAvanzare(p, 'd', adesso(29)))
  prova('a trenta si sblocca per tutti', puoAvanzare(p, 'a', adesso(30)))
  prova('e resta sbloccato dopo', puoAvanzare(p, 'a', adesso(300)))

  prova('il conto alla rovescia parte da trenta', secondiDelTestimone(p, adesso(0)) === 30)
  prova('a dieci secondi ne restano venti', secondiDelTestimone(p, adesso(10)) === 20)
  prova('non va mai sotto zero', secondiDelTestimone(p, adesso(999)) === 0)

  // Una partita vecchia, senza la colonna: non deve bloccare niente.
  const senzaColonna = { ...base }
  prova('senza turnoDa non blocca nessuno', puoAvanzare(senzaColonna, 'a', adesso(0)))
  prova('e non mostra nessun conto', secondiDelTestimone(senzaColonna, adesso(0)) === 0)

  // Una data storta non deve rompere la schermata.
  const storta = { ...base, turnoDa: 'non una data' }
  prova('una data illeggibile non blocca', puoAvanzare(storta, 'a', adesso(0)))
}


console.log('Come e finita: una risposta sola per tutta l app')
{
  const G = ['a', 'b', 'c', 'd']
  const IMP = ['a']
  // b, c e d accusano a: l impostore e beccato
  const beccato = { b: ['a'], c: ['a'], d: ['a'] }
  // nessuno lo accusa: l ha fatta franca
  const franca = { b: ['c'], c: ['b'], d: ['b'] }

  const f = (schede, extra) =>
    raccontaFinale({ impostori: IMP, giocatori: G, schede, parolaGruppo: 'Scoglio', ...extra })

  const preso = f(beccato, { fuori: ['a'] })
  prova('beccato: titolo giusto', preso.titolo === 'Beccato')
  prova('beccato: vince il gruppo', preso.vincitore === 'gruppo')
  prova('beccato: chi ha indovinato viene pagato', preso.premiati.length === 3)

  const scampato = f(franca, {})
  prova('franca: titolo giusto', scampato.titolo === 'L’ha fatta franca')
  prova('franca: vincono gli impostori', scampato.vincitore === 'impostori')

  // ⚠️ il caso che era rotto in due schermate su tre
  const ribaltata = f(beccato, { fuori: ['a'], tentativo: 'Scoglio' })
  prova('ribaltata: titolo giusto', ribaltata.titolo === 'Ribaltata all’ultimo')
  prova('ribaltata: vincono gli impostori', ribaltata.vincitore === 'impostori')
  prova('ribaltata: NESSUNO viene pagato per aver indovinato', ribaltata.premiati.length === 0)
  prova('ribaltata: ma si sa chi ci era arrivato', ribaltata.indovini.length === 3)
  prova('ribaltata: il colpo risulta riuscito', ribaltata.colpoRiuscito === true)

  // il tentativo sbagliato non ribalta niente
  const fallito = f(beccato, { fuori: ['a'], tentativo: 'Sasso' })
  prova('tentativo sbagliato: resta beccato', fallito.titolo === 'Beccato')
  prova('tentativo sbagliato: i punti restano a chi ha indovinato', fallito.premiati.length === 3)

  // accenti e maiuscole non devono far perdere un colpo giusto
  const conAccento = raccontaFinale({
    impostori: IMP, giocatori: G, schede: beccato, fuori: ['a'],
    parolaGruppo: 'Caffè', tentativo: 'caffe',
  })
  prova('la parola giusta scritta senza accento vale', conAccento.colpoRiuscito === true)

  // Vittoria per numeri: il gruppo ha eliminato tanti innocenti da
  // lasciare gli impostori in maggioranza. Uno contro uno basta.
  const perNumeri = raccontaFinale({
    impostori: ['a'], giocatori: ['a', 'b', 'c', 'd'], schede: { b: ['c'] },
    fuori: ['b', 'c'], parolaGruppo: 'Scoglio',
  })
  prova('per numeri: titolo giusto', perNumeri.titolo === 'Vi hanno fatti fuori')
  prova('per numeri: vincono gli impostori', perNumeri.vincitore === 'impostori')

  // ⚠️ Passare inosservati NON e' vincere per numeri: sono due finali
  // diversi e vanno raccontati diversi.
  const inosservato = raccontaFinale({
    impostori: ['a'], giocatori: ['a', 'b', 'c', 'd'], schede: { b: ['c'], c: ['b'] },
    fuori: [], parolaGruppo: 'Scoglio',
  })
  prova('inosservato non e’ per numeri', inosservato.titolo === 'L’ha fatta franca')

  // il risultato deve combaciare con quello che paga premi()
  const p1 = premi({ impostori: IMP, giocatori: G, schede: beccato, colpoRiuscito: true })
  prova(
    'quello che si racconta e quello che si paga coincidono',
    p1.assegnazioni.every((x) => x.leggeId === 'impostore-impunito') &&
      ribaltata.premiati.length === 0
  )
}


console.log('Il conteggio deve aver raggiunto i votanti prima di partire')
{
  prova('sei voti contati, sei votanti: si parte', conteggioAffidabile([0, 6], 6))
  prova('quattro e quattro: si parte', conteggioAffidabile([1, 3], 4))

  // ⚠️ Il buco vero: questo telefono sa che hanno votato in quattro ma
  // i numeri non gli sono ancora arrivati.
  prova('quattro votanti, conteggi a zero: si aspetta', !conteggioAffidabile([0, 0], 4))
  prova('quattro votanti, ne risultano due: si aspetta', !conteggioAffidabile([1, 1], 4))
  prova('conteggi mancanti: si aspetta', !conteggioAffidabile(undefined, 4))
  prova('nessuno ha votato: si aspetta', !conteggioAffidabile([0, 0], 0))

  // E questo e' il danno che evita: senza massimo, si ripiega sul
  // consigliato e la scelta del gruppo sparisce.
  prova(
    'con i conteggi a zero sceltaVincente ripiega sul consigliato',
    sceltaVincente([0, 0], [1, 2], 1) === 1
  )
  prova(
    'coi conteggi veri vince quello che ha votato il gruppo',
    sceltaVincente([0, 6], [1, 2], 1) === 2
  )
}


console.log('Il conteggio deve aver raggiunto i votanti prima di partire')
{
  prova('sei voti contati, sei votanti: si parte', conteggioAffidabile([0, 6], 6))
  prova('quattro e quattro: si parte', conteggioAffidabile([1, 3], 4))

  // ⚠️ Il buco vero: questo telefono sa che hanno votato in quattro ma
  // i numeri non gli sono ancora arrivati.
  prova('quattro votanti, conteggi a zero: si aspetta', !conteggioAffidabile([0, 0], 4))
  prova('quattro votanti, ne risultano due: si aspetta', !conteggioAffidabile([1, 1], 4))
  prova('conteggi mancanti: si aspetta', !conteggioAffidabile(undefined, 4))
  prova('nessuno ha votato: si aspetta', !conteggioAffidabile([0, 0], 0))

  // E questo e' il danno che evita: senza massimo, si ripiega sul
  // consigliato e la scelta del gruppo sparisce.
  prova(
    'con i conteggi a zero sceltaVincente ripiega sul consigliato',
    sceltaVincente([0, 0], [1, 2], 1) === 1
  )
  prova(
    'coi conteggi veri vince quello che ha votato il gruppo',
    sceltaVincente([0, 6], [1, 2], 1) === 2
  )
}




console.log('Un altro giro: si vota insieme all accusa')
{
  const P = {
    impostori: ['a'],
    giocatori: ['a', 'b', 'c', 'd'],
    fuori: [],
    ordine: ['a', 'b', 'c', 'd'],
    turno: 3,
    giro: 1,
    giriTotali: 1,
  }

  prova('fra le opzioni c e anche un altro giro', opzioniDelVoto(P).includes(ALTRO_GIRO))
  prova('e le persone sono quelle vive', opzioniDelVoto(P).length === 5)

  // Tre su quattro non ne sanno abbastanza: si riparte.
  const ancora = { b: [ALTRO_GIRO], c: [ALTRO_GIRO], d: ['a'] }
  prova('tre chiedono ancora, uno accusa: si riparte', siRiparte(P, ancora))
  const r1 = dopoAccusa(P, ancora, () => 0.5)
  prova('nessuno esce', r1.fuori.length === 0)
  prova('si torna a parlare', r1.stato === 'in-corso')
  prova('e il giro sale', r1.giro === 2)
  prova('con l ordine rimescolato', r1.ordine.length === 4)

  // Due accusano lo stesso e due chiedono ancora: a parita si accusa,
  // perche in caso di dubbio il gioco deve andare avanti.
  const pari = { b: ['a'], c: ['a'], d: [ALTRO_GIRO], a: [ALTRO_GIRO] }
  prova('a parita si accusa', !siRiparte(P, pari))
  prova('e infatti qualcuno esce', dopoAccusa(P, pari, () => 0.5).fuori.length > 0)

  // Nessuno lo chiede: il voto e un accusa normale.
  const normale = { b: ['a'], c: ['a'], d: ['a'] }
  prova('senza richieste si accusa', !siRiparte(P, normale))
  prova('e l impostore viene scoperto', dopoAccusa(P, normale, () => 0.5).scopertiOra.length === 1)

  // Uno solo lo chiede contro due accuse: non basta.
  const uno = { b: ['a'], c: ['a'], d: [ALTRO_GIRO] }
  prova('uno solo non ferma il gruppo', !siRiparte(P, uno))

  prova('quanti lo chiedono si contano', quantiVoglionoUnAltroGiro(ancora) === 2)
  prova('e senza schede sono zero', quantiVoglionoUnAltroGiro(undefined) === 0)

  // Finito il giro si va sempre al voto: non c e piu un numero di giri.
  prova('il giro finisce sempre col voto', avanza({ ...P }).stato === 'voto')
  prova('a meta giro no', avanza({ ...P, turno: 1 }).stato === 'in-corso')
}


console.log('I difetti trovati dalla caccia, uno per uno')
{
  const SEI = ['a', 'b', 'c', 'd', 'e', 'f']

  // ── 1. L impostore beccato al primo giro non e un impunito ──
  // Due impostori, a beccato al primo giro. Nel secondo voto a non e
  // nemmeno fra le opzioni, quindi prende zero voti: prima finiva fra
  // gli impuniti, si prendeva i 5 punti di chi l ha fatta franca, e il
  // finale diceva "L ha fatta franca" su una partita vinta dal gruppo.
  {
    const schedeSecondoGiro = { c: ['b'], d: ['b'], e: ['b'] }
    const r = esito({
      impostori: ['a', 'b'], giocatori: SEI, schede: schedeSecondoGiro, fuori: ['a'],
    })
    prova('chi era gia fuori risulta scoperto', r.scoperti.sort().join() === 'a,b')
    prova('e nessuno resta impunito', r.impuniti.length === 0)

    const f = raccontaFinale({
      impostori: ['a', 'b'], giocatori: SEI, schede: schedeSecondoGiro,
      fuori: ['a', 'b'], parolaGruppo: 'Mare',
    })
    prova('il finale dice Beccato, non L ha fatta franca', f.titolo === 'Beccato')
    prova('e ha vinto il gruppo', f.vincitore === 'gruppo')

    const pagati = premi({
      impostori: ['a', 'b'], giocatori: SEI, schede: schedeSecondoGiro, fuori: ['a', 'b'],
    })
    prova(
      'nessun impostore viene pagato come impunito',
      !pagati.assegnazioni.some((x) => x.leggeId === 'impostore-impunito')
    )
    prova(
      'e chi ha indovinato prende il suo',
      pagati.assegnazioni.filter((x) => x.leggeId === 'smascheratore').length === 3
    )
  }

  // ── 2. Un voto sparpagliato non manda fuori mezza tavolata ──
  {
    // In quattro, voti in cerchio: tutti a un voto. Prima uscivano
    // TUTTI E QUATTRO e la partita saltava al colpo con zero vivi.
    const QUATTRO = ['a', 'b', 'c', 'd']
    const cerchio = { a: ['b'], b: ['c'], c: ['d'], d: ['a'] }
    const r = esito({ impostori: ['a'], giocatori: QUATTRO, schede: cerchio })
    prova('coi voti in cerchio non esce nessuno', r.accusati.length === 0)
    prova('e si sa perche', r.troppiPari === true)

    const partita = {
      impostori: ['a'], giocatori: QUATTRO, fuori: [],
      ordine: QUATTRO, turno: 3, giro: 1, giriTotali: 1,
    }
    const d = dopoAccusa(partita, cerchio, () => 0.5)
    prova('la partita riparte invece di svuotarsi', d.stato === 'in-corso')
    prova('e restano vivi tutti e quattro', d.fuori.length === 0)
    prova('col motivo scritto', d.motivo === 'pari')

    // In sei con due impostori: a=4, c=2, d=2, e=2 — quattro a soglia
    // per due posti. Prima uscivano in quattro.
    const sparpagliato = {
      a: ['c', 'd'], b: ['c', 'd'], c: ['a', 'e'], d: ['a', 'e'], e: ['a', 'f'], f: ['a', 'b'],
    }
    const r2 = esito({ impostori: ['a', 'b'], giocatori: SEI, schede: sparpagliato })
    prova('quattro a soglia per due posti: non esce nessuno', r2.accusati.length === 0)
  }

  // ── 3. Il tetto usa gli impostori VIVI, non quanti erano ──
  {
    // Due impostori, uno gia' fuori: si accusa UNA persona sola.
    const schede = { c: ['b'], d: ['b'], e: ['f'] }
    const r = esito({ impostori: ['a', 'b'], giocatori: SEI, schede, fuori: ['a'] })
    prova('con un impostore vivo si accusa uno solo', r.accusati.length === 1)
    prova('ed e il piu votato', r.accusati[0] === 'b')
  }

  // ── 4. Un accusa normale continua a funzionare ──
  {
    const schede = { b: ['a'], c: ['a'], d: ['a'], e: ['f'] }
    const r = esito({ impostori: ['a'], giocatori: SEI, schede })
    prova('il piu votato esce', r.accusati.join() === 'a')
    prova('senza pareggi sospetti', r.troppiPari === false)
    prova('ed e scoperto', r.scoperti.join() === 'a')
  }
}

// ─────────────────────────────────────────────────────────────────────
// Chi ha indovinato in un giro precedente viene pagato lo stesso
//
// La Legge XXIV dice "hai votato l'impostore giusto", non "eri dalla
// parte giusta all'ultimo giro". Guardando solo le schede dell'ultimo
// voto, chi aveva riconosciuto l'impostore al primo giro non prendeva
// niente: quel voto non compare piu' da nessuna parte in quel conto. Con
// due impostori, beccarli in due giri diversi e' il modo normale in cui
// il gruppo vince, quindi non era un caso limite.
console.log('\nGli indovini dei giri precedenti')
{
  const OTTO = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  const IMPOSTORI = ['a', 'b']

  // Giro 1: c e d riconoscono a, che esce. e guarda altrove.
  const giro1 = { c: ['a'], d: ['a'], e: ['f'], g: ['f'] }
  // Giro 3: a e' gia' fuori, si vota fra i superstiti. Adesso e' g a
  // beccare b, e c vota male.
  const giro3 = { c: ['h'], d: ['b'], g: ['b'] }

  const soloUltimo = esito({
    impostori: IMPOSTORI,
    giocatori: OTTO,
    schede: giro3,
    fuori: ['a'],
  })
  prova(
    'col solo ultimo giro, chi aveva beccato al primo non risulta',
    !soloUltimo.indovini.includes('c'),
    { indovini: soloUltimo.indovini }
  )

  const tutti = esito({
    impostori: IMPOSTORI,
    giocatori: OTTO,
    schede: giro3,
    fuori: ['a'],
    schedeDeiGiri: [giro1, giro3],
  })
  prova('con tutti i giri, c c e', tutti.indovini.includes('c'))
  prova('e anche d, che ne ha beccati due', tutti.indovini.includes('d'))
  prova('e g, che ha beccato solo al terzo', tutti.indovini.includes('g'))
  prova('chi non ne ha mai beccato uno resta fuori', !tutti.indovini.includes('e'))
  prova('sono tre in tutto', tutti.indovini.length === 3, { indovini: tutti.indovini })
  prova(
    'nessuno compare due volte anche se ha indovinato in due giri',
    new Set(tutti.indovini).size === tutti.indovini.length
  )

  prova(
    "l'ordine non dipende da come arrivano i giri",
    esito({
      impostori: IMPOSTORI,
      giocatori: OTTO,
      schede: giro3,
      fuori: ['a'],
      schedeDeiGiri: [giro3, giro1],
    }).indovini.join() === tutti.indovini.join()
  )
  prova(
    "passare l'ultimo giro anche dentro l'elenco non cambia niente",
    esito({
      impostori: IMPOSTORI,
      giocatori: OTTO,
      schede: giro3,
      fuori: ['a'],
      schedeDeiGiri: [giro1],
    }).indovini.join() === tutti.indovini.join()
  )

  // Il conto delle accuse resta quello dell'ULTIMO giro: i giri
  // precedenti dicono chi aveva capito, non chi esce adesso.
  prova('i conteggi restano quelli dell ultimo giro', tutti.conteggi.b === 2, {
    conteggi: tutti.conteggi,
  })
  prova('e chi era gia uscito non torna in ballo', tutti.conteggi.a === 0)

  // I punti.
  const p = premi({
    impostori: IMPOSTORI,
    giocatori: OTTO,
    schede: giro3,
    fuori: ['a'],
    schedeDeiGiri: [giro1, giro3],
  })
  const smascheratore = PER_ID['smascheratore']
  const pagati = p.assegnazioni.filter((x) => x.leggeId === smascheratore.id).map((x) => x.membroId)
  prova('vengono pagati tutti e tre gli indovini', pagati.length === 3, { pagati })
  prova('c compreso, che aveva beccato al primo giro', pagati.includes('c'))
  prova(
    'una assegnazione a testa: la Legge non si prende due volte',
    new Set(pagati).size === pagati.length
  )
  prova(
    'e nessun impostore risulta impunito, visto che sono usciti tutti e due',
    p.assegnazioni.every((x) => x.leggeId !== PER_ID['impostore-impunito'].id),
    { assegnazioni: p.assegnazioni }
  )

  // Il colpo di coda continua a cancellare tutto, giri vecchi compresi:
  // era il rischio vero di pagare piu' gente.
  const ribaltata = premi({
    impostori: IMPOSTORI,
    giocatori: OTTO,
    schede: giro3,
    fuori: ['a'],
    schedeDeiGiri: [giro1, giro3],
    colpoRiuscito: true,
  })
  prova(
    'col colpo riuscito non viene pagato nessun indovino, nemmeno dei giri vecchi',
    ribaltata.assegnazioni.every((x) => x.leggeId !== smascheratore.id),
    { assegnazioni: ribaltata.assegnazioni }
  )
  prova(
    'e pagano invece tutti e due gli impostori',
    ribaltata.assegnazioni.filter((x) => x.leggeId === PER_ID['impostore-impunito'].id).length === 2
  )

  // ⚠️ Quello che si racconta e quello che si paga devono coincidere: e'
  // il motivo per cui raccontaFinale esiste.
  const f = raccontaFinale({
    impostori: IMPOSTORI,
    giocatori: OTTO,
    schede: giro3,
    fuori: ['a'],
    schedeDeiGiri: [giro1, giro3],
  })
  prova('il finale annuncia gli stessi tre', f.premiati.join() === pagati.sort().join(), {
    premiati: f.premiati,
    pagati,
  })
  prova('ha vinto il gruppo', f.vincitore === 'gruppo')
  prova('e li dichiara beccati tutti e due', f.scoperti.length === 2)

  const fRibaltata = raccontaFinale({
    impostori: IMPOSTORI,
    giocatori: OTTO,
    schede: giro3,
    fuori: ['a'],
    schedeDeiGiri: [giro1, giro3],
    tentativo: 'la parola',
    parolaGruppo: 'La Parola',
  })
  prova('ribaltata: non annuncia nessun premiato', fRibaltata.premiati.length === 0)
  prova(
    'ma dice lo stesso chi ci era arrivato, tutti e tre',
    fRibaltata.indovini.length === 3,
    { indovini: fRibaltata.indovini }
  )
}

console.log('\nUn impostore non indovina mai, nemmeno nei giri vecchi')
{
  const OTTO = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  // b e' impostore e al primo giro ha indicato a, l'altro impostore: e'
  // il bluff piu' vecchio del mondo e non deve pagare.
  const giro1 = { b: ['a'], c: ['a'] }
  const r = esito({
    impostori: ['a', 'b'],
    giocatori: OTTO,
    schede: { c: ['b'] },
    fuori: ['a'],
    schedeDeiGiri: [giro1],
  })
  prova("l'impostore che accusa il suo complice non e un indovino", !r.indovini.includes('b'))
  prova("ma l'innocente che l'ha beccato si", r.indovini.includes('c'))
}

// ─────────────────────────────────────────────────────────────────────
// Chi puo' tentare il colpo, e chi no
//
// Con due impostori beccati NELLO STESSO giro tentano tutti e due, e vale
// la prima parola che arriva. Beccati in giri DIVERSI no: chi e' caduto
// prima e' rimasto a guardare dalla schermata "Sei fuori", che gli mostra
// le parole di tutti — la parola del gruppo la sa gia', e dargli il colpo
// vorrebbe dire regalargli la partita.
console.log('\nChi puo tentare il colpo di coda')
{
  const OTTO = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

  // Tutti e due beccati nello stesso giro: si accusano in due.
  const insieme = { c: ['a', 'b'], d: ['a', 'b'], e: ['a', 'b'], f: ['g', 'h'] }
  const dueInsieme = chiPuoTentare({ impostori: ['a', 'b'], giocatori: OTTO, schede: insieme })
  prova('beccati insieme: possono tentare in due', dueInsieme.length === 2, { dueInsieme })
  prova('e sono proprio loro', dueInsieme.includes('a') && dueInsieme.includes('b'))

  // Un impostore solo, beccato: tenta lui.
  const uno = chiPuoTentare({
    impostori: ['a'],
    giocatori: OTTO,
    schede: { c: ['a'], d: ['a'], e: ['a'] },
  })
  prova('un impostore solo: tenta lui', uno.join() === 'a')

  // Chi l'ha fatta franca non tenta: ha gia' vinto.
  const franca = chiPuoTentare({
    impostori: ['a'],
    giocatori: OTTO,
    schede: { c: ['d'], e: ['d'], f: ['d'] },
  })
  prova('chi non e stato beccato non tenta', franca.length === 0)

  // ⚠️ Il giro precedente. 'a' era gia' fuori e in questo giro si accusa
  // 'b': tenta solo 'b', perche' 'a' da fuori ha visto le parole di tutti.
  const soloUltimo = chiPuoTentare({
    impostori: ['a', 'b'],
    giocatori: ['b', 'c', 'd', 'e', 'f', 'g', 'h'],
    schede: { c: ['b'], d: ['b'], e: ['b'] },
  })
  prova(
    'chi era caduto in un giro prima non tenta: ha gia visto le parole',
    !soloUltimo.includes('a'),
    { soloUltimo }
  )
  prova('tenta solo chi e appena caduto', soloUltimo.join() === 'b')
}

// ─────────────────────────────────────────────────────────────────────
// La via d'uscita dal colpo di coda
//
// Se chi e' stato beccato se n'e' andato, o ha il telefono morto, o
// semplicemente non ha voglia di scrivere, la partita resta ferma nello
// stato 'colpo' per sempre: nessuno prende punti — nemmeno chi aveva
// indovinato — e finche' ce n'e' una aperta non se ne comincia un'altra.
//
// Il gruppo puo' chiudere senza, con la stessa soglia del "rivela in
// anticipo". La proprieta' che rende la cosa possibile e' una sola, ed e'
// quella che va provata: chi si sta aspettando e' stato beccato, quindi
// e' in `fuori`, quindi NON conta nella maggioranza. Se un giorno la
// soglia tornasse a contare tutti i giocatori, il contatore arriverebbe a
// "4 su 4" senza che succeda niente — e' gia' successo una volta, ed e'
// scritto sopra bastaPerRivelare.
console.log('\nSi puo chiudere il colpo senza chi non risponde')
{
  const OTTO = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  // 'a' e' l'impostore, beccato: e' fuori, e non risponde piu'.
  const partita = { giocatori: OTTO, impostori: ['a'], fuori: ['a'] }

  const superstiti = vivi(partita)
  prova('chi e stato beccato non e piu in gioco', !superstiti.includes('a'))
  prova('restano in sette', superstiti.length === 7)
  prova('e ne servono quattro', quantiPerRivelare(superstiti.length) === 4)

  prova('in tre non basta', !bastaPerRivelare(partita, ['b', 'c', 'd']))
  prova('in quattro si', bastaPerRivelare(partita, ['b', 'c', 'd', 'e']))
  prova(
    'la richiesta di chi e stato beccato non conta',
    !bastaPerRivelare(partita, ['a', 'b', 'c', 'd']),
    { aiuto: 'sono quattro nomi, ma uno e fuori' }
  )
  prova(
    'e nemmeno quella di un innocente eliminato prima',
    !bastaPerRivelare({ ...partita, fuori: ['a', 'h'] }, ['h', 'b', 'c'])
  )
}
{
  // Due impostori beccati insieme: si aspetta in due, e sono fuori tutti
  // e due.
  const OTTO = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  const partita = { giocatori: OTTO, impostori: ['a', 'b'], fuori: ['a', 'b'] }
  prova('restano in sei', vivi(partita).length === 6)
  prova('e ne servono quattro', quantiPerRivelare(6) === 4)
  prova('quattro superstiti bastano', bastaPerRivelare(partita, ['c', 'd', 'e', 'f']))
  prova(
    'tre superstiti piu i due beccati non bastano',
    !bastaPerRivelare(partita, ['a', 'b', 'c', 'd', 'e'])
  )
}
{
  // La proprieta' che conta: la via d'uscita deve essere SEMPRE
  // raggiungibile da chi e' rimasto al tavolo. Una soglia piu' alta del
  // numero dei presenti sarebbe un tasto che non funziona mai.
  let sempreRaggiungibile = true
  let peggiore = null
  for (let quanti = 4; quanti <= 10; quanti += 1) {
    const giocatori = Array.from({ length: quanti }, (_, i) => `p${i}`)
    for (const beccati of [1, 2]) {
      if (quanti - beccati < 1) continue
      const partita = {
        giocatori,
        impostori: giocatori.slice(0, beccati),
        fuori: giocatori.slice(0, beccati),
      }
      const superstiti = vivi(partita)
      const serve = quantiPerRivelare(superstiti.length)
      if (serve > superstiti.length) {
        sempreRaggiungibile = false
        peggiore = { quanti, beccati, serve, superstiti: superstiti.length }
      }
      // E chiedendolo tutti, deve bastare per davvero.
      if (!bastaPerRivelare(partita, superstiti)) {
        sempreRaggiungibile = false
        peggiore = { quanti, beccati, nota: 'nemmeno tutti insieme bastano' }
      }
    }
  }
  prova(
    'da quattro a dieci persone, con uno o due beccati, chi resta ce la fa sempre',
    sempreRaggiungibile,
    peggiore
  )
}

// ─────────────────────────────────────────────────────────────────────
// La lettura dei giri ha DUE estremi
//
// leggiSchedeDeiGiri lega i voti alla partita per tempo e non per chiave
// esterna, perche' la riga della partita ha una sola colonna vote_id.
// Col solo pavimento pescava anche i voti delle partite giocate DOPO:
// un telefono rimasto indietro che tocca "Rivela" mezz'ora dopo faceva
// girare paga() su una partita chiusa, leggeva i giri di quella nuova, e
// pagava +2 a chi in quella nuova aveva votato uno che nella vecchia era
// impostore. Schede tradotte con le opzioni giuste, quindi id di persone
// veri: nessun errore, nessuna riga rossa, solo la classifica che si
// sposta.
//
// Non e' provabile da riga di comando — e' una query — quindi si guarda
// il codice. Una rete grossolana, ma il difetto era invisibile e toglierlo
// di nuovo non romperebbe nient'altro.
console.log('\nLa lettura dei giri e chiusa da tutte e due le parti')
{
  const sorgente = readFileSync(
    new URL('../src/lib/partiteImpostore.js', import.meta.url),
    'utf8'
  )
  const inizio = sorgente.indexOf('export async function leggiSchedeDeiGiri')
  const corpo = sorgente.slice(inizio, sorgente.indexOf('\n}', inizio))

  prova('la funzione esiste', inizio > 0)
  prova("c'e' il pavimento: dai voti nati con questa partita in poi", /\.gte\('created_at'/.test(corpo))
  prova(
    "c'e' il soffitto: si taglia prima della partita successiva",
    /\.lt\('created_at'/.test(corpo),
    { aiuto: 'senza, paga() di una partita vecchia legge i giri di quella nuova' }
  )
  prova(
    'il soffitto viene dalla partita dopo, non da una data inventata',
    /from\('impostore_games'\)/.test(corpo) && /\.gt\('created_at', partita\.creataIl\)/.test(corpo)
  )
  prova('il voto d apertura resta fuori', /votoAperturaId/.test(corpo))
  prova('e la lettura ha il suo limit', /\.limit\(/.test(corpo))

  // paga() non deve tornare a leggersela da sola: dentro chiudiAccusa la
  // RPC gira per prima, quindi una lettura che fallisce li' lascerebbe una
  // partita gia' 'finita' e mai pagata, senza nessuno che riprova.
  const corpoPaga = sorgente.slice(
    sorgente.indexOf('export async function paga('),
    sorgente.indexOf('export async function chiudiAccusa')
  )
  prova(
    'paga riceve i giri da fuori invece di leggerseli',
    /export async function paga\(partita, voto, schedeDeiGiri/.test(corpoPaga) &&
      !/leggiSchedeDeiGiri/.test(corpoPaga),
    { aiuto: 'la lettura deve stare prima di tutto cio che cambia lo stato della partita' }
  )

  const corpoChiudi = sorgente.slice(
    sorgente.indexOf('export async function chiudiAccusa'),
    sorgente.indexOf('export async function tentaColpo')
  )
  prova(
    'chiudiAccusa legge i giri PRIMA della RPC che chiude',
    corpoChiudi.indexOf('leggiSchedeDeiGiri') < corpoChiudi.indexOf("rpc('chiudi_accusa'"),
    { aiuto: 'chiudi_accusa non solleva quando la guardia non passa: dopo e troppo tardi' }
  )
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} prove fallite.\n`)
process.exit(falliti === 0 ? 0 : 1)

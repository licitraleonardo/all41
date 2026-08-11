// Le prove del punteggio delle proposte. Erano l'unico blocco che genera
// punti senza copertura, ed è il più delicato: qui si decide chi sale e
// chi scende in classifica.
//
//   node prove/proposte.mjs

import {
  contaNoConsecutivi,
  esitoProposta,
  finestraSuspense,
  leggiDellEsito,
  sogliaCoppia,
} from '../src/lib/punteggioProposte.js'
import { PER_ID } from '../src/config/leggi.js'
import { readFileSync } from 'node:fs'

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

const OTTO = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const chiavi = (voci) => voci.map((v) => `${v.leggeId}:${v.memberId}`).sort()

console.log('Come finisce una votazione')
{
  prova('senza quorum si annulla', esitoProposta({ si: 2, no: 1, votanti: 3, totale: 8 }) === 'annullata')
  prova('metà gruppo basta', esitoProposta({ si: 4, no: 0, votanti: 4, totale: 8 }) === 'unanime')
  prova('pareggio', esitoProposta({ si: 2, no: 2, votanti: 4, totale: 8 }) === 'pareggio')
  prova('approvata', esitoProposta({ si: 3, no: 1, votanti: 4, totale: 8 }) === 'approvata')
  prova('bocciata', esitoProposta({ si: 1, no: 3, votanti: 4, totale: 8 }) === 'bocciata')
  // Un voto solo non è unanimità: è una persona che ha votato.
  prova(
    'un solo votante non fa unanimità',
    esitoProposta({ si: 1, no: 0, votanti: 1, totale: 2 }) === 'approvata'
  )
}

console.log('Chi paga e chi incassa')
{
  const base = { proponenteId: 'a', membriIds: OTTO, votoId: 'v1' }

  prova(
    'annullata: non scatta niente',
    leggiDellEsito({ ...base, esito: 'annullata', schede: { a: 0, b: 1 } }).length === 0
  )

  const unanime = leggiDellEsito({ ...base, esito: 'unanime', schede: { a: 0, b: 0 } })
  prova('unanime premia il proponente', chiavi(unanime).join() === 'unanimous:a')

  const bocciata = leggiDellEsito({ ...base, esito: 'bocciata', schede: { b: 1, c: 1 } })
  prova('bocciata punisce il proponente', chiavi(bocciata).join() === 'proposal-rejected:a')

  const pareggio = leggiDellEsito({ ...base, esito: 'pareggio', schede: { b: 0, c: 1 } })
  prova('il pareggio colpisce tutti e otto', pareggio.filter((v) => v.leggeId === 'poll-tie').length === 8)
  prova(
    'e premia chi ha spaccato il gruppo',
    pareggio.some((v) => v.leggeId === 'in-difficolta' && v.memberId === 'a')
  )
  // Il conto del pareggio: -1 dalla XI, +3 dal trofeo. Chi mette in
  // difficoltà il gruppo ci guadagna, ed è voluto.
  const netto = PER_ID['poll-tie'].punti + PER_ID['in-difficolta'].punti
  prova('per il proponente il pareggio è un guadagno netto', netto > 0)
}

console.log('Il No alla propria proposta')
{
  const base = { proponenteId: 'a', membriIds: OTTO, votoId: 'v1' }

  const controSe = leggiDellEsito({ ...base, esito: 'bocciata', schede: { a: 1, b: 1 } })
  prova(
    'votare No alla propria proposta si paga',
    controSe.some((v) => v.leggeId === 'contro-te-stesso' && v.memberId === 'a')
  )
  prova(
    'e si paga insieme alla bocciatura',
    controSe.some((v) => v.leggeId === 'proposal-rejected' && v.memberId === 'a')
  )

  const siStesso = leggiDellEsito({ ...base, esito: 'approvata', schede: { a: 0, b: 0 } })
  prova(
    'chi vota Sì alla propria non paga niente',
    !siStesso.some((v) => v.leggeId === 'contro-te-stesso')
  )

  const nonVotante = leggiDellEsito({ ...base, esito: 'bocciata', schede: { b: 1, c: 1 } })
  prova(
    'chi non vota la propria non paga',
    !nonVotante.some((v) => v.leggeId === 'contro-te-stesso')
  )

  // Anche a proposta approvata: hai remato contro e ha vinto lo stesso.
  const approvataConNo = leggiDellEsito({ ...base, esito: 'approvata', schede: { a: 1, b: 0, c: 0 } })
  prova(
    'vale anche se la proposta passa comunque',
    approvataConNo.some((v) => v.leggeId === 'contro-te-stesso')
  )
}

console.log('Le chiavi non si scontrano mai')
{
  const tutti = [
    leggiDellEsito({ esito: 'pareggio', proponenteId: 'a', membriIds: OTTO, votoId: 'v1', schede: { a: 1 } }),
    leggiDellEsito({ esito: 'unanime', proponenteId: 'a', membriIds: OTTO, votoId: 'v2', schede: {} }),
    leggiDellEsito({ esito: 'bocciata', proponenteId: 'b', membriIds: OTTO, votoId: 'v3', schede: { b: 1 } }),
  ].flat()

  const chiaviViste = tutti.map((v) => v.dedupeKey)
  prova('tutte le chiavi sono distinte', new Set(chiaviViste).size === chiaviViste.length)
  prova('nessuna chiave è vuota', chiaviViste.every((k) => typeof k === 'string' && k.length > 0))
  prova('ogni chiave contiene il voto', chiaviViste.every((k) => /v[123]/.test(k)))

  // Stessa proposta risolta due volte da due telefoni: chiavi identiche,
  // quindi il database ne accetta una sola. È la proprietà che tiene i
  // punti dal raddoppiarsi.
  const primo = leggiDellEsito({ esito: 'pareggio', proponenteId: 'a', membriIds: OTTO, votoId: 'v9', schede: { a: 1 } })
  const secondo = leggiDellEsito({ esito: 'pareggio', proponenteId: 'a', membriIds: OTTO, votoId: 'v9', schede: { a: 1 } })
  prova(
    'due telefoni producono le stesse chiavi',
    JSON.stringify(primo.map((v) => v.dedupeKey)) === JSON.stringify(secondo.map((v) => v.dedupeKey))
  )
}

console.log("L'escalation verso la stessa persona")
{
  prova('la prima non fa niente', sogliaCoppia(1) === null)
  prova('la seconda è l\'esca', sogliaCoppia(2) === 'vera-amicizia')
  prova('la terza è la trappola', sogliaCoppia(3) === 'ci-nascondete-qualcosa')
  prova('oltre resta la trappola', sogliaCoppia(4) === 'ci-nascondete-qualcosa')
  prova('zero non esiste', sogliaCoppia(0) === null)

  // L'esca deve premiare e la trappola punire, o il meccanismo non
  // funziona: è il rinforzo positivo che rende la terza irresistibile.
  prova('l\'esca dà punti', PER_ID['vera-amicizia'].punti > 0)
  prova('la trappola li toglie', PER_ID['ci-nascondete-qualcosa'].punti < 0)
  prova(
    'la trappola costa più di quanto renda l\'esca',
    Math.abs(PER_ID['ci-nascondete-qualcosa'].punti) > PER_ID['vera-amicizia'].punti
  )
}

console.log('Il No sistematico')
{
  const no = (n) => Array.from({ length: n }, () => ({ x: 1 }))
  prova('quattro No di fila', contaNoConsecutivi(no(4), 'x') === 4)
  prova('tre non bastano', contaNoConsecutivi(no(3), 'x') < 4)

  // Un Sì in mezzo spezza la serie, anche se prima c'erano quattro No.
  const spezzata = [{ x: 1 }, { x: 0 }, { x: 1 }, { x: 1 }, { x: 1 }, { x: 1 }]
  prova('un Sì spezza la serie', contaNoConsecutivi(spezzata, 'x') === 1)

  // Non votare non è cambiare idea: la serie prosegue.
  const saltata = [{ x: 1 }, {}, { x: 1 }, { x: 1 }, { x: 1 }]
  prova('le proposte non votate non spezzano', contaNoConsecutivi(saltata, 'x') === 4)

  prova('chi non ha mai votato è a zero', contaNoConsecutivi(no(5), 'nessuno') === 0)
  prova('elenco vuoto', contaNoConsecutivi([], 'x') === 0)
}

console.log("Il voto all'ultimo secondo")
{
  const adesso = 1_000_000
  const fra = (ms) => new Date(adesso + ms).toISOString()
  prova('dentro l\'ultimo minuto', finestraSuspense(fra(30_000), adesso))
  prova('a un minuto esatto', finestraSuspense(fra(60_000), adesso))
  prova('a due minuti no', !finestraSuspense(fra(120_000), adesso))
  prova('già scaduta no', !finestraSuspense(fra(-1000), adesso))
}

console.log('Il bilanciamento regge')
{
  // Regola di equilibrio del catalogo: le proposte votate devono restare
  // la fonte dominante. Una proposta vale fino a ±5; se una sola Legge
  // ne valesse di più, inciampare varrebbe più che giocare.
  const nuove = [
    'primo-sveglio', 'sveglia-il-gruppo', 'insonne', 'telegrafico', 'il-podcast',
    'prima-luce', 'paparazzo', 'suspense', 'in-difficolta', 'contro-te-stesso',
    'vera-amicizia', 'ci-nascondete-qualcosa', 'troppo-giudicante',
    'bastian-contrario', 'non-hai-ascoltato',
  ]
  for (const id of nuove) {
    const l = PER_ID[id]
    prova(`${id} esiste`, Boolean(l))
    if (!l) continue
    prova(`${id} ha un punteggio numerico`, typeof l.punti === 'number')
    prova(`${id} sta nella fascia ±5`, Math.abs(l.punti) <= 5)
    prova(`${id} è attiva`, l.attiva === true)
    prova(`${id} ha un testo`, typeof l.testo === 'string' && l.testo.length > 10)
  }

  // Le trappole devono restare più leggere della somma di un pomeriggio
  // di trofei: un malus che ribalta la classifica fa smettere di giocare.
  const peggiore = Math.min(...nuove.map((id) => PER_ID[id].punti))
  prova('nessun malus nuovo supera il -3', peggiore >= -3)

  // In una giornata normale — primo messaggio, rullino finito, un vocale
  // corto, un voto all'ultimo — si guadagna qualcosa senza proporre
  // niente. È la strada che non passa dal danneggiare gli altri.
  const giornataPulita =
    PER_ID['primo-sveglio'].punti + PER_ID['paparazzo'].punti +
    PER_ID['telegrafico'].punti + PER_ID['suspense'].punti
  prova('una giornata pulita rende', giornataPulita >= 4)
}

console.log('\nuna proposta lo dice in chat, o non la sente nessuno')
{
  // ⚠️ Una proposta scade in **un'ora**, e prima non faceva suonare
  // niente: chi non apriva l'app in quell'ora non votava e non lo sapeva
  // nemmeno. I sondaggi sono esclusi apposta dalle notifiche perche' ti
  // aspettano; una proposta no.
  const senzaCommenti = (f) =>
    readFileSync(f, 'utf8')
      .split('\n')
      .filter((r) => !/^\s*(\/\/|\*|\/\*)/.test(r))
      .join('\n')

  const lib = senzaCommenti('src/lib/proposte.js')
  const annuncio = lib.match(/async function annunciaInChat[\s\S]*?\n\}/)?.[0] ?? ''

  prova("l'annuncio esiste", annuncio.length > 0)

  // ⚠️ E' una riga di chat normale, non un tipo di notifica nuovo: un
  // tipo nuovo `decidi()` lo scarta in silenzio sui telefoni che non
  // hanno ancora aggiornato l'app, e il service worker si aggiorna solo
  // insieme all'app. Cambiare questa riga vuol dire smettere di far
  // suonare i telefoni senza che nessun errore lo dica.
  prova("passa da una riga di chat", /kind: 'free_text'/.test(annuncio))
  prova('col contrassegno che la distingue', /propostaVoto/.test(annuncio))

  // ⚠️ E non passa dal limite anti-spam della chat: tre secondi fra un
  // messaggio e l'altro. Chi ha appena scritto si vedrebbe rifiutare
  // l'annuncio della propria proposta, e resterebbe una proposta di cui
  // non sa niente nessuno.
  prova('e non passa dal limite della chat', !/inviaAzione|verificaLimite/.test(annuncio))

  // ⚠️ E la proposta non deve poter fallire per colpa dell'annuncio.
  // E' la riga con i denti: senza il `.catch`, una chat che non risponde
  // farebbe fallire l'assegnazione dei punti, che e' la cosa vera.
  const chiamata = lib.match(/annunciaInChat\([^\n]*\n?[^\n]*/)?.[0] ?? ''
  prova('e se non parte la proposta regge lo stesso', /\.catch\(/.test(chiamata))

  // E chi la disegna la riconosce, se no resta un messaggio scritto da
  // un umano che non l'ha scritto.
  const feed = senzaCommenti('src/components/Feed.jsx')
  prova('e la chat la disegna a modo suo', /payload\.propostaVoto/.test(feed))
}

console.log('')
if (fallite > 0) {
  console.error(`${fallite} prove fallite, ${passate} passate.`)
  process.exit(1)
}
console.log(`Tutte verdi: ${passate} prove.`)

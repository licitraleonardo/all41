// La Guida dice il vero?
//
// «Controllare che la Guida sia allineata a com'e' l'app adesso» era una
// voce da fare a mano, cioe' una cosa che si sarebbe ricontrollata una
// volta e poi mai piu'. Queste prove la rendono una cosa che si accorge
// da sola.
//
// Non controllano lo stile dei testi — quello e' gusto. Controllano i
// **numeri e gli elenchi**, che sono le uniche cose della Guida che
// possono diventare false da sole mentre l'app cresce.

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { FINALE, NUVOLETTE, VOCI, APERTURA } from '../src/config/guida.js'
import { LEGGI } from '../src/config/leggi.js'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio !== undefined) console.log('       ', JSON.stringify(dettaglio))
  }
}

const sorgente = Object.fromEntries(
  readdirSync('src/components')
    .filter((f) => f.endsWith('.jsx'))
    .map((f) => [f, readFileSync(join('src/components', f), 'utf8')])
)
const app = readFileSync('src/App.jsx', 'utf8')

console.log('\nil numero delle Leggi e quello vero')
{
  // ⚠️ Il difetto che questa prova ha trovato: la Guida diceva
  // `LEGGI.length`, cioe' 49, ma dieci sono spente — aspettano sezioni
  // che non esistono ancora. In un gioco il cui unico meccanismo e' «si
  // scoprono facendole scattare», dieci Leggi introvabili vogliono dire
  // dieci persone che a fine viaggio contano il proprio Testamento e
  // pensano di essersi perse qualcosa.
  const attive = LEGGI.filter((l) => l.attiva).length
  const detto = Number((FINALE.testo.match(/Sono (\d+)/) ?? [])[1])
  prova('la guida dice un numero', Number.isInteger(detto), FINALE.testo.slice(0, 40))
  prova(`dice ${detto}, e le Leggi accese sono ${attive}`, detto === attive)
  prova(
    'e non sta contando anche quelle spente',
    detto !== LEGGI.length || attive === LEGGI.length,
    { detto, inElenco: LEGGI.length, accese: attive }
  )
}

console.log('\nla nuvoletta e una sola, e sta dove serve')
{
  // ⚠️ Erano quindici, una per sezione. Sulla carta un tutorial gentile;
  // nella pratica quindici cartelli da chiudere nei primi cinque minuti,
  // e chi ne chiude tre di fila impara a chiuderli senza leggerli --
  // compresi quelli che dicevano qualcosa.
  //
  // Questa prova prima controllava che OGNI sezione ne avesse una, ed era
  // giusta finche' erano quindici. Adesso controlla il contrario, e serve
  // allo stesso scopo: che non tornino.
  const quante = Object.keys(NUVOLETTE)
  prova('e una sola', quante.length === 1, quante)
  prova('ed e quella dell Allbo', quante[0] === 'gioco.allbo')

  const testo = NUVOLETTE['gioco.allbo']?.testo ?? ''
  prova('e dice qualcosa', testo.length > 40)
  // Il senso di tenerla: e' l'unica cosa dell'app che nessuno indovina da
  // solo -- che i punti si danno anche agli altri, e a chi ti sta davanti.
  prova('parla di assegnare punti agli altri', /assegnarli agli altri/i.test(testo))

  // Una nuvoletta chiesta per un id che non c'e' non da' nessun errore:
  // semplicemente non compare, e chi l'ha scritta crede che ci sia.
  const chiesti = new Set()
  for (const t of [app, ...Object.values(sorgente)]) {
    for (const m of t.matchAll(/passo="([\w.]+)"/g)) chiesti.add(m[1])
  }
  const orfani = [...chiesti].filter((c) => !NUVOLETTE[c])
  prova('nessuno ne chiede una che non esiste', orfani.length === 0, orfani)
}

console.log('\ni tab sono quelli che dice la guida')
{
  // «Cinque tab» sta nell'apertura, ed e' il tipo di numero che invecchia
  // il giorno in cui se ne aggiunge uno.
  const nomi = (app.match(/const NOMI_TAB = \{([\s\S]*?)\}/) ?? [])[1] ?? ''
  const quanti = (nomi.match(/^\s*\w+:/gm) ?? []).length
  prova('i tab si contano', quanti > 0, quanti)
  prova(`la guida dice cinque e sono ${quanti}`, quanti === 5 && /Cinque tab/i.test(APERTURA), {
    quanti,
    apertura: APERTURA,
  })
  prova('e la guida ha una voce per ognuno', VOCI.length === quanti, {
    voci: VOCI.map((v) => v.titolo),
  })
}

console.log('\nquello che la guida insegna esiste ancora')
{
  // I gesti sono la parte piu' fragile: sono l'unica cosa che la Guida
  // promette e che il codice puo' smentire da solo.
  const conGesto = VOCI.filter((v) => v.gesto)
  prova('qualche gesto lo insegna', conGesto.length >= 3, conGesto.length)

  // ⚠️ Il microfono, e una prova che era passata dicendo il falso.
  //
  // Il gesto e' diventato «un tocco» il 9 agosto, e la Guida ha continuato
  // a insegnare «tieni premuto» per un giorno intero. Questa prova
  // c'era gia' e non l'ha preso, perche' cercava anche `voc-premi` -- che
  // e' un **nome di classe CSS**, rimasto uguale mentre il gesto cambiava.
  //
  // Adesso guarda il gesto e non il nome: `onPointerDown` c'e' solo se si
  // tiene premuto davvero.
  const vocali = sorgente['Vocali.jsx'] ?? ''
  const guidaDicePremuto = conGesto.some((v) => /tiene premuto|tieni premuto/i.test(v.gesto))
  const codiceHaPremuto = /onPointerDown|onPointerUp/.test(vocali)
  prova(
    'se la guida dice «tieni premuto», il microfono lo fa ancora',
    !guidaDicePremuto || codiceHaPremuto,
    { guidaDicePremuto, codiceHaPremuto }
  )
  // E il contrario: se il microfono e' a un tocco, la Guida deve dirlo.
  const codiceEUnTocco = /onClick=\{registrando \? ferma : avvia\}/.test(vocali)
  prova(
    'se e a un tocco, la guida lo insegna cosi',
    !codiceEUnTocco || conGesto.some((v) => /tocca il microfono/i.test(v.gesto)),
    { codiceEUnTocco, gesti: conGesto.map((v) => v.gesto) }
  )

  // ⚠️ Verificato il 9 agosto: il gesto «trascina in su per segnarlo
  // importante» **non sta nella Guida**, sta solo dentro Vocali, nel
  // suggerimento sotto il tasto e nell'`aria-label`. Era scritto il
  // contrario in un piano, e avrebbe fatto mettere in conto un lavoro che
  // non c'e'.
  prova(
    'il trascinamento in su NON e insegnato dalla Guida',
    !VOCI.some((v) => /trascina/i.test(`${v.testo} ${v.gesto ?? ''}`))
  )
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} cose non vanno.\n`)
process.exit(falliti === 0 ? 0 : 1)

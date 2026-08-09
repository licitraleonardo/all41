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

console.log('\nogni pezzo dell app ha la sua nuvoletta')
{
  // Le nuvolette si chiedono per nome: `passo="altro.spese"`. Se una
  // sezione nuova arriva senza la sua voce qui dentro resta **muta**, e
  // non lo dice nessuno — non e' un errore, semplicemente non compare
  // niente. E' successo con la Dama, ed era ancora cosi' per i Documenti.
  const chiesti = new Set()

  // Quelle scritte per esteso: `passo="oggi"`, `passo="altro"`.
  for (const t of [app, ...Object.values(sorgente)]) {
    for (const m of t.matchAll(/passo="([\w.]+)"/g)) chiesti.add(m[1])
    // E quelle costruite: `passo={`altro.${vista}`}` — il prefisso si
    // legge, la coda viene dall'elenco delle sezioni di quel componente.
    for (const m of t.matchAll(/passo=\{`(\w+)\.\$\{/g)) chiesti.add(m[1] + '.*')
    // `passo={vista === 'chat' ? 'gruppo' : 'gruppo.vocali'}`
    for (const m of t.matchAll(/passo=\{[^}]*?'([\w.]+)'\s*:\s*'([\w.]+)'/g)) {
      chiesti.add(m[1])
      chiesti.add(m[2])
    }
  }

  const SEZIONI = {
    'gioco.*': ['classifica', 'testamento', 'impostore', 'dama', 'pecora'],
    'altro.*': ['spese', 'documenti', 'mappa', 'stat', 'guida', 'info'],
  }

  const attesi = []
  for (const c of chiesti) {
    if (!c.endsWith('.*')) {
      attesi.push(c)
      continue
    }
    const radice = c.slice(0, -2)
    for (const s of SEZIONI[c] ?? []) attesi.push(`${radice}.${s}`)
  }

  prova('se ne chiedono parecchie', attesi.length >= 14, attesi.length)
  for (const id of attesi.sort()) {
    prova(`«${id}» ha la sua nuvoletta`, Boolean(NUVOLETTE[id]?.testo))
  }

  // E il contrario: una nuvoletta che nessuno chiede piu' e' un testo che
  // non vedra' mai nessuno, di solito perche' la sezione e' stata
  // rinominata.
  const orfane = Object.keys(NUVOLETTE).filter((k) => !attesi.includes(k))
  prova('nessuna nuvoletta scritta per una sezione che non esiste', orfane.length === 0, orfane)
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

  // Il microfono da tenere premuto. Il giorno in cui diventa «un tocco»
  // — ed e' una cosa gia' chiesta — questa prova si accorge che la Guida
  // sta insegnando un gesto che non esiste piu'.
  const vocali = sorgente['Vocali.jsx'] ?? ''
  const guidaDicePremuto = conGesto.some((v) => /tiene premuto|tieni premuto/i.test(v.gesto))
  const codiceHaPremuto = /onPointerDown|premi e parla|voc-premi/i.test(vocali)
  prova(
    'se la guida dice «tieni premuto», il microfono lo fa ancora',
    !guidaDicePremuto || codiceHaPremuto,
    { guidaDicePremuto, codiceHaPremuto }
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

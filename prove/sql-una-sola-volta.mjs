// Una funzione, un file. Nessuna definita due volte.
//
// Era la trappola piu' pericolosa del progetto, e non si vedeva leggendo
// il codice: `schema.sql` definiva avanza_impostore, avvia_impostore e
// chiudi_accusa nelle versioni VECCHIE, mentre apertura.sql, testimone.sql
// e giro.sql le definivano in quelle nuove.
//
// Per avanza_impostore la firma era la STESSA, quindi `create or replace`
// la sovrascriveva: bastava rilanciare schema.sql — cosa che il file
// stesso dichiarava sicura — perche' il testimone dei trenta secondi
// smettesse di funzionare. Nessun errore, nessun messaggio.
//
// Per le altre due la firma era diversa, quindi tornavano in vita ACCANTO
// a quelle nuove come doppioni: l'app non si rompeva, ma restava una
// funzione morta con lo stesso nome, e per chiudi_accusa bastava una
// chiamata con la firma corta per rendere la scelta ambigua.
//
// Non si prova col database (servirebbe una connessione): si prova sul
// testo dei file, che e' dove il difetto vive.

import { readFileSync, readdirSync } from 'node:fs'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio) console.log('       ', JSON.stringify(dettaglio, null, 1))
  }
}

const cartella = new URL('../supabase/', import.meta.url)

// DA-LANCIARE.sql e' generato: contiene le stesse definizioni degli
// originali, quindi contarlo darebbe un doppione finto per ognuna.
const GENERATI = ['DA-LANCIARE.sql', 'CONTROLLA.sql']

const file = readdirSync(cartella)
  .filter((n) => n.endsWith('.sql') && !GENERATI.includes(n))
  .sort()

console.log('\nfile guardati')
prova('ce ne sono almeno cinque', file.length >= 5, { file })
prova('i generati restano fuori', !file.some((n) => GENERATI.includes(n)))

// Dove viene definita ogni funzione, e con quanti argomenti.
const dove = new Map()
for (const nome of file) {
  const testo = readFileSync(new URL(nome, cartella), 'utf8')
  const re = /create\s+or\s+replace\s+function\s+([a-z_][a-z0-9_]*)\s*\(([^)]*)\)/gi
  let m
  while ((m = re.exec(testo)) !== null) {
    const funzione = m[1]
    const argomenti = m[2].trim()
    // Conta gli argomenti separando sulle virgole di primo livello.
    const quanti = argomenti === '' ? 0 : argomenti.split(',').length
    if (!dove.has(funzione)) dove.set(funzione, [])
    dove.get(funzione).push({ file: nome, quanti })
  }
}

console.log('\nnessuna funzione definita in due file')
const doppie = [...dove.entries()].filter(([, posti]) => posti.length > 1)
prova(
  'ogni funzione sta in un file solo',
  doppie.length === 0,
  doppie.map(([n, posti]) => ({
    funzione: n,
    definita_in: posti.map((p) => `${p.file} (${p.quanti} argomenti)`),
    aiuto:
      'toglila da tutti i file tranne uno. Se le firme coincidono, chi esegue per ultimo ' +
      'sovrascrive in silenzio; se sono diverse, restano tutte e due come doppioni',
  }))
)

console.log('\nle tre che erano la trappola stanno dove devono')
const ATTESE = {
  avanza_impostore: 'testimone.sql',
  avvia_impostore: 'apertura.sql',
  chiudi_accusa: 'giro.sql',
}
for (const [funzione, atteso] of Object.entries(ATTESE)) {
  const posti = dove.get(funzione) ?? []
  prova(`${funzione}: definita una volta sola`, posti.length === 1, { posti })
  prova(`${funzione}: e sta in ${atteso}`, posti[0]?.file === atteso, { posti })
}

console.log('\nschema.sql non da permessi a funzioni che non definisce')
{
  // Se `schema.sql` fa revoke/grant su una funzione che non c'e' ancora,
  // su un database nuovo fallisce li' — e l'SQL Editor si ferma alla prima
  // riga che non passa, quindi tutto quello che viene dopo non viene
  // creato. Il realtime sta dopo.
  const testo = readFileSync(new URL('schema.sql', cartella), 'utf8')
  const definite = new Set(
    [...testo.matchAll(/create\s+or\s+replace\s+function\s+([a-z_][a-z0-9_]*)/gi)].map((m) => m[1])
  )
  const permessi = [
    ...testo.matchAll(/(?:revoke|grant)\s+execute\s+on\s+function\s+([a-z_][a-z0-9_]*)/gi),
  ].map((m) => m[1])

  const orfani = [...new Set(permessi.filter((n) => !definite.has(n)))]
  prova('nessun permesso a funzioni non definite qui', orfani.length === 0, {
    orfani,
    aiuto: 'su un database nuovo schema.sql fallirebbe qui, e il realtime dopo non verrebbe creato',
  })
}

console.log('\nschema.sql dice che da solo non basta')
{
  const testo = readFileSync(new URL('schema.sql', cartella), 'utf8')
  prova('lo scrive in cima', /DA SOLO NON BASTA/i.test(testo.slice(0, 1200)))
  prova('e lo controlla in fondo', /DA-LANCIARE\.sql/.test(testo.slice(-1500)))
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} falliti.\n`)
process.exit(falliti === 0 ? 0 : 1)

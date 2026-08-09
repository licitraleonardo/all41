// Mette i file SQL ancora da lanciare dentro un file solo, in ordine.
//
// Non e' una comodita' inutile: quattro file da aprire e lanciare
// nell'ordine giusto sono quattro occasioni per saltarne uno o invertirne
// due, e i sintomi di un file mancante non assomigliano a "manca un file"
// — assomigliano a "il gioco e' rotto". La tabella in SESSIONE-8-AGOSTO.md
// esiste apposta per tradurli.
//
// Il file esce GENERATO e non scritto a mano, o diventerebbe la seconda
// copia di una verita' sola: si tocca un originale, e quello unito resta
// indietro senza dirlo. Rilanciare questo comando lo rifa'.
//
//   npm run sql

import { readFileSync, writeFileSync } from 'node:fs'

// L'ordine conta: apertura.sql cambia la firma di avvia_impostore e
// giro.sql quella di chiudi_accusa, e le due funzioni si aspettano la
// colonna che aggiunge testimone.sql.
const DA_UNIRE = [
  ['dama.sql', 'La Dama: tabella, funzioni e — la parte che si dimentica — l’iscrizione al realtime'],
  ['testimone.sql', 'La colonna turno_da, cioè il testimone dei 30 secondi'],
  ['apertura.sql', 'avvia_impostore con i giri: senza, l’Impostore non parte proprio'],
  ['giro.sql', 'chiudi_accusa col giro vero: senza, il contatore resta su “Giro 1”'],
  ['voto-unico.sql', 'Un giro d’accusa apre UN voto solo, non uno per telefono'],
  ['rimborso-unico.sql', 'Un rimborso registrato una volta sola, non una per telefono'],
  ['telefono.sql', 'La colonna phone: il numero lasciato quando ci si registra'],
  ['feedback.sql', 'La tabella feedback: si scrive e non si rilegge'],
]

const USCITA = 'DA-LANCIARE.sql'

const cartella = new URL('../supabase/', import.meta.url)

const pezzi = DA_UNIRE.map(([nome, cosa]) => {
  const testo = readFileSync(new URL(nome, cartella), 'utf8').trimEnd()
  return [
    '-- ' + '='.repeat(68),
    `-- ${nome} — ${cosa}`,
    '-- ' + '='.repeat(68),
    '',
    testo,
    '',
  ].join('\n')
})

const testa = [
  '-- ' + '='.repeat(68),
  '-- TUTTO QUELLO CHE MANCA AL DATABASE, IN UN FILE SOLO',
  '-- ' + '='.repeat(68),
  '--',
  '-- Incollalo nell’SQL Editor di Supabase e premi Run. Una volta sola.',
  '--',
  '-- È rieseguibile: se l’hai già lanciato, rilanciarlo non rompe niente.',
  '-- Se si ferma con un errore, i pezzi dopo NON sono stati eseguiti —',
  '-- l’SQL Editor si ferma alla prima riga che fallisce. Correggi e',
  '-- rilancia tutto da capo, non solo il pezzo che mancava.',
  '--',
  '-- In fondo c’è un controllo che stampa una tabella: quattro righe',
  '-- tutte “a posto” vogliono dire che è andata.',
  '--',
  '-- ⚠️ GENERATO da strumenti/unisci-sql.mjs — non modificarlo a mano.',
  '--    Gli originali sono i file qui accanto. Per rifarlo: npm run sql',
  '--',
  `-- Dentro, in quest’ordine: ${DA_UNIRE.map(([n]) => n).join(', ')}`,
  '',
  '',
].join('\n')

// Il controllo finale. Non dice "fatto" perche' il comando non ha dato
// errore: guarda se le quattro cose esistono davvero. La firma delle
// funzioni si conta dagli argomenti, perche' apertura.sql e giro.sql non
// aggiungono funzioni nuove — cambiano quelle che c'erano, e una firma
// vecchia rimasta in giro e' proprio il modo in cui questa cosa
// fallisce in silenzio.
const controllo = `

-- ${'='.repeat(68)}
-- È ANDATA? Quattro righe, tutte devono dire "a posto".
-- ${'='.repeat(68)}

select
  'La Dama esiste' as cosa,
  case when to_regclass('public.dama_games') is not null
       then 'a posto' else 'MANCA — rilancia il file' end as com_e
union all
select
  'La Dama parla in tempo reale',
  case when exists (
         select 1 from pg_publication_tables
         where pubname = 'supabase_realtime' and tablename = 'dama_games')
       then 'a posto'
       else 'MANCA — le mosse dell''altro non arriveranno mai' end
union all
select
  'Il testimone dei 30 secondi',
  case when exists (
         select 1 from information_schema.columns
         where table_name = 'impostore_games' and column_name = 'turno_da')
       then 'a posto' else 'MANCA — il tasto resta libero per tutti' end
union all
select
  'L''Impostore parte e conta i giri',
  case when exists (
         select 1 from pg_proc
         where proname = 'avvia_impostore' and pronargs = 5)
       and exists (
         select 1 from pg_proc
         where proname = 'chiudi_accusa' and pronargs = 7)
       then 'a posto' else 'MANCA — la partita non parte o resta su Giro 1' end
union all
select
  'Un giro apre un voto solo',
  case when exists (
         select 1 from pg_proc
         where proname = 'apri_voto_impostore' and pronargs = 4)
       then 'a posto'
       else 'MANCA — ogni giro lascia in giro un sondaggio orfano per telefono' end
union all
select
  'Un rimborso si registra una volta sola',
  case when exists (
         select 1 from pg_proc
         where proname = 'registra_rimborso' and pronargs = 5)
       then 'a posto'
       else 'MANCA — lo stesso rimborso puo essere registrato da tutti e due' end
;
`

writeFileSync(new URL(USCITA, cartella), testa + pezzi.join('\n') + controllo, 'utf8')

// Lo stesso controllo, da solo. Serve per chiedere "com'e' messo il
// database?" senza rilanciare niente: e' una select e non tocca niente,
// quindi si puo' dare in mano a chiunque e lanciare quando si vuole.
//
// Generato dalla stessa stringa del file grosso, o sarebbero due domande
// che col tempo si rispondono diverso.
const SOLO_CONTROLLO = 'CONTROLLA.sql'
writeFileSync(
  new URL(SOLO_CONTROLLO, cartella),
  [
    '-- ' + '='.repeat(68),
    '-- COM’È MESSO IL DATABASE — solo lettura, non cambia niente',
    '-- ' + '='.repeat(68),
    '--',
    '-- Quattro righe: se dicono tutte “a posto”, DA-LANCIARE.sql è arrivato',
    '-- tutto. Si può rilanciare quando si vuole, non tocca nessun dato.',
    '--',
    '-- ⚠️ GENERATO da strumenti/unisci-sql.mjs — non modificarlo a mano.',
    controllo,
  ].join('\n'),
  'utf8'
)

console.log(`\nsupabase/${USCITA} rifatto da ${DA_UNIRE.length} file.`)
console.log(`supabase/${SOLO_CONTROLLO} rifatto (solo lettura).`)
console.log('Aprilo, copia tutto, incollalo nell’SQL Editor di Supabase, Run.\n')

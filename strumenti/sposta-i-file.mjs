// Sposta ogni file dell'archivio a un percorso nuovo.
//
//   node strumenti/sposta-i-file.mjs --davvero
//
// Senza `--davvero` non tocca niente: dice solo cosa farebbe.
//
// ————————————————————————————————————————————————————————————
// Perché
//
// Chiudendo ALL41 al mondo, il 17 agosto, è rimasto un buco stretto e
// vero: **chi si fosse segnato l'indirizzo di una foto prima di quella
// sera la apre ancora.** Elencarle non si può più e indovinarle nemmeno
// (i percorsi sono fatti di due uuid), ma un indirizzo già in mano
// continua a funzionare, perché i bucket sono pubblici.
//
// ⚠️ L'alternativa era rendere i bucket privati e firmare gli indirizzi.
// Chiude lo stesso buco e ne apre un altro: un indirizzo firmato scade,
// quindi cambia ogni volta — e il service worker non può più tenersi le
// foto in memoria. **L'album offline muore**, ed era una funzione intera
// di un'app nata attorno al fatto che in Sardegna il segnale non c'è.
//
// Spostando i file invece: gli indirizzi vecchi diventano tutti morti,
// i nuovi sono altri due uuid, e **l'app continua a funzionare
// esattamente come adesso**.
//
// ————————————————————————————————————————————————————————————
// Come, e perché in quest'ordine
//
// Per ogni file: si sposta, si controlla che il nuovo indirizzo risponda,
// e **solo allora** si aggiorna la riga nel database.
//
// ⚠️ L'ordine inverso sarebbe più comodo e romperebbe le foto: la riga
// punterebbe a un indirizzo dove il file non è ancora arrivato, e se lo
// spostamento fallisse resterebbe a puntare nel vuoto per sempre. Così
// invece, il caso peggiore è una riga che punta ancora al posto vecchio
// — dove il file non c'è più: si vede subito, ed è nel registro.
//
// ⚠️ E ogni passo si scrive nel registro PRIMA di essere fatto. Un
// programma che si interrompe a metà di 168 file, senza registro, lascia
// un archivio in uno stato che nessuno sa più ricostruire.

import { readFileSync, appendFileSync, existsSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import pg from 'pg'

const REGISTRO = new URL('../supabase/spostamenti.log', import.meta.url)
const DAVVERO = process.argv.includes('--davvero')

function ambiente(chiave) {
  const testo = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  for (const riga of testo.split(/\r?\n/)) {
    const pulita = riga.trim()
    if (!pulita || pulita.startsWith('#')) continue
    const taglio = pulita.indexOf('=')
    if (taglio < 0) continue
    if (pulita.slice(0, taglio).trim() === chiave) {
      return pulita.slice(taglio + 1).trim().replace(/^["']|["']$/g, '')
    }
  }
  return null
}

const URL_BASE = ambiente('VITE_SUPABASE_URL')
const CHIAVE = ambiente('VITE_SUPABASE_ANON_KEY')

const db = new pg.Client({
  connectionString: ambiente('SUPABASE_DB_URL'),
  ssl: { rejectUnauthorized: false },
})
try {
  await db.connect()
} catch {
  // ⚠️ Il messaggio vero conterrebbe la stringa di connessione.
  console.error('Non riesco a collegarmi al database.')
  process.exit(1)
}
const q = async (sql, ...p) => (await db.query(sql, p)).rows

// ————————————————————————————————————— chi sono, per l'archivio

// Lo spostamento passa dall'API dell'archivio — l'unica che muove il file
// davvero, non solo la sua etichetta — quindi serve una sessione di uno
// del viaggio, come ce l'ha un telefono.
const [{ access_code: codice }] = await q(
  "select access_code from members where trip_id = 'sardegna-2026' limit 1"
)

const registrazione = await fetch(`${URL_BASE}/auth/v1/signup`, {
  method: 'POST',
  headers: { apikey: CHIAVE, 'Content-Type': 'application/json' },
  body: '{}',
})
const gettone = (await registrazione.json()).access_token
if (!gettone) {
  console.error('Non riesco a farmi dare una sessione.')
  process.exit(1)
}
const mia = JSON.parse(Buffer.from(gettone.split('.')[1], 'base64').toString()).sub

await fetch(`${URL_BASE}/rest/v1/rpc/entra_col_codice`, {
  method: 'POST',
  headers: {
    apikey: CHIAVE,
    Authorization: `Bearer ${gettone}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ p_codice: codice }),
})

// ————————————————————————————————————— cosa c'è da spostare

// Il registro delle volte precedenti: quello che è già andato non si
// rifà. Serve a poter interrompere senza paura.
const fatti = new Set()
if (existsSync(REGISTRO)) {
  for (const riga of readFileSync(REGISTRO, 'utf8').split('\n')) {
    const [esito, , vecchio] = riga.split('\t')
    if (esito === 'ok') fatti.add(vecchio)
  }
}

const tutti = await q(
  `select bucket_id, name from storage.objects
    where bucket_id in ('foto', 'documenti', 'vocali')
    order by bucket_id, name`
)
const daFare = tutti.filter((o) => !fatti.has(`${o.bucket_id}/${o.name}`))

console.log(`\n${tutti.length} file in archivio, ${fatti.size} già spostati, ${daFare.length} da fare`)
if (!DAVVERO) {
  console.log('\nProva a vuoto: non tocco niente. Rilancia con --davvero.\n')
  await db.end()
  process.exit(0)
}

// Le tre tabelle che tengono un indirizzo, e dove.
const TABELLE = { foto: 'photos', documenti: 'documents', vocali: 'voice_messages' }

let spostati = 0
let falliti = 0
let righe = 0

for (const o of daFare) {
  const pezzi = o.name.split('/')
  const nomeVecchio = pezzi[pezzi.length - 1]
  const punto = nomeVecchio.lastIndexOf('.')
  const estensione = punto > 0 ? nomeVecchio.slice(punto) : ''
  const nuovo = [...pezzi.slice(0, -1), randomUUID() + estensione].join('/')

  // Prima si scrive che si sta per fare, poi si fa.
  appendFileSync(REGISTRO, `inizio\t${o.bucket_id}\t${o.bucket_id}/${o.name}\t${nuovo}\n`)

  const risposta = await fetch(`${URL_BASE}/storage/v1/object/move`, {
    method: 'POST',
    headers: {
      apikey: CHIAVE,
      Authorization: `Bearer ${gettone}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bucketId: o.bucket_id,
      sourceKey: o.name,
      destinationKey: nuovo,
    }),
  })

  if (!risposta.ok) {
    const perche = await risposta.text()
    appendFileSync(REGISTRO, `FALLITO\t${o.bucket_id}\t${o.bucket_id}/${o.name}\t${perche.slice(0, 120)}\n`)
    console.log(`  ✗ ${o.name.slice(-24)} — ${perche.slice(0, 60)}`)
    falliti += 1
    continue
  }

  // ⚠️ Si controlla che il file ci sia DAVVERO al posto nuovo prima di
  // toccare il database. «Spostato» detto dall'archivio non basta: è la
  // stessa lezione della funzione SQL che rinominava l'etichetta
  // lasciando il file dov'era.
  const controllo = await fetch(`${URL_BASE}/storage/v1/object/public/${o.bucket_id}/${nuovo}`, {
    method: 'HEAD',
  })
  if (!controllo.ok) {
    appendFileSync(REGISTRO, `NON ARRIVATO\t${o.bucket_id}\t${o.bucket_id}/${o.name}\t${nuovo}\n`)
    console.log(`  ✗ ${o.name.slice(-24)} — spostato ma non risponde`)
    falliti += 1
    continue
  }

  // Adesso, e solo adesso, la riga.
  const tabella = TABELLE[o.bucket_id]
  const { rowCount } = await db.query(
    `update ${tabella} set url = replace(url, $1, $2) where url like '%' || $1`,
    [o.name, nuovo]
  )
  righe += rowCount

  appendFileSync(REGISTRO, `ok\t${o.bucket_id}\t${o.bucket_id}/${o.name}\t${nuovo}\t${rowCount}\n`)
  spostati += 1
  if (spostati % 25 === 0) console.log(`  ${spostati}/${daFare.length}…`)
}

// La sessione di servizio non deve restare agganciata come se fosse un
// telefono di qualcuno.
await db.query('delete from member_devices where auth_id = $1', [mia])

console.log(`\n${spostati} file spostati, ${righe} righe aggiornate, ${falliti} falliti.`)
console.log(`Registro: supabase/spostamenti.log\n`)

await db.end()
process.exit(falliti === 0 ? 0 : 1)

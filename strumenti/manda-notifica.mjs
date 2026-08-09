// Manda una notifica di prova ai telefoni iscritti, da qui.
//
// Serve a una cosa sola: verificare che la catena funzioni davvero, senza
// aspettare che le chiavi siano su Vercel. Salta l'endpoint e usa la
// chiave privata che sta in `.env.local`, ma il pezzo che conta è lo
// stesso — il telefono suona o non suona.
//
// ⚠️ Questo squilla telefoni di persone vere. Per questo di suo non manda
// niente: dice **chi** riceverebbe e si ferma. Serve `--vai` per farlo
// davvero, come `svuota.sql` vuole `--sono-sicuro`.
//
//   node strumenti/manda-notifica.mjs                 # dice chi, e basta
//   node strumenti/manda-notifica.mjs --vai           # manda un SOS di prova
//   node strumenti/manda-notifica.mjs --vai --tipo si_riparte

import { readFileSync } from 'node:fs'
import webpush from 'web-push'
import pg from 'pg'

const CHIAVE_PUBBLICA =
  'BMmTtsxcu7RHWiDxA9vAxFuz78WHL0b-BwavuBESjwTCbnHiTXzMreZ-e5v7eLLA5D5vHeh5uNj0PvLUfFWw2g8'

function daEnv(nome) {
  const riga = readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .find((r) => r.startsWith(nome + '='))
  if (!riga) {
    console.error(`\nManca ${nome} in .env.local.\n`)
    process.exit(1)
  }
  // ⚠️ Si taglia sul PRIMO uguale e non si stampa mai: una password del
  // database è già finita in una trascrizione una volta.
  return riga.slice(nome.length + 1).trim()
}

const vai = process.argv.includes('--vai')
const i = process.argv.indexOf('--tipo')
const tipo = i >= 0 ? process.argv[i + 1] : 'sos'

const testi = {
  sos: { motivo: 'Prova delle notifiche' },
  si_riparte: { minuti: 5 },
  dove_siete: {},
  free_text: {},
  vocale: {},
}

if (!testi[tipo]) {
  console.error(`\nTipo sconosciuto: ${tipo}. Quelli buoni: ${Object.keys(testi).join(', ')}\n`)
  process.exit(1)
}

const cliente = new pg.Client({
  connectionString: daEnv('SUPABASE_DB_URL'),
  ssl: { rejectUnauthorized: false },
})
await cliente.connect()

const { rows } = await cliente.query(
  'select p.endpoint, p.chiavi, m.name from push_subscriptions p join members m on m.id = p.member_id'
)

if (rows.length === 0) {
  console.log('\nNessun telefono iscritto.')
  console.log('Sul telefono: Altro → Info → Notifiche → Accendi.')
  console.log('Su iPhone dev’essere l’app messa sulla schermata home, non il browser.\n')
  await cliente.end()
  process.exit(0)
}

console.log(`\nTelefoni iscritti: ${rows.length}`)
for (const r of rows) console.log(` - ${r.name}`)

if (!vai) {
  console.log(`\nCon --vai parte una notifica di tipo «${tipo}» a tutti quelli qui sopra.`)
  console.log('Senza, non è partito niente.\n')
  await cliente.end()
  process.exit(0)
}

webpush.setVapidDetails('mailto:all41@example.invalid', CHIAVE_PUBBLICA, daEnv('VAPID_PRIVATE_KEY'))

// Lo stesso pacchetto che manderebbe `api/notifica.js`: se cambia la
// forma là, questa prova smette di provare la cosa vera.
const roba = JSON.stringify({
  tipo,
  id: 'prova-' + Date.now(),
  chi: 'Prova',
  payload: testi[tipo],
})

const esiti = await Promise.allSettled(
  rows.map((r) => webpush.sendNotification({ endpoint: r.endpoint, keys: r.chiavi }, roba, { TTL: 600 }))
)

let andate = 0
esiti.forEach((e, n) => {
  if (e.status === 'fulfilled') {
    andate += 1
    console.log(` ✓ ${rows[n].name}`)
  } else {
    console.log(` ✗ ${rows[n].name}: ${e.reason?.statusCode ?? ''} ${e.reason?.body ?? e.reason?.message ?? ''}`)
  }
})

console.log(`\nMandate: ${andate} su ${rows.length}.`)
if (andate > 0) console.log('Se il telefono non suona, guarda che l’app non sia aperta davanti a te.\n')

await cliente.end()

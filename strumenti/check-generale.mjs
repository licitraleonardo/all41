// Il check generale: i conti, la fortezza, lo stato del viaggio.
//
//   node strumenti/check-generale.mjs
//
// ⚠️ I saldi si calcolano con `src/lib/saldi.js`, cioe' con lo STESSO
// motore che gira nei telefoni. Rifarli qui a mano vorrebbe dire
// misurare una cosa diversa da quella che il gruppo vede, e allora il
// numero non risponderebbe alla domanda.
//
// ⚠️ La stringa di connessione sta in `.env.local` e qui dentro non
// viene mai stampata, nemmeno dentro un messaggio d'errore.

import { readFileSync } from 'node:fs'
import pg from 'pg'
import { calcolaSaldi, chiDeveAChi, formattaEuro } from '../src/lib/saldi.js'

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

const url = ambiente('SUPABASE_DB_URL')
if (!url) {
  console.error('Manca SUPABASE_DB_URL in .env.local')
  process.exit(1)
}

const db = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
try {
  await db.connect()
} catch {
  // Il messaggio vero conterrebbe la stringa di connessione.
  console.error('Non riesco a collegarmi al database.')
  process.exit(1)
}

const q = async (sql, ...p) => (await db.query(sql, p)).rows

const membri = await q('select id, name from members order by name')
const nome = Object.fromEntries(membri.map((m) => [m.id, m.name]))

const speseRighe = await q(
  'select id, description, amount_cents, paid_by, split_among, deleted_at from expenses'
)
const rimborsiRighe = await q(
  'select id, from_member, to_member, amount_cents, deleted_at from payments'
)

const spese = speseRighe.map((r) => ({
  id: r.id,
  descrizione: r.description,
  centesimi: r.amount_cents,
  paganti: Array.isArray(r.paid_by) ? r.paid_by : [r.paid_by].filter(Boolean),
  divisaFra: r.split_among ?? [],
  eliminata: Boolean(r.deleted_at),
}))
const rimborsi = rimborsiRighe.map((r) => ({
  id: r.id,
  da: r.from_member,
  a: r.to_member,
  centesimi: r.amount_cents,
  eliminato: Boolean(r.deleted_at),
}))

const saldi = calcolaSaldi(spese, rimborsi, membri.map((m) => m.id))
const passaggi = chiDeveAChi(saldi)

const vive = spese.filter((s) => !s.eliminata)
const totale = vive.reduce((t, s) => t + s.centesimi, 0)
const rimborsiVivi = rimborsi.filter((r) => !r.eliminato)

console.log('\n═══ I CONTI ═══\n')
console.log(`  ${vive.length} spese vive, ${formattaEuro(totale)} in tutto`)
console.log(`  ${rimborsiVivi.length} rimborsi segnati, ${formattaEuro(rimborsiVivi.reduce((t, r) => t + r.centesimi, 0))}`)
console.log()

for (const m of membri) {
  const s = saldi[m.id] ?? 0
  const segno = s > 0 ? 'deve avere' : s < 0 ? 'deve dare ' : 'a posto   '
  console.log(`  ${m.name.padEnd(10)} ${segno} ${s === 0 ? '' : formattaEuro(Math.abs(s))}`)
}

console.log()
if (passaggi.length === 0) {
  console.log('  ✓ CONTI CHIUSI: non deve piu niente nessuno.')
} else {
  console.log(`  ⚠️  ${passaggi.length} passaggi ancora da fare:`)
  for (const p of passaggi) {
    console.log(`      ${nome[p.da] ?? p.da} → ${nome[p.a] ?? p.a}: ${formattaEuro(p.centesimi)}`)
  }
}

// ⚠️ L'invariante su cui poggia tutto: la somma dei saldi deve fare zero.
// Se non lo fa, non e' che qualcuno deve dei soldi: e' che il conto e'
// rotto, e nessuna schermata lo direbbe.
const somma = Object.values(saldi).reduce((t, v) => t + v, 0)
console.log(`\n  somma di tutti i saldi: ${somma} centesimi ${somma === 0 ? '✓' : '⚠️  DOVREBBE ESSERE ZERO'}`)

console.log('\n═══ LA FORTEZZA ═══\n')

const aperte = await q(
  `select tablename, cmd from pg_policies where schemaname='public'
     and (coalesce(qual,'')='true' or coalesce(with_check,'')='true')`
)
console.log(`  regole ancora aperte a chiunque: ${aperte.length} ${aperte.length === 0 ? '✓' : '⚠️'}`)
for (const a of aperte) console.log(`      ⚠️  ${a.tablename} (${a.cmd})`)

const senzaProtezione = await q(
  `select c.relname from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname='public' and c.relkind='r' and not c.relrowsecurity`
)
console.log(`  tabelle senza protezione: ${senzaProtezione.length} ${senzaProtezione.length === 0 ? '✓' : '⚠️'}`)
for (const t of senzaProtezione) console.log(`      ⚠️  ${t.relname}`)

const ponte = await q(
  `select has_function_privilege('authenticated', p.oid, 'execute') as puo
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname='public' and p.proname='aggancia_dispositivo'`
)
console.log(`  il ponte e ancora giu: ${ponte[0]?.puo === false ? 'si ✓' : '⚠️  NO, e riaperto'}`)

const senzaTelefono = await q(
  `select m.name from members m
     left join member_devices d on d.member_id = m.id
    group by m.id, m.name having count(d.auth_id) = 0`
)
console.log(`  chi non si e agganciato: ${senzaTelefono.length === 0 ? 'nessuno ✓' : senzaTelefono.map((r) => r.name).join(', ') + ' ⚠️'}`)

console.log('\n═══ IL VIAGGIO ═══\n')
const conti = await q(`select
  (select count(*) from quick_actions) as messaggi,
  (select count(*) from photos where deleted_at is null) as foto,
  (select count(*) from voice_messages) as vocali,
  (select count(*) from documents) as documenti,
  (select count(*) from point_events) as eventi_punti`)
const c = conti[0]
console.log(`  ${c.messaggi} messaggi · ${c.foto} foto · ${c.vocali} vocali · ${c.documenti} documenti`)

const classifica = await q('select name, score from members order by score desc, name')
console.log('\n  classifica:')
classifica.forEach((m, i) => {
  const medaglia = ['🥇', '🥈', '🥉'][i] ?? '  '
  console.log(`    ${medaglia} ${m.name.padEnd(10)} ${m.score}`)
})

// ⚠️ `members.score` deve essere uguale alla somma dei suoi eventi. E'
// l'invariante di tutta la parte punti: se si scuce, la Classifica mostra
// un numero e lo storico ne racconta un altro, e non lo dice nessuno.
const scuciti = await q(`select m.name, m.score, coalesce(sum(e.points), 0) as somma
    from members m left join point_events e on e.member_id = m.id and e.status = 'approved'
   group by m.id, m.name, m.score
  having m.score <> coalesce(sum(e.points), 0)`)
console.log(`\n  punteggi che non tornano con lo storico: ${scuciti.length === 0 ? 'nessuno ✓' : '⚠️'}`)
for (const s of scuciti) console.log(`      ⚠️  ${s.name}: segnati ${s.score}, eventi ${s.somma}`)

await db.end()
console.log()

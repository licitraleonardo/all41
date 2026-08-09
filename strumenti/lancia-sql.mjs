// Lancia un file SQL sul database del viaggio, da riga di comando.
//
//   npm run sql:lancia supabase/DA-LANCIARE.sql
//
// Serve a togliere di mezzo il giro "apri il browser, apri il progetto,
// apri l'SQL Editor, incolla, Run" ogni volta che cambia una funzione.
//
// ⚠️ LA STRINGA DI CONNESSIONE E' UNA CHIAVE, e sta in `.env.local`, che
// il .gitignore tiene fuori dal repo. Qui dentro non viene mai stampata,
// nemmeno dentro un messaggio d'errore: se finisse in un log o in uno
// screenshot varrebbe come consegnare il database.

import { readFileSync } from 'node:fs'
import pg from 'pg'

const CHIAVE = 'SUPABASE_DB_URL'

// I file che cancellano roba. Vanno lanciati apposta, dicendolo, perche'
// da qui non si torna indietro e un tab sbagliato non deve poter buttare
// via il viaggio di otto persone.
const PERICOLOSI = ['svuota.sql']
const CONFERMA = '--sono-sicuro'

function leggiAmbiente() {
  try {
    const testo = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    for (const riga of testo.split(/\r?\n/)) {
      const pulita = riga.trim()
      if (!pulita || pulita.startsWith('#')) continue
      const taglio = pulita.indexOf('=')
      if (taglio < 0) continue
      const nome = pulita.slice(0, taglio).trim()
      if (nome !== CHIAVE) continue
      return pulita
        .slice(taglio + 1)
        .trim()
        .replace(/^["']|["']$/g, '')
    }
  } catch {
    // Il file puo' non esserci: lo dice il messaggio qui sotto.
  }
  return process.env[CHIAVE] ?? null
}

const percorso = process.argv[2]
const sicuro = process.argv.includes(CONFERMA)

if (!percorso) {
  console.error('\nManca il file. Esempio:\n  npm run sql:lancia supabase/DA-LANCIARE.sql\n')
  process.exit(1)
}

const nomeFile = percorso.split(/[\\/]/).pop()
if (PERICOLOSI.includes(nomeFile) && !sicuro) {
  console.error(
    `\n⚠️  ${nomeFile} CANCELLA I DATI e non si torna indietro.\n` +
      `   Se e' davvero quello che vuoi:\n` +
      `   npm run sql:lancia ${percorso} ${CONFERMA}\n`
  )
  process.exit(1)
}

const url = leggiAmbiente()
if (!url) {
  console.error(
    `\nManca ${CHIAVE} in .env.local.\n\n` +
      `Su Supabase: Project Settings → Database → Connection string → URI,\n` +
      `e prendi quella del **Session pooler** (non la Transaction pooler:\n` +
      `quella non regge le funzioni e i "do $$").\n\n` +
      `Poi aggiungi al file .env.local, su una riga sua:\n` +
      `  ${CHIAVE}=postgresql://...\n\n` +
      `.env.local non finisce nel repo: lo esclude il .gitignore.\n`
  )
  process.exit(1)
}

const sql = readFileSync(new URL(`../${percorso}`, import.meta.url), 'utf8')

// Tutto in una query sola e non spezzato sui punto e virgola: i corpi
// delle funzioni stanno dentro $$ e sono pieni di ; loro. Spezzare
// significherebbe mandare mezze funzioni al database.
const cliente = new pg.Client({ connectionString: url })

try {
  await cliente.connect()
  console.log(`\n${percorso} → database del viaggio…\n`)

  const esiti = await cliente.query(sql)
  const elenco = Array.isArray(esiti) ? esiti : [esiti]

  // Delle tante istruzioni interessano solo quelle che hanno risposto con
  // delle righe: in fondo ai nostri file c'e' il controllo che dice se e'
  // andata.
  const conRighe = elenco.filter((e) => e?.rows?.length)
  if (conRighe.length === 0) {
    console.log('Fatto. Nessuna riga da mostrare.\n')
  } else {
    for (const e of conRighe) console.table(e.rows)
  }

  const guai = conRighe
    .flatMap((e) => e.rows)
    .filter((r) => Object.values(r).some((v) => typeof v === 'string' && v.includes('MANCA')))

  if (guai.length > 0) {
    console.error(`\n⚠️  ${guai.length} cose mancano ancora. Guarda la tabella qui sopra.\n`)
    process.exit(1)
  }

  console.log('\nTutto a posto.\n')
} catch (e) {
  // Solo il messaggio del database. Niente stack e niente oggetto intero:
  // dentro ci finirebbe la stringa di connessione.
  console.error(`\nIl database ha risposto: ${e?.message ?? e}`)
  if (e?.position) console.error(`(carattere ${e.position} del file)`)
  console.error()
  process.exit(1)
} finally {
  await cliente.end().catch(() => {})
}

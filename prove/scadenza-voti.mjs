// Quali voti si chiudono da soli quando scadono.
//
// Senza un server la scadenza la fa scattare il primo che apre l'app. Va
// bene per le domande che muoiono davvero ("si mangia qui?"), e pianta la
// partita per quelle che no: il voto d'accusa dell'Impostore veniva
// chiuso mezz'ora dopo essere stato aperto — cioe' dopo una cena — e da
// li' `vota_impostore` rispondeva "Il voto e' chiuso" a tutti e otto,
// senza nessuna via d'uscita.
//
// Queste prove guardano anche dentro schema.sql, e non e' pignoleria: la
// decisione poggia su due fatti che stanno la' dentro, non qui. Se
// qualcuno li cambia, la decisione va ripensata invece di restare scritta
// in un commento che nessuno rilegge.

import { readFileSync } from 'node:fs'
import { CATEGORIE_CHE_SCADONO } from '../src/config/sondaggi.js'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio) console.log('       ', JSON.stringify(dettaglio))
  }
}

const schema = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8')

// Le categorie ammesse dal vincolo della tabella votes.
const vincolo = schema.match(/check\s*\(category in\s*\(([^)]*)\)/)
const ammesse = vincolo
  ? vincolo[1]
      .split(',')
      .map((s) => s.trim().replace(/^'|'$/g, ''))
      .filter(Boolean)
  : []

// Le categorie che di proposito NON si chiudono da sole. Sta qui e non in
// configurazione perche' e' la prova a dover sapere cosa e' stato deciso:
// se domani ne nasce una nuova, questo file deve rompersi finche' qualcuno
// non scrive da che parte va.
const DECISE_A_NON_SCADERE = ['impostore']

console.log('\nil vincolo del database si legge')
prova('la tabella votes dichiara le sue categorie', ammesse.length > 0, { ammesse })
prova('e sono quattro', ammesse.length === 4, { ammesse })

console.log("\nl'Impostore non si chiude da solo")
prova(
  "'impostore' NON e' fra quelle che scadono",
  !CATEGORIE_CHE_SCADONO.includes('impostore'),
  { elenco: CATEGORIE_CHE_SCADONO }
)
prova("ma il database la conosce, quindi non e' un refuso", ammesse.includes('impostore'))

console.log('\nnessuna categoria resta senza una decisione')
for (const c of ammesse) {
  const scade = CATEGORIE_CHE_SCADONO.includes(c)
  const nonScade = DECISE_A_NON_SCADERE.includes(c)
  prova(`'${c}': si sa da che parte sta`, scade !== nonScade, {
    scade,
    nonScade,
    aiuto: 'aggiungila a CATEGORIE_CHE_SCADONO o a DECISE_A_NON_SCADERE',
  })
}

console.log("\nl'elenco non contiene errori di battitura")
for (const c of CATEGORIE_CHE_SCADONO) {
  prova(`'${c}' esiste davvero nel database`, ammesse.includes(c), { ammesse })
}
prova(
  'nessuna ripetuta: una categoria due volte non sarebbe un errore ma sarebbe un segnale',
  new Set(CATEGORIE_CHE_SCADONO).size === CATEGORIE_CHE_SCADONO.length
)

console.log('\ni due fatti su cui poggia la decisione')
const corpoVota = schema.slice(schema.indexOf('function vota_impostore('))
const finoAllaFine = corpoVota.slice(0, corpoVota.indexOf('end $$;'))

prova(
  'chiudere il voto lo rende invotabile: vota_impostore controlla closed_at',
  /closed_at is not null/.test(finoAllaFine)
)
prova(
  "il voto dell'Impostore non ha una scadenza vera: vota_impostore NON guarda expires_at",
  !/expires_at/.test(finoAllaFine),
  { aiuto: 'se ora la guarda, la partita ha un tempo massimo e va ripensato tutto' }
)

// E il contrario, per il sondaggio normale: quello la scadenza ce l'ha, ed
// e' il motivo per cui chiuderlo e' giusto.
const corpoSondaggio = schema.slice(schema.indexOf('function vota(p_voto'))
const sondaggioFinoAllaFine = corpoSondaggio.slice(0, corpoSondaggio.indexOf('end $$;'))
prova(
  'il sondaggio normale invece scade per davvero',
  /expires_at/.test(sondaggioFinoAllaFine)
)

console.log('\nchi chiude filtra per categoria')
const voti = readFileSync(new URL('../src/lib/voti.js', import.meta.url), 'utf8')
const corpoChiudi = voti.slice(voti.indexOf('export async function chiudiScaduti'))
prova(
  'chiudiScaduti filtra le categorie nella lettura',
  /\.in\('category', CATEGORIE_CHE_SCADONO\)/.test(corpoChiudi),
  {
    aiuto:
      'nella lettura e non dopo: la ricerca si ferma a 20, e i voti da non chiudere occuperebbero i posti',
  }
)
prova('e la lettura ha ancora il suo limit', /\.limit\(\d+\)/.test(corpoChiudi))

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} falliti.\n`)
process.exit(falliti === 0 ? 0 : 1)

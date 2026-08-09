// La copia locale deve accendersi anche quando la lettura NON fallisce ma
// resta appesa.
//
// Era il buco: `conCache` serviva la copia solo dentro il `catch`, ma con
// una tacca di segnale una fetch non fallisce — aspetta. Nessun catch, e
// la copia buona in localStorage non veniva servita proprio nel caso in
// cui serviva. L'offline copriva il caso raro (aereo mode) e non quello
// normale.
//
// La prova che conta e' l'ultima del secondo gruppo: la scadenza NON
// somiglia a un errore di rete — il suo messaggio e' "Ci sta mettendo
// troppo" — quindi `sembraRete` la rifiuta. Chi mettesse il tetto un
// livello piu' su, o togliesse `eScaduta` dalla condizione, tornerebbe ad
// avere i dati buoni in tasca e un cartello d'errore in faccia.

import { sembraRete } from '../src/lib/cache.js'
import { conScadenza, eScaduta, SCADUTA } from '../src/lib/scadenza.js'
import { SECONDI_LETTURA } from '../src/config/rete.js'
import { readFileSync } from 'node:fs'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio) console.log('       ', JSON.stringify(dettaglio))
  }
}

console.log('\nil numero e ragionevole')
prova('fra otto e quindici secondi', SECONDI_LETTURA >= 8 && SECONDI_LETTURA <= 15, {
  SECONDI_LETTURA,
})

console.log('\nla scadenza non somiglia a un guasto di rete')
{
  const scaduta = await conScadenza(new Promise(() => {}), 1).catch((e) => e)
  prova('e riconoscibile come scadenza', eScaduta(scaduta))
  prova('col codice pubblico', scaduta.code === SCADUTA)
  prova(
    'ma sembraRete la RIFIUTA, ed e il motivo per cui serve eScaduta',
    !sembraRete(scaduta, true),
    {
      messaggio: scaduta.message,
      aiuto:
        'se un giorno sembraRete la accettasse, la riga eScaduta in conCache diventerebbe ' +
        'ridondante ma innocua. Il contrario -- togliere eScaduta -- rompe tutto in silenzio',
    }
  )
}

console.log('\nsembraRete continua a fare il suo mestiere')
prova('una fetch morta e rete', sembraRete(new TypeError('Failed to fetch'), true))
prova('"load failed" di Safari pure', sembraRete(new Error('Load failed'), true))
prova('offline dichiarato: sempre rete', sembraRete(new Error('qualunque cosa'), false))
prova(
  'una tabella mancante NON e rete, e deve restare visibile',
  !sembraRete(new Error('relation "spese" does not exist'), true)
)
prova(
  'ne una regola di sicurezza che rifiuta',
  !sembraRete(new Error('new row violates row-level security policy'), true)
)

console.log('\nconCache e cucito come deve')
{
  // Non si puo' far girare conCache da riga di comando -- vuole
  // localStorage -- quindi si guarda com'e' scritto. Rete grossolana, ma
  // il difetto era invisibile e rimetterlo non romperebbe nient'altro.
  const testo = readFileSync(new URL('../src/lib/cache.js', import.meta.url), 'utf8')
  const corpo = testo.slice(testo.indexOf('export function conCache'))

  prova('la lettura ha un tetto di tempo', /conScadenza\(/.test(corpo))
  prova('preso dalla configurazione, non scritto a mano', /SECONDI_LETTURA/.test(corpo))
  prova(
    'il ripiego sulla copia accetta ANCHE lo scaduto',
    /if\s*\(\s*!eScaduta\(e\)\s*&&\s*!sembraRete\(/.test(corpo),
    { aiuto: 'senza eScaduta, una lettura appesa non serve la copia' }
  )
  prova(
    'anche la lettura senza chiave ha il tetto',
    /if \(!k\) return conScadenza\(/.test(corpo),
    { aiuto: 'senza copia da servire il tetto serve lo stesso: appesa inchioda chi aspetta' }
  )
}

console.log('\nchi modifica le spese aggiorna anche la copia')
{
  const testo = readFileSync(new URL('../src/hooks/useSpese.js', import.meta.url), 'utf8')
  prova('useSpese scrive in cache', /inCache\(/.test(testo), {
    aiuto: 'senza, la copia resta un passo indietro e il realtime rimette lo schermo com era prima',
  })
  prova('sia per le spese', /inCache\('spese'/.test(testo))
  prova('sia per i rimborsi', /inCache\('rimborsi'/.test(testo))
  prova(
    'e la ricarica fallita non finisce piu in un catch vuoto',
    !/ricarica\(\)\.catch\(\(\) => \{\}\)/.test(testo)
  )
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} falliti.\n`)
process.exit(falliti === 0 ? 0 : 1)

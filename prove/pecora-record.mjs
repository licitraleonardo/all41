// Chi tiene il record e chi si prende i punti. Da queste funzioni
// dipendono due Leggi, quindi vale la stessa attenzione dei conti delle
// Spese: qui un errore regala o toglie punti a qualcuno per davvero.

import {
  migliore,
  classificaDelGiorno,
  recordDelGiorno,
  recordDelViaggio,
  tuoRecord,
  giornateDaPremiare,
  premioDelViaggio,
} from '../src/lib/classificaPecora.js'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio) console.log('       ', JSON.stringify(dettaglio))
  }
}

const r = (membroId, giorno, punteggio) => ({ membroId, giorno, punteggio })

console.log('\nil migliore di una giornata')
prova('senza righe non c’è nessuno', migliore([]) === null)
prova(
  'vince chi ha fatto di più',
  migliore([r('a', '2026-08-12', 100), r('b', '2026-08-12', 250)])?.membroId === 'b'
)
prova(
  'in pareggio non vince nessuno',
  migliore([r('a', '2026-08-12', 250), r('b', '2026-08-12', 250)]) === null
)
prova(
  'un pareggio a tre nemmeno',
  migliore([
    r('a', '2026-08-12', 90),
    r('b', '2026-08-12', 90),
    r('c', '2026-08-12', 90),
  ]) === null
)
prova(
  'tutti a zero: nessun record',
  migliore([r('a', '2026-08-12', 0), r('b', '2026-08-12', 0)]) === null
)
prova(
  'chi ha zero non toglie il record a chi ha giocato',
  migliore([r('a', '2026-08-12', 0), r('b', '2026-08-12', 40)])?.membroId === 'b'
)

console.log('\nclassifica del giorno')
const righe = [
  r('a', '2026-08-12', 310),
  r('b', '2026-08-12', 120),
  r('c', '2026-08-12', 0),
  r('a', '2026-08-13', 90),
  r('b', '2026-08-13', 402),
  r('c', '2026-08-14', 155),
]

const oggi12 = classificaDelGiorno(righe, '2026-08-12')
prova('solo quel giorno', oggi12.length === 2, { oggi12 })
prova('dal più alto al più basso', oggi12[0].membroId === 'a' && oggi12[1].membroId === 'b')
prova('chi non ha ancora giocato resta fuori', !oggi12.some((x) => x.membroId === 'c'))
prova(
  'stesso ordine su ogni telefono',
  JSON.stringify(classificaDelGiorno([...righe].reverse(), '2026-08-12')) ===
    JSON.stringify(oggi12)
)

console.log('\ni due record')
prova('quello del giorno', recordDelGiorno(righe, '2026-08-13')?.membroId === 'b')
prova('cambia da un giorno all’altro', recordDelGiorno(righe, '2026-08-12')?.membroId === 'a')
prova(
  'quello del viaggio è la partita più alta di tutte',
  recordDelViaggio(righe)?.punteggio === 402
)
prova('e il suo detentore', recordDelViaggio(righe)?.membroId === 'b')
prova('il tuo di oggi', tuoRecord(righe, 'a', '2026-08-13') === 90)
prova('e zero se non hai giocato', tuoRecord(righe, 'c', '2026-08-13') === 0)

console.log('\nle giornate da premiare (Legge XX)')
const inizio = '2026-08-12'
const fine = '2026-08-16'

let premi = giornateDaPremiare(righe, '2026-08-14', inizio, fine)
prova('solo le giornate già chiuse', premi.length === 2, { premi })
prova('la giornata in corso non si premia', !premi.some((p) => p.giorno === '2026-08-14'))
prova(
  'una per giorno, col suo vincitore',
  premi[0].giorno === '2026-08-12' &&
    premi[0].membroId === 'a' &&
    premi[1].membroId === 'b'
)

premi = giornateDaPremiare(righe, '2026-08-12', inizio, fine)
prova('il primo giorno non ha ancora niente da premiare', premi.length === 0)

// Una giornata finita in pareggio salta il premio e non blocca le altre.
const conPareggio = [
  r('a', '2026-08-12', 200),
  r('b', '2026-08-12', 200),
  r('a', '2026-08-13', 300),
]
premi = giornateDaPremiare(conPareggio, '2026-08-14', inizio, fine)
prova('la giornata in pareggio si salta', premi.length === 1 && premi[0].giorno === '2026-08-13')

// Fuori dalle date del viaggio non si premia niente.
premi = giornateDaPremiare(
  [r('a', '2026-08-09', 900), r('a', '2026-08-20', 900)],
  '2026-08-21',
  inizio,
  fine
)
prova('le partite fuori dal viaggio non contano', premi.length === 0)

console.log('\nil premio di fine viaggio (Legge XXV)')
prova('durante il viaggio non si assegna', premioDelViaggio(righe, '2026-08-14', fine) === null)
prova('nemmeno l’ultimo giorno', premioDelViaggio(righe, '2026-08-16', fine) === null)
prova(
  'il giorno dopo sì',
  premioDelViaggio(righe, '2026-08-17', fine)?.membroId === 'b'
)
prova(
  'e in pareggio non lo prende nessuno',
  premioDelViaggio(
    [r('a', '2026-08-12', 500), r('b', '2026-08-13', 500)],
    '2026-08-17',
    fine
  ) === null
)

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} falliti.\n`)
process.exit(falliti === 0 ? 0 : 1)

// Quando l'app si scopre.
//
// ⚠️ Una data sbagliata qui non da' nessun errore: l'app resta coperta
// mentre il gruppo e' in Sardegna, oppure si apre due giorni prima e il
// primo che gioca si porta via le Leggi per tutti. Non c'e' nessun
// sintomo intermedio, ed e' per questo che ha una prova sua.

import { APERTURA, FORZA_APERTA, viaggioCominciato } from '../src/config/rilascio.js'
import { VIAGGIO } from '../src/config/viaggio.js'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio !== undefined) console.log('       ', JSON.stringify(dettaglio))
  }
}

console.log('\nprima delle 6 del 12 e tutto coperto')
{
  prova('il 10 sera', !viaggioCominciato(new Date('2026-08-10T23:59:00')))
  prova("l'11, tutto il giorno", !viaggioCominciato(new Date('2026-08-11T14:00:00')))
  // ⚠️ Il minuto prima. E' il caso che una data scritta storta sbaglia.
  prova('e perfino alle 5:59 del 12', !viaggioCominciato(new Date('2026-08-12T05:59:00')))
}

console.log('\ndalle 6 in poi si apre da solo')
{
  prova('alle 6 in punto', viaggioCominciato(new Date('2026-08-12T06:00:00')))
  prova('a mezzogiorno del 12', viaggioCominciato(new Date('2026-08-12T12:00:00')))
  prova('e per tutto il viaggio', viaggioCominciato(new Date('2026-08-16T20:00:00')))
  // ⚠️ E dopo resta aperto: a viaggio finito si guardano le foto, il
  // Testamento e la classifica. Chiudere a fine viaggio sarebbe togliere
  // il ricordo insieme al gioco.
  prova('e anche dopo, per guardare', viaggioCominciato(new Date('2026-09-01T10:00:00')))
}

console.log('\nl orario e quello del viaggio, non un altro')
{
  // Una data scritta a mano in due posti diversi e' una data che prima o
  // poi litiga con se stessa.
  prova("apre il giorno d'inizio del viaggio", APERTURA.slice(0, 10) === VIAGGIO.dataInizio, {
    apertura: APERTURA,
    viaggio: VIAGGIO.dataInizio,
  })
  prova('alle 6 del mattino', APERTURA.slice(11, 16) === '06:00')
}

console.log('\nl interruttore per provarla e spento')
{
  // ⚠️ Questa e' la riga che conta il 12 agosto. `FORZA_APERTA` serve a
  // provare l'app aperta senza aspettare, e dimenticata a `true` fa
  // uscire tutto scoperto: il primo che gioca si porta via le Leggi per
  // tutti, senza che nessuno se ne accorga.
  prova('FORZA_APERTA e null', FORZA_APERTA === null, FORZA_APERTA)
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} cose non vanno.\n`)
process.exit(falliti === 0 ? 0 : 1)

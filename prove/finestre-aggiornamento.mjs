// Quando l'app si ricarica da sola.
//
// ⚠️ Questa e' la prova di una cosa che puo' far danno.
//
// Una ricarica automatica portata via nel momento sbagliato e' il difetto
// n.33 corretto oggi -- l'app che si ricarica sotto le dita e si porta via
// il foglio della spesa compilato. Qui si sta rimettendo dentro una
// ricarica automatica: le condizioni che la tengono buona sono l'unica
// cosa che separa le due situazioni, e vanno tenute ferme.

import {
  ATTESA_MAX_MS,
  FINESTRE,
  attesaACaso,
  finestraDi,
  segnalibro,
  vaControllato,
} from '../src/lib/finestreAggiornamento.js'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio !== undefined) console.log('       ', JSON.stringify(dettaglio))
  }
}

const il = (ora, minuti = 0, giorno = 14) => new Date(2026, 7, giorno, ora, minuti, 0)

console.log('\nle due finestre sono le ore morte')
{
  prova('sono due', FINESTRE.length === 2, FINESTRE)
  prova('pomeriggio 14-16', finestraDi(il(15))?.nome === 'pomeriggio')
  prova('sera 21-23', finestraDi(il(22))?.nome === 'sera')
}

console.log('\ni bordi, uno per uno')
{
  // Il momento peggiore per una ricarica e' la mattina, mentre si carica
  // la macchina e si cerca l'itinerario. Quindi i bordi contano.
  prova('13:59 fuori', finestraDi(il(13, 59)) === null)
  prova('14:00 dentro', finestraDi(il(14, 0))?.nome === 'pomeriggio')
  prova('15:59 dentro', finestraDi(il(15, 59))?.nome === 'pomeriggio')
  prova('16:00 FUORI', finestraDi(il(16, 0)) === null)
  prova('20:59 fuori', finestraDi(il(20, 59)) === null)
  prova('21:00 dentro', finestraDi(il(21, 0))?.nome === 'sera')
  prova('23:00 FUORI', finestraDi(il(23, 0)) === null)

  // Le ore in cui succedono le cose: mai.
  for (const ora of [0, 6, 9, 11, 13, 17, 19, 20, 23]) {
    prova(`le ${ora} sono fuori`, finestraDi(il(ora)) === null)
  }
}

console.log('\nuna finestra per giorno, una volta sola')
{
  // Aprire l'app quattro volte alle 14:30 non fa quattro controlli.
  const alle1430 = segnalibro(il(14, 30))
  const alle1545 = segnalibro(il(15, 45))
  prova('lo stesso pomeriggio ha lo stesso segnalibro', alle1430 === alle1545, {
    alle1430,
    alle1545,
  })

  prova('gia fatta: non si rifa', !vaControllato({ ultimo: alle1430, adesso: il(15, 45) }))
  prova('non fatta: si fa', vaControllato({ ultimo: null, adesso: il(14, 30) }))

  // Sera e pomeriggio dello stesso giorno sono due cose diverse.
  prova('la sera e un altra finestra', segnalibro(il(22)) !== alle1430)
  prova('e si fa lo stesso', vaControllato({ ultimo: alle1430, adesso: il(22) }))

  // E domani si ricomincia.
  prova(
    'il pomeriggio di domani si rifa',
    vaControllato({ ultimo: alle1430, adesso: il(14, 30, 15) })
  )
}

console.log('\nfuori dalle finestre non si controlla mai')
{
  prova('alle 9', !vaControllato({ ultimo: null, adesso: il(9) }))
  prova('alle 17', !vaControllato({ ultimo: null, adesso: il(17) }))
  prova('a mezzanotte', !vaControllato({ ultimo: null, adesso: il(0, 30) }))
  prova('e non c e nemmeno il segnalibro', segnalibro(il(9)) === null)
}

console.log('\ncon qualcosa a meta a schermo NON si ricarica')
{
  // ⚠️ La condizione che separa questa cosa dal difetto n.33.
  //
  // Un foglio della spesa aperto contiene descrizione, importo, chi ha
  // pagato e diviso fra chi: quattro cose da rimettere, e sparivano senza
  // un messaggio. Un vocale in registrazione e' peggio ancora, perche'
  // quell'audio e' l'unica copia che esiste.
  prova(
    'occupato: non si controlla',
    !vaControllato({ ultimo: null, occupato: true, adesso: il(14, 30) })
  )
  prova(
    'libero: si controlla',
    vaControllato({ ultimo: null, occupato: false, adesso: il(14, 30) })
  )
  // Vale anche dentro la finestra e con la finestra non ancora fatta:
  // e' l'ultima parola, non una delle tre.
  prova(
    'occupato batte tutto il resto',
    !vaControllato({ ultimo: null, occupato: true, adesso: il(22) })
  )
}

console.log('\nl attesa a caso sta nei limiti')
{
  // Otto telefoni non devono chiedere tutti nello stesso secondo.
  prova('col caso a 0 parte subito', attesaACaso(0) === 0)
  prova('col caso a 1 sta sotto il tetto', attesaACaso(0.999) < ATTESA_MAX_MS)
  prova('il tetto e due minuti', ATTESA_MAX_MS === 120000)

  let min = Infinity
  let max = -Infinity
  for (let i = 0; i < 500; i++) {
    const a = attesaACaso()
    min = Math.min(min, a)
    max = Math.max(max, a)
    if (a < 0 || a >= ATTESA_MAX_MS) falliti += 1
  }
  prova('cinquecento tiri stanno tutti dentro', min >= 0 && max < ATTESA_MAX_MS, { min, max })
  // Se fosse sempre lo stesso numero, non servirebbe a niente.
  prova('e non sono tutti uguali', max - min > 10000, { min, max })
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} cose non vanno.\n`)
process.exit(falliti === 0 ? 0 : 1)

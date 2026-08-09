// La chiusura della caccia al tesoro. Da qui escono dei punti, quindi
// vale la stessa attenzione dei conti delle Spese.

import {
  votiAperti,
  cacciaChiusa,
  sfideDaMettereAiVoti,
  vincitoreDelVoto,
  chiusureDaFare,
  sfideVintePerPersona,
  vincitoreDellaCaccia,
} from '../src/lib/cacciaFinale.js'
import { CACCIA, SFIDE, scadenzaDelVoto } from '../src/config/sfide.js'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio) console.log('       ', JSON.stringify(dettaglio))
  }
}

const competitive = SFIDE.filter((s) => s.tipo === 'competitiva').map((s) => s.id)
const [A, B, C] = competitive
const foto = (id, autoreId) => ({ id, autoreId })

console.log('\nle date')
prova('durante il viaggio non si vota', !votiAperti('2026-08-15'))
prova('nemmeno l’ultimo giorno', !votiAperti('2026-08-16'))
prova('il 17 si apre', votiAperti('2026-08-17'))
prova('e non è ancora chiusa', !cacciaChiusa('2026-08-17'))

// ⚠️ Regola cambiata il 9 agosto, per decisione di Leonardo: `CACCIA.chiude`
// è l'ULTIMO GIORNO IN CUI SI VOTA, non il primo in cui non si vota più.
// Prima `cacciaChiusa` usava `>=`, quindi il 20 la caccia era già chiusa a
// mezzanotte mentre i bottoni restavano accesi tutto il giorno: chi votava
// il 20 vedeva il numero salire e non cambiava niente, e il premio da dieci
// punti andava a chi era in testa ventiquattr'ore prima.
prova('il 20 si vota ancora, fino a sera', !cacciaChiusa(CACCIA.chiude))
prova('il 21 è chiusa', cacciaChiusa('2026-08-21'))
prova('e resta chiusa dopo', cacciaChiusa('2026-09-01'))

console.log('\nquali sfide vanno ai voti')
const conDue = { [A]: [foto('f1', 'x'), foto('f2', 'y')], [B]: [foto('f3', 'x')] }

prova(
  'durante il viaggio nessuna',
  sfideDaMettereAiVoti(conDue, {}, {}, '2026-08-14').length === 0
)
let daVotare = sfideDaMettereAiVoti(conDue, {}, {}, '2026-08-17')
prova('dal 17 solo quelle con due foto', daVotare.length === 1 && daVotare[0] === A)
prova(
  'non si riapre un voto già aperto',
  sfideDaMettereAiVoti(conDue, {}, { [A]: { id: 'v1' } }, '2026-08-17').length === 0
)
prova(
  'né una già vinta',
  sfideDaMettereAiVoti(conDue, { [A]: { membroId: 'x' } }, {}, '2026-08-17').length === 0
)

console.log('\nchi vince un voto')
const inGara = [foto('f1', 'x'), foto('f2', 'y'), foto('f3', 'z')]
prova(
  'la più votata',
  vincitoreDelVoto({ fotoIds: ['f1', 'f2', 'f3'], conteggi: [1, 4, 2] }, inGara)?.membroId === 'y'
)
prova(
  'in pareggio nessuno',
  vincitoreDelVoto({ fotoIds: ['f1', 'f2'], conteggi: [3, 3] }, inGara) === null
)
prova(
  'senza voti nessuno',
  vincitoreDelVoto({ fotoIds: ['f1', 'f2'], conteggi: [0, 0] }, inGara) === null
)
prova('senza voto proprio nessuno', vincitoreDelVoto(null, inGara) === null)
prova(
  'se la foto vincitrice è sparita, nessuno',
  vincitoreDelVoto({ fotoIds: ['sparita'], conteggi: [5] }, inGara) === null
)

console.log('\ncosa si chiude alla fine')
const partecipazioni = {
  [A]: [foto('f1', 'x'), foto('f2', 'y')], // gara vera
  [B]: [foto('f3', 'z')], // uno solo
  [C]: [], // nessuno
}
const voti = { [A]: { fotoIds: ['f1', 'f2'], conteggi: [3, 1] } }

prova(
  'il 20, ultimo giorno di voto, non si chiude ancora niente',
  chiusureDaFare(partecipazioni, {}, voti, '2026-08-20').length === 0
)

// Il 21: la finestra e' passata, e adesso si assegna.
const chiusure = chiusureDaFare(partecipazioni, {}, voti, '2026-08-21')
prova('due chiusure su tre', chiusure.length === 2, { chiusure })
prova(
  'la gara la vince la più votata',
  chiusure.find((c) => c.sfidaId === A)?.membroId === 'x'
)
prova('e il motivo è il voto', chiusure.find((c) => c.sfidaId === A)?.motivo === 'voto')
prova(
  'chi è rimasto solo vince la sua',
  chiusure.find((c) => c.sfidaId === B)?.membroId === 'z'
)
prova(
  'col motivo giusto, che paga diversamente',
  chiusure.find((c) => c.sfidaId === B)?.motivo === 'solitario'
)
prova('la sfida senza foto resta senza vincitore', !chiusure.some((c) => c.sfidaId === C))

prova(
  'una gara finita in pareggio non si chiude',
  chiusureDaFare(
    { [A]: [foto('f1', 'x'), foto('f2', 'y')] },
    {},
    { [A]: { fotoIds: ['f1', 'f2'], conteggi: [2, 2] } },
    '2026-08-21'
  ).length === 0
)

console.log('\nil premio a chi ne ha vinte di più')
prova('senza vittorie nessun premio', vincitoreDellaCaccia({}) === null)

const vinte = {
  [A]: { membroId: 'x' },
  [B]: { membroId: 'x' },
  [C]: { membroId: 'y' },
}
prova('conta per persona', JSON.stringify(sfideVintePerPersona(vinte)) === '{"x":2,"y":1}')
prova('vince chi ne ha di più', vincitoreDellaCaccia(vinte)?.membroId === 'x')
prova('e si sa quante', vincitoreDellaCaccia(vinte)?.sfide === 2)

prova(
  'in pareggio non lo prende nessuno',
  vincitoreDellaCaccia({ [A]: { membroId: 'x' }, [B]: { membroId: 'y' } }) === null
)

// La collettiva non deve contare: l'hanno vinta tutti insieme.
const collettiva = SFIDE.find((s) => s.tipo === 'collettiva')
prova(
  'la collettiva resta fuori dal conto',
  vincitoreDellaCaccia({
    [collettiva.id]: { membroId: 'k' },
    [A]: { membroId: 'x' },
  })?.membroId === 'x'
)

console.log('\nquanti punti entrano in tutto')
const massimo = CACCIA.premioPrimo + competitive.length * CACCIA.puntiUnico
console.log(`  premio finale ${CACCIA.premioPrimo}`)
console.log(`  piu' al massimo ${competitive.length} × ${CACCIA.puntiUnico} se nessuno gareggia`)
console.log(`  totale peggiore: ${massimo} punti (prima erano 190)`)
prova('molto meno di prima', massimo < 190 / 2, { massimo })

console.log('\nsi vota per tutta la finestra, non per 24 ore')
{
  // Il difetto vecchio: la gara aperta il 17 scadeva il 18, mentre la
  // configurazione promette di poter votare fino al 20.
  const apertaIl17 = scadenzaDelVoto(new Date('2026-08-17T10:00:00'))
  prova('una gara aperta il 17 arriva al 20', apertaIl17.startsWith('2026-08-20'), { apertaIl17 })
  prova(
    'e non muore il 18',
    Date.parse(apertaIl17) > Date.parse('2026-08-18T23:59:59'),
    { apertaIl17 }
  )

  // Aperte in giorni diversi, stessa scadenza: la finestra è del gruppo,
  // non della singola gara.
  const apertaIl19 = scadenzaDelVoto(new Date('2026-08-19T22:00:00'))
  prova('chi apre il 19 scade insieme agli altri', apertaIl19 === apertaIl17, {
    apertaIl17,
    apertaIl19,
  })

  // Si vota tutto il giorno di chiusura, non fino alla sua mezzanotte
  // iniziale.
  prova(
    'il giorno di chiusura si vota fino a sera',
    Date.parse(apertaIl17) > Date.parse(`${CACCIA.chiude}T20:00:00`)
  )

  // Una gara che nasce dopo la finestra non nasce morta: senza questo,
  // chiudiScaduti la chiuderebbe prima che qualcuno possa votarla.
  const tardi = new Date('2026-08-25T12:00:00')
  const dopoLaFine = scadenzaDelVoto(tardi)
  prova('aperta in ritardo, ha comunque un giorno', Date.parse(dopoLaFine) > tardi.getTime(), {
    dopoLaFine,
  })

  prova('la finestra si apre prima di chiudersi', CACCIA.apreIlVoto < CACCIA.chiude)
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} falliti.\n`)
process.exit(falliti === 0 ? 0 : 1)

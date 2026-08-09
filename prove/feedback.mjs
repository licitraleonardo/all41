// Quando chiedere «com'e' che va?».
//
// La domanda e' delicata per la stessa ragione del banner della
// posizione: l'app si apre quaranta volte al giorno, e un cartello che
// torna troppo spesso si impara a chiudere senza leggerlo. A quel punto
// non serve piu' a niente, e in piu' da' fastidio.

import { prossimaVolta, vaChiestoFeedback } from '../src/lib/quandoChiedere.js'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio !== undefined) console.log('       ', JSON.stringify(dettaglio))
  }
}

const UN_GIORNO = 24 * 3600 * 1000
const il = (g, h = 12) => new Date(2026, 7, g, h, 0, 0)

console.log('\nnon prima di due giorni')
{
  const adesso = il(13)
  const q = prossimaVolta({ adesso, caso: 0 })
  prova('col caso a zero: esattamente due giorni', q.getTime() - adesso.getTime() === 2 * UN_GIORNO)

  const massimo = prossimaVolta({ adesso, caso: 0.999 })
  const scarto = massimo.getTime() - adesso.getTime()
  prova('col caso al massimo: sotto i tre giorni', scarto < 3 * UN_GIORNO, scarto / UN_GIORNO)
  prova('e comunque sopra i due', scarto >= 2 * UN_GIORNO)
}

console.log('\nl ora e a caso, e serve')
{
  // ⚠️ Con un intervallo fisso il cartello tornerebbe sempre alla stessa
  // ora del giorno — cioe' sempre nello stesso momento della giornata:
  // sempre a colazione, o sempre in spiaggia. Chi lo becca a colazione
  // impara che quello e' «il cartello di colazione» e lo chiude prima di
  // leggerlo.
  const adesso = il(13)
  const ore = new Set()
  for (let i = 0; i < 200; i++) ore.add(prossimaVolta({ adesso }).getHours())
  prova('duecento tiri danno ore diverse', ore.size > 8, ore.size)
}

console.log('\nnon si chiede quando non ha senso')
{
  const scaduta = il(13).toISOString()

  prova('scaduta e dentro il viaggio: si chiede', vaChiestoFeedback({ prossima: scaduta, adesso: il(15) }))

  // ⚠️ Mai il primo giorno: il 12 si arriva, si fa il check-in e si
  // scarica la macchina. Chiedere «com'e' che va?» a chi ha aperto l'app
  // da un'ora e' il modo piu' veloce per far chiudere il cartello a tutti
  // e otto senza leggerlo, e da li' in poi vale zero.
  prova(
    'il primo giorno NO',
    !vaChiestoFeedback({ prossima: scaduta, primoGiorno: true, adesso: il(12) })
  )

  prova(
    'fuori dal viaggio NO',
    !vaChiestoFeedback({ prossima: scaduta, dentroIlViaggio: false, adesso: il(20) })
  )

  // Prima volta: si programma e basta. Chi arriva deve poter usare l'app
  // prima che gli si chieda com'e'.
  prova('senza appuntamento NO', !vaChiestoFeedback({ prossima: null, adesso: il(15) }))

  prova(
    'appuntamento non ancora scaduto NO',
    !vaChiestoFeedback({ prossima: il(16).toISOString(), adesso: il(15) })
  )
}

console.log('\nun appuntamento storto non fa comparire il cartello per sempre')
{
  // La data arriva da localStorage, che puo' contenere qualunque cosa.
  prova('spazzatura', !vaChiestoFeedback({ prossima: 'boh', adesso: il(15) }))
  prova('vuoto', !vaChiestoFeedback({ prossima: '', adesso: il(15) }))
}

console.log('\nrimandarlo lo sposta davvero')
{
  // «Dopo» riprogramma come se avesse risposto: chi lo rimanda ha detto
  // qualcosa, e insistere fra due ore e' il modo di non farsi piu'
  // leggere.
  const adesso = il(15)
  const dopo = prossimaVolta({ adesso, caso: 0 }).toISOString()
  prova('subito dopo non si richiede', !vaChiestoFeedback({ prossima: dopo, adesso }))
  prova('e nemmeno il giorno dopo', !vaChiestoFeedback({ prossima: dopo, adesso: il(16) }))
  prova('due giorni dopo si', vaChiestoFeedback({ prossima: dopo, adesso: il(17, 13) }))
}

console.log('\nin cinque giorni di viaggio non capita piu di due volte')
{
  // Il conto che rende accettabile non avere un «no, mai piu'».
  let quante = 0
  let prossima = prossimaVolta({ adesso: il(12), caso: 0 }).toISOString()
  for (let g = 12; g <= 16; g++) {
    for (const ora of [9, 13, 18, 22]) {
      const adesso = il(g, ora)
      if (vaChiestoFeedback({ prossima, primoGiorno: g === 12, adesso })) {
        quante += 1
        prossima = prossimaVolta({ adesso, caso: 0 }).toISOString()
      }
    }
  }
  prova(`capita ${quante} volte in tutto il viaggio`, quante <= 2, quante)
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} cose non vanno.\n`)
process.exit(falliti === 0 ? 0 : 1)

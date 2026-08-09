// Da quando a quando dura una giornata.
//
// Le due meta' dell'app non erano d'accordo su cosa fosse "oggi".
// `dataDiOggi` usa il giorno del TELEFONO — e il commento nel file dice
// perche': alle 01:00 in Italia la data UTC e' ancora quella di ieri. Ma
// chi leggeva gli eventi di una giornata chiedeva al database
// `created_at >= '2026-08-14T00:00:00'`, senza fuso, e Postgres lo legge
// come mezzanotte UTC.
//
// D'estate in Italia sono due ore di scarto, e cadono nel punto peggiore:
// tutto quello che si guadagna fra mezzanotte e le due — le partite dopo
// cena — per il telefono era di oggi e per il database ancora di ieri.
// Non finiva in nessun MVP.

import { estremiDelGiorno, dataDiOggi } from '../src/lib/giorni.js'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio) console.log('       ', JSON.stringify(dettaglio))
  }
}

console.log('\nla giornata comincia e finisce a mezzanotte DEL TELEFONO')
{
  const { da, a } = estremiDelGiorno('2026-08-14')
  // Qualunque sia il fuso di chi lancia le prove, gli estremi devono
  // essere la mezzanotte locale: si controlla riconvertendoli.
  prova('l inizio e mezzanotte locale', new Date(da).getHours() === 0 && new Date(da).getMinutes() === 0)
  prova('e il giorno giusto', new Date(da).getDate() === 14)
  prova('la fine e mezzanotte del giorno dopo', new Date(a).getHours() === 0 && new Date(a).getDate() === 15)
  prova('durano esattamente un giorno', new Date(a) - new Date(da) === 24 * 3600 * 1000)
}

console.log('\nil buco delle due ore non c e piu')
{
  const { da, a } = estremiDelGiorno('2026-08-14')
  // L'una di notte del 14, ora locale: e' la partita a dama dopo cena.
  const unaDiNotte = new Date(2026, 7, 14, 1, 30, 0).toISOString()
  prova('l una di notte del 14 sta dentro il 14', unaDiNotte >= da && unaDiNotte < a)

  // E le 23:30 del 13 NON ci stanno.
  const seraPrima = new Date(2026, 7, 13, 23, 30, 0).toISOString()
  prova('le 23:30 del 13 restano nel 13', seraPrima < da)

  // Ne le 00:30 del 15.
  const notteDopo = new Date(2026, 7, 15, 0, 30, 0).toISOString()
  prova('le 00:30 del 15 sono gia del 15', notteDopo >= a)
}

console.log('\nnessun giorno perde o guadagna istanti')
{
  // Ogni istante di una serie appartiene a uno e un solo giorno: e' la
  // proprieta' che impedisce sia i buchi sia i doppi conteggi.
  const giorni = ['2026-08-12', '2026-08-13', '2026-08-14', '2026-08-15', '2026-08-16']
  const finestre = giorni.map((g) => ({ g, ...estremiDelGiorno(g) }))
  let attaccate = true
  for (let i = 1; i < finestre.length; i += 1) {
    if (finestre[i].da !== finestre[i - 1].a) attaccate = false
  }
  prova('le finestre si toccano senza sovrapporsi ne lasciare buchi', attaccate, { finestre })

  let ognunoAUnGiorno = true
  for (let ora = 0; ora < 24 * 5; ora += 1) {
    const istante = new Date(2026, 7, 12, ora, 17, 0).toISOString()
    const dentro = finestre.filter((f) => istante >= f.da && istante < f.a)
    if (dentro.length !== 1) ognunoAUnGiorno = false
  }
  prova('centoventi istanti, ognuno in un giorno solo', ognunoAUnGiorno)
}

console.log('\nle date storte non fanno danni')
{
  prova('fine mese passa al mese dopo', new Date(estremiDelGiorno('2026-08-31').a).getMonth() === 8)
  prova('fine anno passa all anno dopo', new Date(estremiDelGiorno('2026-12-31').a).getFullYear() === 2027)
  prova('il 29 febbraio di un bisestile esiste', new Date(estremiDelGiorno('2028-02-29').da).getDate() === 29)
}

console.log('\ndataDiOggi e estremiDelGiorno sono d accordo')
{
  const oggi = dataDiOggi()
  const { da, a } = estremiDelGiorno(oggi)
  const adesso = new Date().toISOString()
  prova('adesso sta dentro la finestra di oggi', adesso >= da && adesso < a, { oggi, da, a })
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} falliti.\n`)
process.exit(falliti === 0 ? 0 : 1)

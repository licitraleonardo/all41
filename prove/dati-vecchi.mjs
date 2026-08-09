// «Dati delle 18:04»: dire a schermo che si sta guardando una copia.
//
// Il campo `quando` esisteva gia' su ogni copia, si rileggeva a ogni
// ripiego, e finiva **solo in un `console.info`**. Cioe' l'app serviva
// dati di due ore prima senza dirlo da nessuna parte.
//
// La striscia «Niente rete» non bastava: guarda `navigator.onLine`, che
// con una tacca dice *sono online*. Proprio nel caso piu' comune — la
// rete che c'e' ma non risponde — non compariva niente.

import { oraDellaCopia } from '../src/hooks/useDatiVecchi.js'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio !== undefined) console.log('       ', JSON.stringify(dettaglio))
  }
}

const adesso = new Date(2026, 7, 14, 20, 30, 0)

console.log('\nl ora e basta, se e di oggi')
{
  // Chi legge sta guardando lo schermo adesso: «18:04» si confronta con
  // l'orologio senza doverci pensare, la data sarebbe rumore.
  const detto = oraDellaCopia(new Date(2026, 7, 14, 18, 4, 0).toISOString(), adesso)
  prova('dice l ora', detto === 'delle 18:04', detto)
  prova('e non la data', !/agosto|14/.test(detto ?? ''))
}

console.log('\nse e di un altro giorno lo dice')
{
  // ⚠️ Qui «delle 18:04» sarebbe una bugia: sembrerebbe di due ore fa e
  // invece e' di ventisei.
  const ieri = oraDellaCopia(new Date(2026, 7, 13, 18, 4, 0).toISOString(), adesso)
  prova('ieri lo dice', /ieri/.test(ieri ?? ''), ieri)
  prova('e tiene l ora', /18:04/.test(ieri ?? ''))

  const vecchia = oraDellaCopia(new Date(2026, 7, 10, 9, 0, 0).toISOString(), adesso)
  prova('piu' + ' in la si dice la data', /10 agosto/.test(vecchia ?? ''), vecchia)
}

console.log('\nuna data storta non manda a schermo «Invalid Date»')
{
  // La copia arriva da localStorage, che puo' contenere qualunque cosa.
  prova('niente', oraDellaCopia(null, adesso) === null)
  prova('spazzatura', oraDellaCopia('boh', adesso) === null)
  prova('numero', oraDellaCopia('', adesso) === null)
}

console.log('\nmezzanotte non e ieri')
{
  // Il confronto e' sul giorno del telefono, non sulle ore passate: alle
  // 00:30 una copia delle 23:50 e' di ieri, e dirlo e' giusto.
  const mezzanotte = new Date(2026, 7, 15, 0, 30, 0)
  const detto = oraDellaCopia(new Date(2026, 7, 14, 23, 50, 0).toISOString(), mezzanotte)
  prova('quaranta minuti prima, ma e ieri', /ieri/.test(detto ?? ''), detto)

  const stessaSera = oraDellaCopia(new Date(2026, 7, 15, 0, 10, 0).toISOString(), mezzanotte)
  prova('e le 00:10 sono di oggi', stessaSera === 'delle 00:10', stessaSera)
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} cose non vanno.\n`)
process.exit(falliti === 0 ? 0 : 1)

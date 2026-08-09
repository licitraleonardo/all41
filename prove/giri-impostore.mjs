// A quale partita appartiene ogni voto dell'Impostore.
//
// I voti non sono legati alla partita da nessuna chiave: la riga ha una
// sola colonna vote_id e ripartendo per un altro giro viene azzerata. Si
// ricostruisce per tempo — un voto e' dell'ultima partita cominciata prima
// di lui — e questo file esiste perche' quel raggruppamento puo' sbagliare
// senza dare nessun errore: le schede di un'altra partita sono id di
// persone veri e leciti, e diventerebbero indovini di una serata a cui non
// hanno partecipato.

import { votiPerPartita, giriTuttiNoti } from '../src/lib/giriImpostore.js'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio) console.log('       ', JSON.stringify(dettaglio))
  }
}

// Orari finti, comodi da leggere: t(1) e' un minuto dopo l'inizio.
const BASE = Date.parse('2026-08-14T21:00:00.000Z')
const t = (minuti) => new Date(BASE + minuti * 60000).toISOString()
const voto = (id, minuti) => ({ id, created_at: t(minuti) })
const ids = (elenco) => elenco.map((v) => v.id).join(',')

console.log('\nOgni voto va alla sua partita')
{
  const partite = [
    { id: 'A', creataIl: t(0) },
    { id: 'B', creataIl: t(30) },
  ]
  const voti = [voto('a1', 1), voto('a2', 12), voto('b1', 31), voto('b2', 40)]
  const per = votiPerPartita(partite, voti)

  prova('i voti di A sono i suoi', ids(per.A) === 'a1,a2', { A: ids(per.A) })
  prova('i voti di B sono i suoi', ids(per.B) === 'b1,b2', { B: ids(per.B) })
  prova('nessuna partita resta senza casella', 'A' in per && 'B' in per)
}

console.log('\nIl soffitto: i voti della partita dopo NON entrano in quella prima')
{
  const partite = [
    { id: 'A', creataIl: t(0) },
    { id: 'B', creataIl: t(30) },
  ]
  const per = votiPerPartita(partite, [voto('a1', 5), voto('b1', 35), voto('b2', 50)])
  prova('A non si prende niente di B', ids(per.A) === 'a1', { A: ids(per.A) })
  prova(
    'ed e proprio questo il difetto che si sta evitando',
    !per.A.some((v) => v.id.startsWith('b'))
  )
}

console.log('\nUna partita abbandonata fa comunque da confine')
{
  // ⚠️ Il caso per cui servono TUTTE le partite e non solo le finite.
  // B e' stata annullata a meta': i suoi voti non devono finire in A.
  const soloFinite = [
    { id: 'A', creataIl: t(0) },
    { id: 'C', creataIl: t(60) },
  ]
  const tutte = [...soloFinite, { id: 'B', creataIl: t(30) }]
  const voti = [voto('a1', 5), voto('b1', 35), voto('c1', 65)]

  const sbagliato = votiPerPartita(soloFinite, voti)
  prova(
    'con le sole finite, i voti dell abbandonata cadono in A',
    ids(sbagliato.A) === 'a1,b1',
    { A: ids(sbagliato.A) }
  )

  const giusto = votiPerPartita(tutte, voti)
  prova('con tutte le partite, A resta pulita', ids(giusto.A) === 'a1', { A: ids(giusto.A) })
  prova('e i voti dell abbandonata stanno con lei', ids(giusto.B) === 'b1')
  prova('C ha i suoi', ids(giusto.C) === 'c1')
}

console.log('\nIl voto d apertura nasce prima della sua partita')
{
  // creaPartita scrive il voto un istante PRIMA della riga della partita:
  // quello di B cade quindi nella finestra di A. Chi chiama lo toglie per
  // id — qui si controlla solo che non sparisca il resto.
  const partite = [
    { id: 'A', creataIl: t(0) },
    { id: 'B', creataIl: t(30) },
  ]
  const per = votiPerPartita(partite, [voto('a1', 5), voto('apertura-B', 29), voto('b1', 31)])
  prova('finisce in A, come dice l orologio', per.A.some((v) => v.id === 'apertura-B'))
  prova('ma B tiene i suoi giri veri', ids(per.B) === 'b1')
  prova(
    'ed e per questo che chi chiama toglie le aperture per id',
    ids(votiPerPartita(partite, [voto('a1', 5), voto('b1', 31)]).A) === 'a1'
  )
}

console.log('\nQuando non si sa dove mettere un voto')
{
  const partite = [{ id: 'A', creataIl: t(10) }]
  const per = votiPerPartita(partite, [voto('prima', 1), voto('dopo', 20)])
  prova('un voto piu vecchio di ogni partita non va a nessuno', ids(per.A) === 'dopo')
  prova('e non esplode', Array.isArray(per.A))
}
{
  prova('senza partite non esplode', Object.keys(votiPerPartita([], [voto('x', 1)])).length === 0)
  prova('senza voti nemmeno', ids(votiPerPartita([{ id: 'A', creataIl: t(0) }], []).A) === '')
  prova('con niente del tutto', Object.keys(votiPerPartita(null, null)).length === 0)
  prova(
    'una data illeggibile si butta invece di sballare tutto',
    ids(
      votiPerPartita(
        [{ id: 'A', creataIl: t(0) }],
        [{ id: 'storto', created_at: 'boh' }, voto('buono', 5)]
      ).A
    ) === 'buono'
  )
  prova(
    'e una partita senza data non fa da confine',
    ids(votiPerPartita([{ id: 'A', creataIl: t(0) }, { id: 'B' }], [voto('x', 40)]).A) === 'x'
  )
}

console.log('\nLo stesso raggruppamento su ogni telefono')
{
  const partite = [
    { id: 'A', creataIl: t(0) },
    { id: 'B', creataIl: t(30) },
  ]
  const voti = [voto('b2', 40), voto('a1', 5), voto('b1', 31), voto('a2', 12)]
  const per = votiPerPartita(partite, voti)
  prova('i voti escono in ordine di orario, non di arrivo', ids(per.A) === 'a1,a2')
  prova('anche per B', ids(per.B) === 'b1,b2')

  // Due partite cominciate nello stesso istante: serve una regola
  // qualunque purche' sia sempre la stessa.
  const gemelle = votiPerPartita(
    [{ id: 'zeta', creataIl: t(0) }, { id: 'alfa', creataIl: t(0) }],
    [voto('x', 5)]
  )
  const gemelleGirate = votiPerPartita(
    [{ id: 'alfa', creataIl: t(0) }, { id: 'zeta', creataIl: t(0) }],
    [voto('x', 5)]
  )
  prova(
    'a parita di istante la risposta non dipende dall ordine di arrivo',
    ids(gemelle.zeta) === ids(gemelleGirate.zeta) && ids(gemelle.alfa) === ids(gemelleGirate.alfa)
  )
}

console.log('\nSappiamo tutti i giri, o solo una parte?')
{
  prova('un giro, una scheda: si sa tutto', giriTuttiNoti({ giro: 1 }, [{}]))
  prova('un giro, zero schede: non si sa', !giriTuttiNoti({ giro: 1 }, []))
  prova('tre giri, tre schede: si sa tutto', giriTuttiNoti({ giro: 3 }, [{}, {}, {}]))
  prova('tre giri, due schede: ne manca una', !giriTuttiNoti({ giro: 3 }, [{}, {}]))
  prova('tre giri, quattro schede: si sa comunque', giriTuttiNoti({ giro: 3 }, [{}, {}, {}, {}]))
  prova('senza giro si assume uno', giriTuttiNoti({}, [{}]))
  prova('e senza schede no', !giriTuttiNoti({}, null))
  prova('senza niente non esplode', !giriTuttiNoti(null, null))
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} falliti.\n`)
process.exit(falliti === 0 ? 0 : 1)

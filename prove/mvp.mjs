// L'MVP di giornata. Da qui escono punti (la Legge XXI) e una scrittura
// che resta per sempre: se sbaglia un giorno, sbaglia in silenzio.

import {
  giorniDaChiudere,
  ieriRispettoA,
  mvpDelGiorno,
  magliaNeraDelGiorno,
  saldiDelGiorno,
} from '../src/lib/classifica.js'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio) console.log('       ', JSON.stringify(dettaglio))
  }
}

const ev = (membroId, punti, giorno, stato = 'approved') => ({
  membroId,
  punti,
  stato,
  creatoIl: `${giorno}T12:00:00.000Z`,
})

console.log('\nquali giorni si chiudono')
{
  prova(
    'dal primo giorno a ieri',
    giorniDaChiudere('2026-08-15', [], '2026-08-12').join() ===
      '2026-08-12,2026-08-13,2026-08-14'
  )
  prova(
    'oggi non si chiude: puo’ ancora cambiare',
    !giorniDaChiudere('2026-08-15', [], '2026-08-12').includes('2026-08-15')
  )
  prova(
    'quelli gia’ chiusi si saltano',
    giorniDaChiudere('2026-08-15', ['2026-08-12', '2026-08-13'], '2026-08-12').join() ===
      '2026-08-14'
  )
  prova(
    'il primo giorno stesso non ha niente da chiudere',
    giorniDaChiudere('2026-08-12', [], '2026-08-12').length === 0
  )
  prova(
    'un buco in mezzo si recupera',
    giorniDaChiudere('2026-08-16', ['2026-08-13'], '2026-08-12').join() ===
      '2026-08-12,2026-08-14,2026-08-15'
  )
  prova(
    'chi apre dopo mesi non chiude trecento giornate',
    giorniDaChiudere('2027-08-15', [], '2026-08-12').length === 30
  )
  prova('senza un primo giorno non fa niente', giorniDaChiudere('2026-08-15', [], null).length === 0)

  // Il cambio di mese e quello di anno sono i due punti dove le date
  // fatte a mano si rompono sempre.
  prova(
    'passa da un mese all’altro',
    giorniDaChiudere('2026-09-02', [], '2026-08-30').join() ===
      '2026-08-30,2026-08-31,2026-09-01'
  )
  prova(
    'e da un anno all’altro',
    giorniDaChiudere('2027-01-02', [], '2026-12-30').join() ===
      '2026-12-30,2026-12-31,2027-01-01'
  )
}

console.log('\nieri')
{
  prova('il giorno prima', ieriRispettoA('2026-08-15') === '2026-08-14')
  prova('a inizio mese', ieriRispettoA('2026-09-01') === '2026-08-31')
  prova('a capodanno', ieriRispettoA('2027-01-01') === '2026-12-31')
}

console.log('\nchi e’ l’MVP di quel giorno')
{
  const eventi = [
    ev('a', 5, '2026-08-13'),
    ev('a', -2, '2026-08-13'),
    ev('b', 4, '2026-08-13'),
    ev('c', 9, '2026-08-14'),
  ]

  const saldi = saldiDelGiorno(eventi, '2026-08-13')
  const mvp = mvpDelGiorno(saldi)
  prova('vince chi ha il saldo del giorno piu’ alto', mvp.membroId === 'b' && mvp.saldo === 4, mvp)
  prova(
    'gli eventi degli altri giorni non contano',
    !saldi.has('c'),
    [...saldi.entries()]
  )
}

{
  // Una giornata in cui nessuno ha guadagnato niente non ha un MVP: zero
  // non e' una vittoria, e nemmeno -1.
  const eventi = [ev('a', -3, '2026-08-13'), ev('b', -1, '2026-08-13')]
  const saldi = saldiDelGiorno(eventi, '2026-08-13')
  prova('senza guadagni non c’e’ MVP', mvpDelGiorno(saldi) === null)
  prova('ma la maglia nera si assegna', magliaNeraDelGiorno(saldi)?.membroId === 'a')
}

{
  const saldi = saldiDelGiorno([ev('a', 3, '2026-08-13', 'pending')], '2026-08-13')
  prova('le proposte non ancora votate non fanno MVP', mvpDelGiorno(saldi) === null)
}

{
  // Due a pari merito: ne esce uno solo e sempre lo stesso, altrimenti
  // due telefoni scriverebbero due vincitori diversi per lo stesso giorno.
  const eventi = [ev('a', 5, '2026-08-13'), ev('b', 5, '2026-08-13')]
  const uno = mvpDelGiorno(saldiDelGiorno(eventi, '2026-08-13'))
  const due = mvpDelGiorno(saldiDelGiorno([...eventi].reverse(), '2026-08-13'))
  prova('a pari merito ne esce comunque uno', uno !== null)
  prova(
    'a pari merito il vincitore non dipende dall’ordine',
    uno.membroId === due.membroId,
    { uno: uno.membroId, due: due.membroId }
  )
  prova('e a pari merito vince l’id piu’ basso', uno.membroId === 'a')

  // Lo stesso vale per la maglia nera: due telefoni non devono
  // affibbiarla a due persone diverse.
  const brutti = [ev('x', -4, '2026-08-13'), ev('y', -4, '2026-08-13')]
  const n1 = magliaNeraDelGiorno(saldiDelGiorno(brutti, '2026-08-13'))
  const n2 = magliaNeraDelGiorno(saldiDelGiorno([...brutti].reverse(), '2026-08-13'))
  prova('anche la maglia nera e’ stabile a pari merito', n1.membroId === n2.membroId, {
    n1: n1.membroId,
    n2: n2.membroId,
  })
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} prove fallite.\n`)
process.exit(falliti === 0 ? 0 : 1)

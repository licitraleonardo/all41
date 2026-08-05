// Le statistiche di ogni giocatore. Non danno punti, ma li mostrano: se
// contano male, il gruppo ci litiga sopra per cinque giorni.

import {
  TITOLI,
  VOCI,
  contaPerMembro,
  massimoPerMembro,
  tabella,
  titoli,
} from '../src/lib/statistiche.js'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio) console.log('       ', JSON.stringify(dettaglio))
  }
}

const MEMBRI = [
  { id: 'a', nome: 'Leo', punteggio: 12 },
  { id: 'b', nome: 'Miriam', punteggio: 30 },
  { id: 'c', nome: 'Test', punteggio: -4 },
]

console.log('\ncontare le righe')
{
  const righe = [
    { author_id: 'a' },
    { author_id: 'a' },
    { author_id: 'b' },
    { author_id: null },
    {},
  ]
  const c = contaPerMembro(righe)
  prova('conta per persona', c.a === 2 && c.b === 1, c)
  prova('le righe senza autore si buttano', !('null' in c) && !('undefined' in c), c)
  prova('chi non compare non ha una voce', c.c === undefined)
  prova('senza righe non esplode', Object.keys(contaPerMembro(null)).length === 0)
  prova(
    'sa contare anche dove la colonna si chiama diversamente',
    contaPerMembro([{ member_id: 'z' }], 'member_id').z === 1
  )
}

console.log('\nil massimo, non la somma')
{
  const partite = [
    { member_id: 'a', punteggio: 120 },
    { member_id: 'a', punteggio: 940 },
    { member_id: 'a', punteggio: 300 },
    { member_id: 'b', punteggio: 88 },
  ]
  const m = massimoPerMembro(partite, 'member_id', 'punteggio')
  prova('tiene la partita migliore', m.a === 940, m)
  prova('non le somma', m.a !== 1360)
  prova('e per chi ne ha una sola vale quella', m.b === 88)
}

console.log('\nla tabella')
{
  const conteggi = {
    messaggi: { a: 40, b: 3 },
    vocali: { b: 12 },
    foto: { a: 2, c: 9 },
    suoni: { a: 25 },
    leggi: { b: 4 },
    pecora: { a: 1500 },
  }
  const t = tabella({ membri: MEMBRI, conteggi })

  prova('una riga per ciascuno', t.length === 3)
  prova('chi non ha fatto niente resta in tabella', t.find((r) => r.id === 'c') !== undefined)
  prova('con degli zeri, non con dei buchi', t.find((r) => r.id === 'c').messaggi === 0)
  prova('i punti arrivano dal profilo', t.find((r) => r.id === 'b').punti === 30)
  prova('anche i punti negativi passano', t.find((r) => r.id === 'c').punti === -4)
  prova(
    'ogni voce dichiarata ha una colonna',
    VOCI.every((v) => t.every((r) => r[v.id] !== undefined)),
    t[0]
  )
}

console.log('\ni titoli')
{
  const conteggi = {
    messaggi: { a: 40, b: 3 },
    vocali: { b: 12 },
    foto: { a: 2, c: 9 },
    suoni: { a: 25 },
    leggi: { b: 4 },
    pecora: { a: 1500 },
  }
  const t = titoli(tabella({ membri: MEMBRI, conteggi }))
  const per = Object.fromEntries(t.map((x) => [x.voce, x]))

  prova('il chiacchierone è chi scrive di più', per.messaggi?.nome === 'Leo', per.messaggi)
  prova('la voce è chi manda più vocali', per.vocali?.nome === 'Miriam')
  prova('l’occhio è chi carica più foto', per.foto?.nome === 'Test')
  prova('il domatore è il record della Pecora', per.pecora?.nome === 'Leo')
  prova(
    'sotto il minimo il titolo non si assegna',
    per.foto.valore === 9 && !t.some((x) => x.voce === 'foto' && x.valore < 5)
  )
}

{
  // Nessuno ha fatto abbastanza: meglio nessun titolo che un titolo
  // dato a chi ha mandato due messaggi in cinque giorni.
  const t = titoli(tabella({ membri: MEMBRI, conteggi: { messaggi: { a: 2 } } }))
  prova('senza numeri veri non si assegna niente', t.length === 0, t)
}

{
  // A pari merito deve uscire sempre lo stesso, o due telefoni
  // mostrerebbero due campioni diversi con gli stessi numeri.
  const conteggi = { messaggi: { a: 20, b: 20 } }
  const dritto = titoli(tabella({ membri: MEMBRI, conteggi }))
  const rovescio = titoli(tabella({ membri: [...MEMBRI].reverse(), conteggi }))
  prova('a pari merito vince sempre lo stesso', dritto[0].id === rovescio[0].id, {
    dritto: dritto[0]?.id,
    rovescio: rovescio[0]?.id,
  })
}

{
  prova('senza dati non esplode', titoli(tabella({ membri: [], conteggi: {} })).length === 0)
  prova('ogni titolo punta a una voce vera', TITOLI.every((t) => VOCI.some((v) => v.id === t.voce)))
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} falliti.\n`)
process.exit(falliti === 0 ? 0 : 1)

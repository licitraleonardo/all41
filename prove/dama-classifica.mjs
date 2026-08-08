// La classifica della Dama: chi ha battuto chi, e come si contano
// vittorie, abbandoni e campione di giornata.
//
//   node prove/dama-classifica.mjs

import {
  campioneDelGiorno,
  classificaDama,
  comeEFinita,
  inCorsoPerMe,
  sfideDaAccettare,
} from '../src/lib/classificaDama.js'
import { mossaInTesto, mosseLegali, applicaMossa, partitaNuova } from '../src/lib/dama.js'

let falliti = 0
function prova(nome, ok, extra) {
  if (ok) console.log('  ok   ' + nome)
  else {
    falliti += 1
    console.error('  NO   ' + nome, extra ?? '')
  }
}

const A = 'aaaa', B = 'bbbb', C = 'cccc'
const TUTTI = [A, B, C]

// Una partita in cui il nero resta senza mosse: si gioca davvero, così
// il caso "vinta sulla scacchiera" non è finto.
function partitaGiocataFino() {
  // Il bianco mangia tutto: si gioca a caso finché uno non può muovere.
  let stato = partitaNuova()
  const mosse = []
  for (let i = 0; i < 400; i += 1) {
    const legali = mosseLegali(stato)
    if (legali.length === 0) break
    // preferisce sempre la presa più lunga: finisce in fretta
    const scelta = legali.reduce((a, b) => (b.prese.length > a.prese.length ? b : a))
    stato = applicaMossa(stato, scelta)
    mosse.push(mossaInTesto(scelta))
  }
  return mosse
}

console.log('\ncome finisce una partita')
{
  const aperta = { bianco: A, nero: B, mosse: [], stato: 'in-corso' }
  prova('appena aperta non è finita', comeEFinita(aperta).finita === false)

  const resa = { bianco: A, nero: B, mosse: ['42-33'], stato: 'abbandonata', abbandonataDa: B }
  const f = comeEFinita(resa)
  prova('abbandonando si perde', f.finita && f.vincitore === A && f.perdente === B)
  prova('e il motivo è l’abbandono', f.motivo === 'abbandono')

  // ⚠️ Anche chi abbandona da vincente perde: è il senso della resa.
  const resaDelBianco = { bianco: A, nero: B, mosse: [], stato: 'abbandonata', abbandonataDa: A }
  prova('chi molla perde comunque', comeEFinita(resaDelBianco).vincitore === B)

  const giocata = { bianco: A, nero: B, mosse: partitaGiocataFino(), stato: 'in-corso' }
  const g = comeEFinita(giocata)
  prova('una partita giocata fino in fondo è finita', g.finita)
  // Mangiando sempre il piu' possibile si finisce spesso in patta, ed e'
  // un esito legittimo: quello che conta e' che se c'e' un vincitore sia
  // uno dei due, e che a un vincitore corrisponda sempre un perdente.
  prova(
    'o c’è un vincitore fra i due, o è patta',
    g.motivo === 'patta' ? g.vincitore === null : g.vincitore === A || g.vincitore === B,
    g
  )
  prova(
    'vincitore e perdente vanno sempre in coppia',
    (g.vincitore === null) === (g.perdente === null)
  )
  prova('e non sono la stessa persona', g.vincitore === null || g.vincitore !== g.perdente)
}

console.log('\nla classifica')
{
  const partite = [
    { bianco: A, nero: B, mosse: [], stato: 'abbandonata', abbandonataDa: B },
    { bianco: A, nero: C, mosse: [], stato: 'abbandonata', abbandonataDa: C },
    { bianco: B, nero: C, mosse: [], stato: 'abbandonata', abbandonataDa: B },
    { bianco: A, nero: B, mosse: [], stato: 'in-corso' },
  ]
  const cl = classificaDama(partite, TUTTI)
  const per = Object.fromEntries(cl.map((r) => [r.id, r]))

  prova('A ha vinto due volte', per[A].vinte === 2)
  prova('C ne ha vinta una', per[C].vinte === 1)
  prova('B nessuna', per[B].vinte === 0)
  prova('B ha abbandonato due volte', per[B].abbandoni === 2)
  prova('le partite aperte non contano', per[A].vinte + per[A].perse === 2)
  prova('in cima c’è A', cl[0].id === A)

  // A parità di vittorie vince chi ha abbandonato di meno: perdere
  // giocando e mollare non sono la stessa cosa.
  const pari = [
    { bianco: A, nero: C, mosse: [], stato: 'abbandonata', abbandonataDa: C },
    { bianco: B, nero: C, mosse: [], stato: 'abbandonata', abbandonataDa: C },
    { bianco: C, nero: A, mosse: [], stato: 'abbandonata', abbandonataDa: C },
  ]
  const cl2 = classificaDama(pari, TUTTI)
  prova('a pari vittorie conta chi molla meno', cl2[0].id !== C)

  // Ordine deterministico: due telefoni, stessa fila.
  const rimescolate = [...pari].reverse()
  prova(
    'l’ordine non dipende da come arrivano le partite',
    JSON.stringify(classificaDama(pari, TUTTI).map((r) => r.id)) ===
      JSON.stringify(classificaDama(rimescolate, TUTTI).map((r) => r.id))
  )

  prova('chi non ha giocato è comunque in classifica', classificaDama([], TUTTI).length === 3)
}

console.log('\nil campione di giornata')
{
  const oggi = '2026-08-14'
  const ieri = '2026-08-13'
  const p = (v, perdente, quando) => ({
    bianco: v, nero: perdente, mosse: [], stato: 'abbandonata', abbandonataDa: perdente,
    creataIl: quando + 'T20:00:00Z',
  })

  prova('nessuna partita, nessun campione', campioneDelGiorno([], TUTTI, oggi) === null)
  prova(
    'chi ne ha vinte di più',
    campioneDelGiorno([p(A, B, oggi), p(A, C, oggi), p(B, C, oggi)], TUTTI, oggi) === A
  )
  // In pareggio non vince nessuno, come per le sfide: un titolo diviso
  // in due non è un titolo.
  prova(
    'in parità non vince nessuno',
    campioneDelGiorno([p(A, B, oggi), p(C, B, oggi)], TUTTI, oggi) === null
  )
  prova(
    'le partite di ieri non contano per oggi',
    campioneDelGiorno([p(A, B, ieri), p(A, C, ieri)], TUTTI, oggi) === null
  )
  prova(
    'ma contano per ieri',
    campioneDelGiorno([p(A, B, ieri), p(A, C, ieri)], TUTTI, ieri) === A
  )
}

console.log('\nquello che ti aspetta')
{
  const partite = [
    { id: '1', bianco: A, nero: B, mosse: [], stato: 'in-corso' },
    { id: '2', bianco: B, nero: A, mosse: [], stato: 'in-corso' },
    { id: '3', bianco: A, nero: C, mosse: [], stato: 'abbandonata', abbandonataDa: C },
    { id: '4', bianco: B, nero: C, mosse: [], stato: 'in-corso' },
  ]

  const mie = inCorsoPerMe(partite, A)
  prova('solo le mie e solo le aperte', mie.length === 2)
  prova('le finite restano fuori', !mie.some((p) => p.id === '3'))
  prova('quelle degli altri pure', !mie.some((p) => p.id === '4'))
  prova('tocca a me dove sono il bianco', mie.find((p) => p.id === '1').tuaMossa === true)
  prova('non tocca a me dove sono il nero', mie.find((p) => p.id === '2').tuaMossa === false)

  // Una sfida da accettare: sei il nero e TU non hai ancora mosso.
  const sfide = sfideDaAccettare(partite, A)
  prova('la sfida ricevuta è quella dove sono il nero', sfide.length === 1 && sfide[0].id === '2')
  prova('chi ha sfidato non ha niente da accettare', sfideDaAccettare(partite, B).length === 1)

  // ⚠️ Chi sfida e' il bianco e muove per primo: se l'invito sparisse
  // alla sua prima mossa — che e' la cosa piu' naturale da fare dopo aver
  // lanciato una sfida — chi e' stato sfidato non riceverebbe piu'
  // niente. E' successo davvero, provando a giocare.
  const soloIlBiancoHaMosso = [{ id: '2', bianco: B, nero: A, mosse: ['42-33'], stato: 'in-corso' }]
  prova(
    'l’invito resta dopo la mossa di chi ha sfidato',
    sfideDaAccettare(soloIlBiancoHaMosso, A).length === 1
  )

  // Appena rispondi tu, non e' piu' un invito: e' una partita.
  const hoRisposto = [{ id: '2', bianco: B, nero: A, mosse: ['42-33', '19-28'], stato: 'in-corso' }]
  prova('ma sparisce quando hai risposto', sfideDaAccettare(hoRisposto, A).length === 0)

  // E una partita abbandonata non invita nessuno.
  const chiusa = [{ id: '2', bianco: B, nero: A, mosse: [], stato: 'abbandonata', abbandonataDa: B }]
  prova('una partita chiusa non e’ un invito', sfideDaAccettare(chiusa, A).length === 0)
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} falliti.\n`)
process.exit(falliti === 0 ? 0 : 1)

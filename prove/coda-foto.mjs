// Le regole della coda delle foto.
//
// La prova che conta e' "una voce esce solo se e' arrivata o se l'hanno
// scartata". Era il difetto piu' grave di tutta la sezione: si toglieva la
// voce PRIMA di ritentare, quindi bastava che il ritentativo venisse
// rifiutato dal tetto giornaliero — non che fallisse: rifiutato — perche'
// una foto gia' al sicuro sul telefono sparisse per sempre. Con "Scatta"
// quella foto non e' nel rullino: non esisteva piu' da nessuna parte.

import {
  conVoce,
  inOrdine,
  mie,
  nuovaVoce,
  senzaVoce,
  soloInMemoria,
} from '../src/lib/codaFotoRegole.js'
import { MASSIMO_IN_CODA } from '../src/config/foto.js'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio) console.log('       ', JSON.stringify(dettaglio))
  }
}

const IO = 'io-123'
const ALTRO = 'altro-456'

// `salvata` non e' un campo dello scatto ma l'esito del tentativo di
// scriverla su IndexedDB, quindi nuovaVoce non lo conosce e lo lascia
// fuori: si attacca dopo, com'e' fatto in Album.jsx.
function voce(id, extra = {}) {
  const base = nuovaVoce({
    id,
    file: { nome: `finto-${id}` },
    nome: `${id}.jpg`,
    membroId: IO,
    quando: 1000,
    ...extra,
  })
  return { ...base, ...extra }
}

console.log('\nuna voce che entra')
{
  const { coda, entrata } = conVoce([], voce('a'))
  prova('entra', entrata)
  prova('ed e dentro', coda.length === 1 && coda[0].id === 'a')
  prova('la coda di partenza non e stata toccata', conVoce([], voce('a')).coda !== coda)
}
{
  const dopo = conVoce([voce('a')], voce('b')).coda
  prova('due voci diverse convivono', dopo.length === 2)
  prova('in ordine di arrivo', dopo[0].id === 'a' && dopo[1].id === 'b')
}

console.log('\nil ritentativo aggiorna, non duplica')
{
  const prima = [voce('a', { quando: 5000 }), voce('b', { quando: 7000 })]
  const dopo = conVoce(prima, voce('a', { quando: 99999, salvata: true })).coda
  prova('la coda non cresce', dopo.length === 2, { lunghezza: dopo.length })
  prova('non ci sono due voci con lo stesso id', new Set(dopo.map((v) => v.id)).size === 2)
  prova('la voce aggiornata resta al suo posto', dopo[0].id === 'a')
  prova(
    "l'ora dello scatto NON viene riscritta dal ritentativo",
    dopo[0].quando === 5000,
    { quando: dopo[0].quando }
  )
  prova('ma il resto si aggiorna', dopo[0].salvata === true)
  prova("l'altra voce non e stata toccata", dopo[1].quando === 7000)
}

console.log('\nil tetto della coda')
{
  const piena = Array.from({ length: MASSIMO_IN_CODA }, (_, i) => voce(`v${i}`))
  const { coda, entrata } = conVoce(piena, voce('nuova'))
  prova('a coda piena una voce nuova non entra', !entrata)
  prova('e la coda resta com era', coda.length === MASSIMO_IN_CODA)
  prova('la nuova non ci si e infilata', !coda.some((v) => v.id === 'nuova'))
}
{
  // Il caso che il tetto non deve rompere: e' una voce che c'e' gia'.
  const piena = Array.from({ length: MASSIMO_IN_CODA }, (_, i) => voce(`v${i}`))
  const { coda, entrata } = conVoce(piena, voce('v3', { salvata: false }))
  prova('a coda piena una voce che c e gia si aggiorna lo stesso', entrata)
  prova('senza far crescere la coda', coda.length === MASSIMO_IN_CODA)
  prova('e con il valore nuovo', coda.find((v) => v.id === 'v3').salvata === false)
}

console.log('\nesce solo per successo o per scarto')
{
  let coda = [voce('a'), voce('b')]
  // Cento tentativi andati male non tolgono niente.
  for (let i = 0; i < 100; i += 1) {
    coda = conVoce(coda, voce('a', { salvata: i % 2 === 0 })).coda
  }
  prova('cento ritentativi falliti non perdono la foto', coda.length === 2)
  prova('e nemmeno la duplicano', coda.filter((v) => v.id === 'a').length === 1)

  const dopo = senzaVoce(coda, 'a')
  prova('senzaVoce toglie quella giusta', dopo.length === 1 && dopo[0].id === 'b')
  prova('un id che non c e non toglie niente', senzaVoce(coda, 'mai-vista').length === 2)
  prova('e non modifica la coda di partenza', coda.length === 2)
}

console.log('\nla coda e di chi ha scattato')
{
  const coda = [
    voce('mia', { membroId: IO }),
    voce('sua', { membroId: ALTRO }),
    voce('vecchia', { membroId: undefined }),
  ]
  const nostre = mie(coda, IO)
  prova('la mia c e', nostre.some((v) => v.id === 'mia'))
  prova('quella di un altro no', !nostre.some((v) => v.id === 'sua'))
  prova(
    'una voce di prima che il campo esistesse si mostra lo stesso',
    nostre.some((v) => v.id === 'vecchia')
  )
  prova('quindi due su tre', nostre.length === 2)
  prova('e chi entra col codice di un altro vede solo le proprie', mie(coda, ALTRO).length === 2)
}

console.log('\nsi riprova in ordine di scatto')
{
  const coda = [voce('tardi', { quando: 9000 }), voce('presto', { quando: 100 })]
  const ordinata = inOrdine(coda)
  prova('la piu vecchia per prima', ordinata[0].id === 'presto')
  prova('la coda di partenza non viene rimescolata', coda[0].id === 'tardi')
  prova(
    'una voce senza ora non fa esplodere l ordinamento',
    inOrdine([voce('x', { quando: undefined }), voce('y', { quando: 5 })]).length === 2
  )
}

console.log('\nla sfida si porta dietro')
{
  const v = nuovaVoce({ id: 'a', file: {}, nome: 'a.jpg', membroId: IO, quando: 1, sfidaId: 'il-tuffo' })
  prova('lo sfidaId resta nella voce', v.sfidaId === 'il-tuffo')
  prova('senza sfida e null, non undefined', voce('b').sfidaId === null)
  const dopo = conVoce([], v).coda[0]
  prova('e sopravvive al giro in coda', dopo.sfidaId === 'il-tuffo')
}

console.log('\nquella che non e riuscita a salvarsi si riconosce')
prova('salvata false: vive solo in memoria', soloInMemoria({ salvata: false }))
prova('salvata true: no', !soloInMemoria({ salvata: true }))
prova('senza il campo: no, non si accusa senza saperlo', !soloInMemoria({}))

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} falliti.\n`)
process.exit(falliti === 0 ? 0 : 1)

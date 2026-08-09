// «Leo ha lanciato un sondaggio», «Si riparte fra 5 minuti».
//
// Il cartello che arriva mentre stai guardando un altro tab. Le regole
// stanno in `lib/avvisiRapidi.js` senza React e senza Supabase, apposta
// per poterle provare qui.

import { vaMostrato, descriviAvviso } from '../src/lib/avvisiRapidi.js'
import { AVVISI_RAPIDI } from '../src/config/azioni.js'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio !== undefined) console.log('       ', JSON.stringify(dettaglio))
  }
}

const adesso = new Date('2026-08-14T20:00:00Z')
const fresca = new Date('2026-08-14T19:58:00Z').toISOString()
const vecchia = new Date('2026-08-14T19:30:00Z').toISOString()

const base = {
  id: 'a1',
  autoreId: 'ALTRO',
  tipo: 'si_riparte',
  payload: { minuti: 5 },
  eliminato: false,
  creatoIl: fresca,
}

console.log('\nsi interrompe chi sta guardando altrove')
{
  prova('nelle foto si mostra', vaMostrato({ azione: base, ioId: 'IO', tab: 'foto', adesso }))
  prova('nel gioco si mostra', vaMostrato({ azione: base, ioId: 'IO', tab: 'gioco', adesso }))

  // ⚠️ Chi e' gia' nel Gruppo il messaggio ce l'ha davanti: un cartello
  // che ripete quello che stai leggendo e' solo una cosa da chiudere, e
  // uno che impara a chiudere i cartelli senza leggerli poi lo fa anche
  // quando conta.
  prova('nel gruppo NO', !vaMostrato({ azione: base, ioId: 'IO', tab: 'gruppo', adesso }))
}

console.log('\nil proprio non si annuncia a se stessi')
{
  // ⚠️ Questa e' la regola che mi ha fatto perdere mezz'ora provando: il
  // cartello non compariva e cercavo il difetto nel codice, mentre stavo
  // mandando i messaggi dallo stesso profilo con cui ero entrato. Il
  // codice faceva la cosa giusta.
  prova(
    'chi lo manda non lo riceve',
    !vaMostrato({ azione: { ...base, autoreId: 'IO' }, ioId: 'IO', tab: 'foto', adesso })
  )
}

console.log('\ndopo un po smette di essere una notizia')
{
  // Un «si riparte fra 5 minuti» di mezz'ora fa non e' piu' una notizia,
  // e' rumore: gli altri sono gia' in macchina.
  prova(
    'quello di mezz ora fa non si mostra',
    !vaMostrato({ azione: { ...base, creatoIl: vecchia }, ioId: 'IO', tab: 'foto', adesso })
  )
  prova(
    'al limite esatto non si mostra',
    !vaMostrato({
      azione: {
        ...base,
        creatoIl: new Date(adesso.getTime() - AVVISI_RAPIDI.minutiFreschi * 60000).toISOString(),
      },
      ioId: 'IO',
      tab: 'foto',
      adesso,
    })
  )
  prova(
    'un istante prima del limite si mostra',
    vaMostrato({
      azione: {
        ...base,
        creatoIl: new Date(
          adesso.getTime() - AVVISI_RAPIDI.minutiFreschi * 60000 + 1000
        ).toISOString(),
      },
      ioId: 'IO',
      tab: 'foto',
      adesso,
    })
  )
}

console.log('\nquello che non vale un cartello')
{
  // La chat normale ha gia' il pallino sull'icona, il suono si sente da
  // solo, e l'SOS ha la sua striscia che sta sopra a tutto e non si
  // chiude da sola.
  for (const tipo of ['free_text', 'soundboard', 'sos']) {
    prova(`«${tipo}» non interrompe`, !vaMostrato({ azione: { ...base, tipo }, ioId: 'IO', tab: 'foto', adesso }))
  }
  for (const tipo of AVVISI_RAPIDI.tipi) {
    prova(`«${tipo}» interrompe`, vaMostrato({ azione: { ...base, tipo }, ioId: 'IO', tab: 'foto', adesso }))
  }
}

console.log('\nle cose storte non lasciano un cartello inamovibile')
{
  prova('niente azione, niente cartello', !vaMostrato({ azione: null, ioId: 'IO', tab: 'foto', adesso }))
  prova(
    'ritirato nel frattempo',
    !vaMostrato({ azione: { ...base, eliminato: true }, ioId: 'IO', tab: 'foto', adesso })
  )
  // Una data illeggibile darebbe NaN: meglio niente cartello che uno che
  // non se ne va piu'.
  prova(
    'data storta',
    !vaMostrato({ azione: { ...base, creatoIl: 'boh' }, ioId: 'IO', tab: 'foto', adesso })
  )
  // Orologio del telefono avanti rispetto al server: il messaggio
  // sembra arrivare dal futuro. Non si mostra, invece di restare li'.
  prova(
    'arrivato dal futuro',
    !vaMostrato({
      azione: { ...base, creatoIl: new Date(adesso.getTime() + 60000).toISOString() },
      ioId: 'IO',
      tab: 'foto',
      adesso,
    })
  )
}

console.log('\nil cartello dice cosa e successo, non «nuovo messaggio»')
{
  // Il senso di interrompere e' che uno possa decidere se alzarsi senza
  // dover aprire niente.
  const riparte = descriviAvviso({ tipo: 'si_riparte', payload: { minuti: 5 } }, 'Leo')
  prova('dice quanti minuti', riparte.forte.includes('5'))
  prova('e chi lo dice', riparte.piano.includes('Leo'))

  const sondaggio = descriviAvviso({ tipo: 'poll', payload: { domanda: 'Pizza o pesce?' } }, 'Turi')
  prova('il sondaggio dice chi', sondaggio.forte.includes('Turi'))
  prova('e la domanda', sondaggio.piano.includes('Pizza o pesce?'))

  const dove = descriviAvviso({ tipo: 'dove_siete', payload: {} }, 'Anna')
  prova('«dove siete» dice chi chiede', dove.forte.includes('Anna'))

  // Senza nome non si rompe: succede con chi e' appena entrato e non e'
  // ancora nell'elenco dei membri.
  const senzaNome = descriviAvviso({ tipo: 'poll', payload: {} }, undefined)
  prova('senza nome dice «Qualcuno»', senzaNome.forte.includes('Qualcuno'))
  prova('e senza domanda dice qualcosa lo stesso', senzaNome.piano.length > 0)
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} cose non vanno.\n`)
process.exit(falliti === 0 ? 0 : 1)

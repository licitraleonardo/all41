// Cosa fa suonare i telefoni, e cosa no.
//
// ⚠️ Il file `public/push.js` e' uno script classico: lo tira dentro
// `importScripts` dal service worker, quindi non ha `export` e non si puo'
// importare. Invece di farne una seconda copia in ESM -- che fra un mese
// direbbe una cosa diversa mentre la prova continua a dire che va tutto
// bene -- si legge il file vero e lo si esegue in una scatola finta.
//
// Cosi' la copia resta una sola, ed e' quella che gira sui telefoni.

import { readFileSync } from 'node:fs'
import vm from 'node:vm'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio !== undefined) console.log('       ', JSON.stringify(dettaglio))
  }
}

// La scatola finta: quel tanto di service worker che serve al file per
// caricarsi senza esplodere.
const finto = {
  addEventListener() {},
  clients: { matchAll: async () => [] },
  registration: { getNotifications: async () => [], showNotification: async () => {} },
}
finto.self = finto
vm.createContext(finto)
vm.runInContext(readFileSync('public/push.js', 'utf8'), finto)

const { decidi, descrivi } = finto.__all41

console.log('\ncol file vero, non con una copia')
{
  prova('decidi c e', typeof decidi === 'function')
  prova('descrivi c e', typeof descrivi === 'function')
}

console.log('\ncon l app aperta davanti non suona niente')
{
  // Il cartello in cima all'app fa gia' il suo lavoro: una notifica di
  // sistema per una cosa che stai guardando e' solo una vibrazione da
  // zittire.
  for (const tipo of ['sos', 'si_riparte', 'dove_siete', 'free_text', 'vocale']) {
    prova(`${tipo} con l app aperta: niente`, decidi({ tipo, id: 'x', appAperta: true }) === null)
  }
}

console.log('\nl SOS suona sempre, e ogni volta')
{
  const uno = decidi({ tipo: 'sos', id: 'aaa', appAperta: false, giaMostrata: false })
  prova('si mostra', uno !== null)
  prova('e insiste', uno.renotify === true)

  // ⚠️ Due persone perse sono due cose diverse: la seconda non deve
  // sostituire la prima in silenzio.
  const due = decidi({ tipo: 'sos', id: 'bbb', appAperta: false, giaMostrata: true })
  prova('un secondo SOS si mostra lo stesso', due !== null)
  prova('e ha un suo posto', due.tag !== uno.tag, { uno: uno.tag, due: due.tag })
}

console.log('\nchat e vocali: una sola, e poi basta')
{
  // Un telefono che vibra venti volte durante una cena si mette in
  // silenzioso, e da quel momento non arriva piu' nemmeno l'SOS.
  const primo = decidi({ tipo: 'free_text', appAperta: false, giaMostrata: false })
  prova('il primo messaggio suona', primo !== null)
  prova('e non insiste', primo.renotify === false)
  prova(
    'il secondo NO',
    decidi({ tipo: 'free_text', appAperta: false, giaMostrata: true }) === null
  )

  const voce = decidi({ tipo: 'vocale', appAperta: false, giaMostrata: false })
  prova('il primo vocale suona', voce !== null)
  prova(
    'il secondo NO',
    decidi({ tipo: 'vocale', appAperta: false, giaMostrata: true }) === null
  )

  // Due file diverse: un messaggio non zittisce un vocale.
  prova('chat e vocali non si zittiscono a vicenda', primo.tag !== voce.tag)
}

console.log('\nle partenze suonano, il resto no')
{
  prova('si_riparte suona', decidi({ tipo: 'si_riparte', appAperta: false }) !== null)
  prova('dove_siete suona', decidi({ tipo: 'dove_siete', appAperta: false }) !== null)

  // Foto, punti, Leggi e suoni sono cose belle da trovare aprendo l'app,
  // non da farsi svegliare.
  for (const tipo of ['soundboard', 'poll', 'foto', 'legge', 'punto', undefined]) {
    prova(`${tipo} non suona`, decidi({ tipo, appAperta: false }) === null)
  }
}

console.log('\nquello che c e scritto sopra')
{
  const sos = descrivi({ tipo: 'sos', chi: 'Leo', payload: { motivo: 'Mi sono perso/a' } })
  // ⚠️ Sull'SOS il nome c'e', ed e' l'unica cosa che conta: chi legge deve
  // sapere chi andare a cercare senza aprire niente.
  prova('l SOS dice chi', sos.titolo.includes('Leo'))
  prova('e perche', sos.corpo.includes('perso'))

  const riparte = descrivi({ tipo: 'si_riparte', chi: 'Turi', payload: { minuti: 5 } })
  prova('la partenza dice quanti minuti', riparte.titolo.includes('5'))

  // ⚠️ Chat e vocali NON dicono chi ne' cosa: e' una notifica sola al
  // posto di venti, quindi "Marco ha scritto: ci vediamo alle 8" sarebbe
  // falso appena arriva il secondo messaggio.
  const chat = descrivi({ tipo: 'free_text', chi: 'Marco', payload: { testo: 'ci vediamo alle 8' } })
  prova('la chat non dice chi', !chat.titolo.includes('Marco') && !chat.corpo.includes('Marco'))
  prova('e non dice cosa', !chat.corpo.includes('alle 8'))

  // Senza nome non si rompe: succede con chi e' appena entrato.
  prova('senza nome dice Qualcuno', descrivi({ tipo: 'sos', payload: {} }).titolo.includes('Qualcuno'))
  prova('e senza motivo dice qualcosa', descrivi({ tipo: 'sos', payload: {} }).corpo.length > 0)
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} cose non vanno.\n`)
process.exit(falliti === 0 ? 0 : 1)

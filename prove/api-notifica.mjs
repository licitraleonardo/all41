// Le due decisioni dell'endpoint che manda le notifiche.
//
// Il resto di `api/notifica.js` gira solo su Vercel e si prova col
// telefono in mano. Queste due invece sono regole, e stanno in
// `api/_regole.js` apposta per poter essere provate qui.

import { DA_MANDARE, daNotificare, daTogliere } from '../api/_regole.js'
import { readFileSync } from 'node:fs'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio !== undefined) console.log('       ', JSON.stringify(dettaglio))
  }
}

console.log('\nsi manda solo quello che vale la pena')
{
  for (const t of ['sos', 'si_riparte', 'dove_siete', 'free_text', 'vocale']) {
    prova(`${t} si manda`, daNotificare(t))
  }
  // Un sondaggio ha gia' il cartello dentro l'app e non e' una cosa per
  // cui svegliare qualcuno. Foto, punti e Leggi nemmeno.
  for (const t of ['poll', 'soundboard', 'foto', 'legge', undefined, null, '']) {
    prova(`${t} NON si manda`, !daNotificare(t))
  }
}

console.log('\ne il server e il telefono sono d accordo su cosa')
{
  // ⚠️ Due elenchi in due file diversi: `api/_regole.js` decide **se**
  // mandare, `public/push.js` decide **come** mostrare. Se divergono,
  // il caso peggiore e' silenzioso: il server manda una cosa che il
  // telefono scarta, e nessuno se ne accorge mai.
  const push = readFileSync('public/push.js', 'utf8')
  for (const t of DA_MANDARE) {
    prova(`«${t}» lo conosce anche il service worker`, push.includes(`'${t}'`), t)
  }
}

console.log('\nle iscrizioni morte si tolgono, le altre no')
{
  const iscritti = [
    { endpoint: 'uno' },
    { endpoint: 'due' },
    { endpoint: 'tre' },
    { endpoint: 'quattro' },
  ]
  const esiti = [
    { status: 'fulfilled' },
    { status: 'rejected', reason: { statusCode: 410 } },
    { status: 'rejected', reason: { statusCode: 500 } },
    { status: 'rejected', reason: { statusCode: 404 } },
  ]
  const morte = daTogliere(esiti, iscritti)
  prova('la 410 si toglie', morte.includes('due'))
  prova('la 404 si toglie', morte.includes('quattro'))
  prova('quella andata bene resta', !morte.includes('uno'))

  // ⚠️ Un 500 del servizio di push, o una rete che non risponde, NON sono
  // un'iscrizione morta. Togliere anche quelle vorrebbe dire disiscrivere
  // il gruppo intero il giorno in cui il servizio ha un problema, e
  // nessuno se ne accorgerebbe finche' non serve.
  prova('la 500 RESTA', !morte.includes('tre'))
  prova('in tutto due', morte.length === 2, morte)

  // Errori senza codice: succede quando salta la rete.
  const senzaCodice = daTogliere([{ status: 'rejected', reason: {} }], [{ endpoint: 'x' }])
  prova('un errore senza codice non toglie niente', senzaCodice.length === 0)
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} cose non vanno.\n`)
process.exit(falliti === 0 ? 0 : 1)

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

console.log('\nl iscrizione non tocca la tabella a mano')
{
  // ⚠️ La trappola che ha fatto restare la tabella vuota, e «Accendi» sul
  // telefono senza effetto.
  //
  // `push_subscriptions` non ha nessuna policy: dal telefono non si
  // legge, non si scrive, non si cancella. Sembrava bastasse dare tre
  // policy di scrittura e nessuna di lettura — si scrive e non si legge,
  // no? — e invece il database rifiutava tutto **in silenzio**:
  //
  //   - `upsert` diventa `insert ... on conflict do update`, e per
  //     aggiornare la riga in conflitto Postgres deve prima leggerla
  //   - e perfino una `delete` mirata rispondeva «204, fatto» senza
  //     togliere niente: senza lettura quelle righe non sono visibili,
  //     quindi non ne cancella nessuna, e non lo dice
  //
  // Chi rimettesse una scrittura diretta qui rifarebbe lo stesso giro, e
  // se ne accorgerebbe solo perche' il tasto non fa niente.
  const lib = readFileSync('src/lib/notifiche.js', 'utf8')
    .split('\n')
    .filter((r) => !/^\s*(\/\/|\*|\/\*)/.test(r))
    .join('\n')

  prova('niente scrittura diretta sulla tabella', !lib.includes("from('push_subscriptions')"))

  // ⚠️ Il permesso NON e' l'iscrizione. Guardando solo il permesso il
  // tasto diceva «Spegni» a chi non era iscritto per niente, e non
  // restava nessun modo di iscriversi: il permesso resta concesso per
  // sempre, quindi premere Spegni non cambiava niente. Un vicolo cieco
  // senza nemmeno un messaggio che lo dicesse.
  const vista = readFileSync('src/components/ChiediNotifiche.jsx', 'utf8')
    .split('\n')
    .filter((r) => !/^\s*(\/\/|\*|\/\*)/.test(r))
    .join('\n')
  prova('il tasto guarda l iscrizione', vista.includes('statoIscrizione'))
  prova('e non il permesso', !vista.includes('statoNotifiche'))
  prova('e chiede se c e davvero un iscrizione', lib.includes('getSubscription'))

  // ⚠️ Il secondo vicolo cieco, dello stesso tipo del primo.
  //
  // Il browser puo' avere un'iscrizione che sul nostro database non c'e':
  // prima volta andata a meta', database svuotato, o il telefono che l'ha
  // rigenerata da solo. L'app diceva «✓ Accese» e non arrivava niente, e
  // l'unico tasto disponibile era «Spegni».
  //
  // Non si puo' chiedere al database se ci conosce -- la tabella non si
  // legge apposta -- quindi non si chiede: si riscrive a ogni apertura.
  prova('c e il riallineamento a ogni apertura', lib.includes('riallineaIscrizione'))
  const app = readFileSync('src/App.jsx', 'utf8')
  prova('e l app lo chiama davvero', app.includes('riallineaIscrizione(membro.id)'))
  prova('si iscrive con la funzione', lib.includes("rpc('iscrivi_push'"))
  prova('e si disiscrive con la funzione', lib.includes("rpc('disiscrivi_push'"))

  // E le funzioni devono poter scavalcare le policy, o non servirebbero.
  // ⚠️ Via i commenti prima di contare: in questo progetto i commenti
  // citano il codice che spiegano, e qui dentro «security definer» sta
  // scritto anche nella riga che ne racconta la ragione. E' la terza
  // volta oggi che questa distrazione mi manda in rosso una prova buona.
  const sql = readFileSync('supabase/push.sql', 'utf8')
    .split('\n')
    .filter((r) => !/^\s*--/.test(r))
    .join('\n')
  prova('le funzioni sono security definer', (sql.match(/security definer/g) ?? []).length === 2)
  prova('e la tabella non ha policy', !sql.includes('create policy'))
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} cose non vanno.\n`)
process.exit(falliti === 0 ? 0 : 1)

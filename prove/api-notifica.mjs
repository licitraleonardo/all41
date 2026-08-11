// Le due decisioni dell'endpoint che manda le notifiche.
//
// Il resto di `api/notifica.js` gira solo su Vercel e si prova col
// telefono in mano. Queste due invece sono regole, e stanno in
// `api/_regole.js` apposta per poter essere provate qui.

import { DA_MANDARE, daNotificare, daTogliere } from '../api/_regole.js'
import { GIORNO, oggiARoma } from '../api/sveglia.js'
import { VIAGGIO } from '../src/config/viaggio.js'
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


console.log('\nla sveglia del 12 suona una volta sola')
{
  // ⚠️ Il cron gira **ogni giorno**: se il controllo sul giorno fosse
  // storto, «All41 vi aspetta» arriverebbe tutte le mattine per sempre —
  // e nessuno se ne accorgerebbe finche' non comincia a dare fastidio.
  prova('il giorno e quello di partenza', GIORNO === VIAGGIO.dataInizio, {
    sveglia: GIORNO,
    viaggio: VIAGGIO.dataInizio,
  })

  // L'ora di Roma, non quella del server. Vercel gira in UTC.
  prova(
    'a mezzogiorno e mezza UTC del 12 e il 12',
    oggiARoma(new Date('2026-08-12T10:30:00Z')) === GIORNO
  )

  // ⚠️ Il caso che una data letta in UTC sbaglia: mezzanotte e mezza
  // italiana del 12 e' ancora l'11 secondo il server.
  prova(
    'e a mezzanotte e mezza italiana e gia il 12',
    oggiARoma(new Date('2026-08-11T22:30:00Z')) === GIORNO,
    oggiARoma(new Date('2026-08-11T22:30:00Z'))
  )

  // E gli altri giorni tace.
  prova('l 11 non suona', oggiARoma(new Date('2026-08-11T10:30:00Z')) !== GIORNO)
  prova('il 13 nemmeno', oggiARoma(new Date('2026-08-13T10:30:00Z')) !== GIORNO)
  prova('e un anno dopo neanche', oggiARoma(new Date('2027-08-12T10:30:00Z')) !== GIORNO)
}

console.log('\nil mittente della firma e un indirizzo vero')
{
  // ⚠️ Il difetto piu' costoso del progetto, e il piu' silenzioso.
  //
  // Il mittente era `mailto:all41@example.invalid`. `.invalid` e' un
  // dominio riservato che per definizione non esiste (RFC 2606), e i due
  // servizi di push non lo trattano allo stesso modo:
  //
  //   - Google non guarda il mittente e consegna lo stesso
  //   - Apple lo valida e rifiuta con 403 BadJwtToken
  //
  // Quattro persone su sette erano su iPhone e non hanno ricevuto una
  // notifica per tre giorni. Le prove si facevano su Android, quindi
  // risultava tutto a posto — ed e' esattamente perche' e' durato tanto:
  // il sintomo, «a me non arrivano», assomiglia a un permesso negato sul
  // telefono, che e' la prima cosa che uno va a guardare.
  const manda = readFileSync('api/_manda.js', 'utf8')
  const tolti = manda
    .split('\n')
    .filter((r) => !/^\s*(\/\/|\*|\/\*)/.test(r))
    .join('\n')
  const mittente = (tolti.match(/const MITTENTE = '([^']+)'/) ?? [])[1] ?? ''

  prova('il mittente c e', mittente.length > 0, mittente)
  prova(
    'ed e una mail o un indirizzo web',
    /^(mailto:[^@\s]+@[^@\s]+|https:\/\/\S+)$/.test(mittente),
    mittente
  )

  // ⚠️ E non un dominio riservato. Sono quelli che NON esistono per
  // definizione, e sono esattamente quelli che uno scrive quando mette un
  // segnaposto: Apple li rifiuta tutti.
  const finti = ['.invalid', '.example', '.test', '.localhost', 'example.com', 'example.org']
  const usato = finti.filter((f) => mittente.includes(f))
  prova('e non un dominio finto', usato.length === 0, { mittente, usato })

  // ⚠️ E lo strumento delle prove deve usare **lo stesso** mittente.
  //
  // E' la riga con i denti. Se qui fosse valido e in produzione no,
  // `npm run notifica` direbbe «mandate 5 su 5» mentre gli iPhone del
  // gruppo restano muti — cioe' lo strumento che serve a scoprire il
  // difetto diventerebbe la ragione per cui non lo si scopre.
  const strumento = readFileSync('strumenti/manda-notifica.mjs', 'utf8')
  prova('e la prova a mano usa lo stesso mittente', strumento.includes("'" + mittente + "'"), mittente)
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} cose non vanno.\n`)
process.exit(falliti === 0 ? 0 : 1)

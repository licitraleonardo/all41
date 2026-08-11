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
  // ⚠️ Una proposta non divide l'unica notifica della chat.
  //
  // «Una sola finche' non riapri» esiste per non far vibrare un telefono
  // venti volte a cena, e va tenuta. Ma con un posto solo per tutto, un
  // messaggio delle 20:10 zittiva la proposta delle 20:12 — e una
  // proposta ha un voto da dare e una scadenza, un messaggio no.
  const conProposta = { propostaVoto: 'v1' }
  const laProposta = decidi({
    tipo: 'free_text',
    appAperta: false,
    giaMostrata: false,
    payload: conProposta,
  })
  const laChat = decidi({ tipo: 'free_text', appAperta: false, giaMostrata: false })
  prova('la proposta suona', laProposta !== null)
  prova('e non condivide il posto con la chat', laProposta.tag !== laChat.tag, {
    proposta: laProposta.tag,
    chat: laChat.tag,
  })
  // ⚠️ E dentro il suo posto «una sola» vuol dire «una vibrazione sola»,
  // non «una notifica sola».
  //
  // Questa prova prima chiedeva che la seconda proposta sparisse — e
  // fissava il difetto invece della regola: restava a schermo la prima,
  // e chi guardava il telefono andava a votare la proposta sbagliata. La
  // seconda si mostra, prende il posto della prima, e non fa vibrare.
  const seconda = decidi({
    tipo: 'free_text',
    appAperta: false,
    giaMostrata: true,
    payload: conProposta,
  })
  prova('due proposte di fila: la seconda si vede', seconda !== null)
  prova('e non fa vibrare una seconda volta', seconda?.renotify === false, seconda)

  // ⚠️ E il payload deve arrivarci davvero.
  //
  // Se il punto in cui si chiama `decidi` smette di passarlo, il ramo qui
  // sopra non si accende **mai**: le proposte tornano a dividere il posto
  // con la chat e nessun errore lo dice. E' la stessa forma del difetto
  // che ha tenuto muta la proposta per un'ora.
  const sorgente = readFileSync('public/push.js', 'utf8')
  const quante = (sorgente.match(/payload: roba\.payload/g) ?? []).length
  prova('e chi chiama decidi lo passa, tutte e due le volte', quante === 2, quante)

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
  // ⚠️ Una proposta di punti passa da una riga di chat, e senza un caso
  // suo si annuncerebbe come «qualcuno ha scritto»: chi la legge non
  // saprebbe che c'e' un voto da dare.
  const prop = descrivi({
    tipo: 'free_text',
    chi: 'Marco',
    payload: { propostaVoto: 'v1', perNome: 'Diego', punti: 3, testo: 'ripiego' },
  })
  prova('una proposta dice chi propone', prop.titolo.includes('Marco'))
  prova('quanti punti', prop.titolo.includes('+3'))
  prova('e per chi', prop.titolo.includes('Diego'))
  prova('e non la frase della chat', !prop.titolo.includes('ha scritto'))

  // I punti negativi non diventano «+-2».
  const giu = descrivi({
    tipo: 'free_text',
    chi: 'Marco',
    payload: { propostaVoto: 'v1', perNome: 'Diego', punti: -2 },
  })
  prova('e un meno resta un meno', giu.titolo.includes('-2') && !giu.titolo.includes('+-'))

  // ⚠️ E un messaggio normale resta com'era: il caso nuovo non deve
  // rubarsi anche la chat.
  const normale = descrivi({ tipo: 'free_text', chi: 'Marco', payload: { testo: 'ciao' } })
  prova('un messaggio normale resta quello di prima', normale.titolo.includes('ha scritto'))

  prova('senza nome dice Qualcuno', descrivi({ tipo: 'sos', payload: {} }).titolo.includes('Qualcuno'))
  prova('e senza motivo dice qualcosa', descrivi({ tipo: 'sos', payload: {} }).corpo.length > 0)
}

console.log('\nle notifiche vecchie si chiudono quando riapri')
{
  // ⚠️ Il difetto che questa famiglia sorveglia e' costato tutte le
  // notifiche dopo la prima.
  //
  // «Una notifica di chat sola finche' non riapri» e' la regola giusta:
  // un telefono che vibra venti volte a cena si mette in silenzioso, e da
  // li' non arriva piu' nemmeno l'SOS. Ma l'unico posto che ne chiudeva
  // una era il tocco sulla notifica stessa. Chi apre l'app dall'icona
  // sulla home — cioe' quasi sempre — si lascia dietro quella vecchia, e
  // da quel momento il controllo la trova ancora li' e sta zitto per
  // sempre. Nessun errore: solo un telefono che smette di avvisarti.
  const pulizia = readFileSync('src/lib/notificheAperte.js', 'utf8')

  prova('si chiudono al ritorno in primo piano', /visibilitychange/.test(pulizia))
  prova('e si chiudono dalla pagina, non dal service worker', /getNotifications\(\)/.test(pulizia))

  // ⚠️ Dalla pagina e non dal service worker apposta: cosi' funziona su
  // ogni telefono com'e' adesso, senza aspettare che il service worker si
  // aggiorni insieme all'app.
  prova('e non passa da un messaggio al service worker', !/postMessage/.test(pulizia))

  // ⚠️ Ma l'SOS resta. Chi si e' perso non smette di esserlo perche' tu
  // hai guardato il telefono.
  // ⚠️ E si guarda che la regola sia **usata**, non che esista.
  // Scritta come `/\^sos-/.test(pulizia)` restava verde anche togliendo
  // la riga che la applica: la costante rimaneva li' dichiarata e
  // inutilizzata. E' il terzo controllo di presenza che mi frega.
  prova("l'SOS ha la sua eccezione", /DA_TENERE = /.test(pulizia))
  prova('e l eccezione viene applicata davvero', /DA_TENERE\.test\([^)]*\)\)\s*continue/.test(pulizia))

  // E l'attesa ha una scadenza: `serviceWorker.ready` non rifiuta mai, e
  // senza tetto ogni apertura lascerebbe una promessa appesa.
  prova('e l attesa del service worker ha una scadenza', /conScadenza\(/.test(pulizia))

  // Ed e' agganciata davvero: un modulo che nessuno chiama non chiude
  // niente.
  const avvio = readFileSync('src/main.jsx', 'utf8')
  prova('e qualcuno la aggancia all avvio', /tieniPulite\(\)/.test(avvio))
}

console.log('\nuna proposta nuova sostituisce quella vecchia')
{
  // Prima la seconda proposta veniva scartata perche' ce n'era gia' una a
  // schermo: niente vibrazione — accettabile — ma nemmeno il testo veniva
  // aggiornato. Restava scritta la prima, e chi guardava il telefono
  // andava a votare la proposta sbagliata.
  const conProposta = { propostaVoto: 'v2' }
  const seconda = decidi({
    tipo: 'free_text',
    appAperta: false,
    giaMostrata: true,
    payload: conProposta,
  })
  prova('la seconda proposta si mostra lo stesso', seconda !== null, seconda)
  prova('e prende il posto della prima', seconda?.tag === 'proposta', seconda)
  prova('senza far vibrare una seconda volta', seconda?.renotify === false, seconda)

  // ⚠️ E la chat normale resta com'era: la regola del «una sola» non si
  // tocca, che e' quella che tiene i telefoni fuori dal silenzioso.
  prova(
    'ma un messaggio di chat resta zitto',
    decidi({ tipo: 'free_text', appAperta: false, giaMostrata: true }) === null
  )
}

console.log('\ntoccare la notifica porta dove dice')
{
  // Il service worker manda `{all41: 'vaiA', tab}` alla finestra e apre
  // `/?tab=...` se non ce n'e' una. Nessuno dei due veniva ascoltato: una
  // notifica che diceva «Apri per votare» lasciava sul programma della
  // giornata.
  const app = readFileSync('src/App.jsx', 'utf8')
  prova('l app ascolta il messaggio del service worker', /all41 === 'vaiA'/.test(app))
  prova("e legge anche il tab dall'indirizzo", /searchParams.*'tab'|get\('tab'\)/.test(app))
  prova('e poi lo toglie dall indirizzo', /replaceState/.test(app))
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} cose non vanno.\n`)
process.exit(falliti === 0 ? 0 : 1)

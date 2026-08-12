// Quando si chiede di aggiornare la posizione e quando si sta zitti.
//
// Sono condizioni, non matematica, ma sbagliarle costa caro in modo
// silenzioso: un banner che compare troppo si impara a chiudere senza
// leggerlo, e da quel momento non serve piu' a niente.

// ⚠️ Prima dell'import: il modulo legge localStorage, che in node non
// esiste. Un finto deposito basta, e serve a provare l'unica cosa che
// conta qui — che il "no" duri un giorno e non uno in piu'.
const deposito = new Map()
globalThis.localStorage = {
  getItem: (k) => (deposito.has(k) ? deposito.get(k) : null),
  setItem: (k, v) => deposito.set(k, v),
}

const { readFileSync } = await import('node:fs')
const { vaChiesto, daQuanto, VECCHIA_DOPO_MINUTI, haDettoNoOggi, segnaRifiuto } = await import(
  '../src/lib/rinfrescaPosizione.js'
)

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio) console.log('       ', JSON.stringify(dettaglio))
  }
}

const adesso = new Date('2026-08-14T18:00:00')
const oreFa = (ore) => ({
  quando: new Date(adesso.getTime() - ore * 3600000).toISOString(),
})

console.log('\nquando si chiede')
prova(
  'posizione vecchia di tre ore: si chiede',
  vaChiesto({ mia: oreFa(3), adesso })
)
prova(
  'appena condivisa: si sta zitti',
  !vaChiesto({ mia: oreFa(0.2), adesso })
)
prova("un'ora fa: ancora buona", !vaChiesto({ mia: oreFa(1), adesso }))
prova(
  `esattamente ${VECCHIA_DOPO_MINUTI} minuti: si chiede`,
  vaChiesto({ mia: oreFa(VECCHIA_DOPO_MINUTI / 60), adesso })
)

console.log('\nchi non ha mai condiviso')
prova('mai condivisa: non si insiste', !vaChiesto({ mia: null, adesso }))
prova('senza data: nemmeno', !vaChiesto({ mia: {}, adesso }))

console.log('\nle tre risposte')
prova(
  '"non ora" zittisce questa apertura',
  !vaChiesto({ mia: oreFa(5), rimandato: true, adesso })
)
prova(
  '"no" zittisce tutta la giornata',
  !vaChiesto({ mia: oreFa(5), rifiutatoIl: '2026-08-14', adesso })
)
prova(
  'ma domani si richiede: e’ un’altra tappa',
  vaChiesto({ mia: oreFa(5), rifiutatoIl: '2026-08-13', adesso })
)

console.log('\nfuori dal viaggio')
prova(
  'a viaggio finito non interessa a nessuno',
  !vaChiesto({ mia: oreFa(9), dentroIlViaggio: false, adesso })
)

console.log('\nda quanto, in parole')
prova('tre ore', daQuanto(oreFa(3).quando, adesso) === 'da 3 ore')
prova('poco piu di due: si arrotonda giu', daQuanto(oreFa(2.2).quando, adesso) === 'da 2 ore')
// Il ramo "un paio d'ore" non lo si vede quasi mai, perche' il banner
// non compare prima delle due: e' li' come rete, non come caso normale.
prova('sotto le due ore', daQuanto(oreFa(1.5).quando, adesso) === 'da un paio d’ore')
prova('ieri', daQuanto(oreFa(26).quando, adesso) === 'da ieri')
prova('tre giorni', daQuanto(oreFa(74).quando, adesso) === 'da 3 giorni')

console.log('\nil «no» di oggi vale anche dove non c era quando l hai detto')
{
  // ⚠️ Questa prova nasce da una strada nuova, non da un difetto.
  //
  // Il «no» si diceva a un banner. Adesso la posizione si aggiorna anche
  // toccando il mondino accanto al conto alla rovescia -- una strada che
  // quel giorno non esisteva. Chi ha risposto «no» ha risposto una volta
  // sola, e quel no deve valere anche di la': se no basta aggiungere un
  // pulsante da qualche parte per scavalcare una risposta gia' data.
  // ⚠️ L'una di notte, e non e' un'ora scelta a caso.
  //
  // Il no si segna col giorno **locale**. All'una in Italia la data UTC
  // e' ancora quella di ieri: se qualcuno qui dentro passasse a
  // toISOString, un no detto all'una verrebbe segnato al giorno prima e
  // sarebbe gia' scaduto un secondo dopo averlo detto. Alle 23:30 questa
  // prova sarebbe verde comunque -- a quell'ora le due date coincidono e
  // non proverebbe niente.
  const unaDiNotte = new Date('2026-08-13T01:00:00')

  prova('senza aver detto niente, niente no', !haDettoNoOggi(unaDiNotte))

  segnaRifiuto(unaDiNotte)
  prova('detto no, vale subito', haDettoNoOggi(unaDiNotte))
  prova('e vale ancora il pomeriggio dopo', haDettoNoOggi(new Date('2026-08-13T17:00:00')))

  // Il giorno dopo e' un'altra tappa, e la risposta puo' cambiare.
  prova('ma non il giorno dopo', !haDettoNoOggi(new Date('2026-08-14T09:00:00')))
}

console.log('\nchi ha acceso l automatico non se lo sente chiedere')
{
  // ⚠️ Nel caso normale questa regola non serve: con l'automatico acceso
  // la posizione e' sempre fresca e la soglia non arriva mai. Serve al
  // caso di bordo, che e' quello che rompeva: app chiusa per piu' di due
  // ore, la riapri, e partono insieme il banner e l'aggiornamento
  // automatico. Il banner non se ne va — chi lo disegna non sa niente
  // dell'invio appena fatto — e ti chiede di aggiornare una posizione
  // mandata due secondi prima.
  const vecchia = { quando: new Date(adesso.getTime() - 5 * 3600 * 1000).toISOString() }

  prova('senza automatico, dopo cinque ore si chiede', vaChiesto({ mia: vecchia, adesso }))
  prova(
    'con l automatico acceso non si chiede',
    !vaChiesto({ mia: vecchia, automatica: true, adesso })
  )

  // E resta una promessa che si puo' ritirare: se il telefono nega il
  // permesso l'interruttore si spegne da solo, e da li' il banner torna
  // a comparire come per tutti gli altri.
  prova(
    'e spegnendolo il banner torna',
    vaChiesto({ mia: vecchia, automatica: false, adesso })
  )

  // ⚠️ E chi chiama la regola deve passarle davvero l'interruttore.
  //
  // Il valore ha un default a `false`: smettendo di passarlo, la regola
  // continua a funzionare senza lamentarsi, risponde «chiedi» a tutti, e
  // il banner torna esattamente com'era. Nessun errore da nessuna parte
  // — solo il difetto che torna.
  const gancio = readFileSync('src/hooks/useRinfrescaPosizione.js', 'utf8')
  prova('il gancio passa l interruttore alla regola', gancio.includes('automatica: posizioneAutomatica()'))
}

console.log('\nla mappa e l interruttore sono la stessa decisione')
{
  // ⚠️ Condividere la posizione **e'** dire di si' all'aggiornamento
  // automatico: una volta che l'hai data, tenerla vecchia non serve a
  // nessuno. Non e' l'automatismo di nascosto tolto il 10 agosto —
  // quello partiva da un tocco che voleva dire «guardo dove sono gli
  // altri», questo dal tasto che dice «condividi la mia posizione».
  const mappa = readFileSync('src/components/Posizioni.jsx', 'utf8')

  const condividi = mappa.slice(mappa.indexOf('async function condividi'), mappa.indexOf('async function smetti'))
  prova('condividere accende l automatico', /impostaPosizioneAutomatica\(true\)/.test(condividi))
  prova('e lo dice a schermo invece di lasciarlo sottinteso', /a ogni apertura/.test(condividi), condividi.slice(-200))

  // ⚠️ E toglierla lo spegne, o «Togli la mia posizione» sarebbe un tasto
  // che non fa niente per piu' di un minuto: alla prima apertura la
  // posizione tornerebbe su da sola.
  const smetti = mappa.slice(mappa.indexOf('async function smetti'))
  prova('e toglierla lo spegne', /impostaPosizioneAutomatica\(false\)/.test(smetti.slice(0, 700)))

  // La nota in fondo alla mappa diceva «non si aggiorna da sola» sempre.
  // Da quando esiste l'aggiornamento all'apertura, per chi ce l'ha acceso
  // e' falso — e una schermata che dice una cosa falsa sulla posizione
  // degli altri e' peggio di una che non dice niente.
  prova('e la nota in fondo cambia con l interruttore', /posizioneAutomatica\(\)\s*\?/.test(mappa))

  // Il tasto resta pulito: niente sottotitoli che spiegano.
  const interruttore = readFileSync('src/components/InterruttorePosizione.jsx', 'utf8')
  prova('e l interruttore non ha didascalie', !/posizione-sotto/.test(interruttore))
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} falliti.\n`)
process.exit(falliti === 0 ? 0 : 1)

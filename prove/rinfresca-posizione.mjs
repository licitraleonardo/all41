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

console.log('\nnon c e nessuna preferenza da salvare')
{
  // ⚠️ La prima versione teneva un interruttore in `localStorage`.
  // Sembrava giusto — «scegli tu» — ed era sbagliato per un motivo che si
  // e' visto solo usandolo: chi aveva condiviso la posizione **prima** che
  // l'interruttore esistesse ce l'aveva spento, quindi continuava a
  // ricevere il cartello «la tua posizione e' vecchia» e non si
  // aggiornava niente. Cioe' tutti.
  //
  // Lo stato adesso e' dedotto — hai una posizione condivisa piu' il
  // permesso del telefono — e uno stato dedotto non puo' disallinearsi da
  // quello che vedi, ne' ha bisogno di essere migrato per chi c'era prima.
  const auto = readFileSync('src/lib/posizioneAutomatica.js', 'utf8')
  // Si guarda l'**uso**, non la parola: qui sopra localStorage e' citato
  // nel commento che spiega perche' non c'e' piu'.
  prova(
    'niente preferenza salvata',
    !auto.includes('localStorage.getItem') && !auto.includes('localStorage.setItem')
  )
  prova('e il permesso si guarda, non si chiede', auto.includes('permissions.query'))

  const gancio = readFileSync('src/hooks/useRinfrescaPosizione.js', 'utf8')
  prova('si riaggiorna solo se hai gia condiviso', gancio.includes('mia?.quando'))
  prova('e solo col permesso gia dato', gancio.includes('permessoGiaDato()'))
  prova('e lo dice ogni volta', gancio.includes('setAppenaAggiornata'))

  // ⚠️ E il cartello resta solo per chi al telefono ha detto di no. A
  // tutti gli altri si chiedeva di fare a mano una cosa che stava gia'
  // succedendo: il cartello compariva mentre la posizione ripartiva, e
  // non se ne andava.
  prova(
    'il cartello resta solo a chi ha negato il permesso',
    gancio.includes('automatica: !telefonoHaDettoNo')
  )

  // Il comando e' la mappa, e uno solo: l'interruttore in Info non c'e' piu'.
  const info = readFileSync('src/components/Info.jsx', 'utf8')
  prova('niente interruttore in Info', !info.includes('InterruttorePosizione'))

  const mappa = readFileSync('src/components/Posizioni.jsx', 'utf8')
  prova('e la mappa non salva nessuna preferenza', !mappa.includes('impostaPosizioneAutomatica'))
  prova('ma dice che da li in poi riparte', mappa.includes('riparte a ogni apertura'))
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} falliti.\n`)
process.exit(falliti === 0 ? 0 : 1)

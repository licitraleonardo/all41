import { attesaACaso, segnalibro, vaControllato } from './finestreAggiornamento.js'

// Tenere aggiornata l'app installata sulla home.
//
// Il service worker si aggiorna da solo, ma il browser decide lui quando
// andare a controllare: dentro una PWA aperta e chiusa dieci volte al
// giorno puo' voler dire restare a una versione di ieri senza che nessuno
// se ne accorga, e senza il tasto ricarica per rimediare. E' successo
// davvero, con la copia installata ferma a undici commit prima.
//
// Qui il controllo si chiede noi, ogni volta che l'app torna in primo
// piano. Costa una richiesta di pochi byte a un file che il server dice
// di non mettere in cache, e toglie di mezzo tutta la danza di chiudere
// e riaprire due volte.

// Se c'è qualcosa a metà a schermo, la ricarica aspetta.
//
// ⚠️ Prima ricaricava e basta, e la pagina si portava via quello che stavi
// facendo: il foglio della spesa compilato — descrizione, importo, chi ha
// pagato, divisa fra chi — spariva senza un messaggio, e con lui il
// messaggio in chat scritto a metà, la registrazione di un vocale in corso
// e la partita alla Pecora. Nessun avviso, nessun modo di capire cos'era
// successo: l'app semplicemente ricominciava.
//
// Chi ha un foglio aperto lo dichiara qui. La ricarica non viene annullata
// — la versione nuova serve — solo rimandata a quando lo schermo è di
// nuovo vuoto, che di solito sono pochi secondi.
const occupati = new Set()

export function tieniOccupato(motivo) {
  occupati.add(motivo)
  return () => occupati.delete(motivo)
}

export function siPuoRicaricare() {
  return occupati.size === 0
}

// ⚠️ La via d'uscita a mano, per quando l'automatismo qui sotto non parte.
//
// Dentro una PWA installata sulla home il controllo automatico a volte non
// scatta: il sistema tiene l'app congelata per giorni e non la riapre mai
// per davvero, quindi `visibilitychange` non arriva e `update()` non viene
// mai chiesto. Lì dentro non c'è barra dell'indirizzo, non c'è tasto
// ricarica, e chiudere l'app non basta perché non è mai stata chiusa.
//
// Tre gradini, dal più gentile al più deciso:
//
//   1. si chiede al service worker di controllare
//   2. se ce n'è uno pronto in attesa, lo si fa entrare subito
//   3. se dopo tutto questo non è cambiato niente, si butta via la cache
//      e si ricarica. È il martello, ma funziona sempre.
//
// ⚠️ Il terzo gradino costa la copia offline, che va riscaricata. Vale la
// pena solo perché lo preme una persona che ha appena constatato che
// l'app è ferma: a quel punto l'alternativa è restare indietro.
// I dati non si toccano — `localStorage` resta dov'è, e con lui il
// profilo, il segnalibro dei tab e le copie dei dati.
export async function forzaAggiornamento() {
  if (!('serviceWorker' in navigator)) {
    window.location.reload()
    return 'ricarico'
  }

  const registrazione = await navigator.serviceWorker.getRegistration().catch(() => null)

  if (registrazione) {
    await registrazione.update().catch(() => {})

    // Uno nuovo è pronto o sta arrivando: `controllerchange` ricarica da
    // sé appena prende il comando.
    //
    // ⚠️ Niente `postMessage({type: 'SKIP_WAITING'})`: il service worker
    // che generiamo (`registerType: 'autoUpdate'`) chiama `skipWaiting()`
    // da solo appena installato e **non ascolta nessun messaggio** — l'ho
    // verificato cercandolo in `dist/sw.js`, non c'è. Mandarglielo
    // sarebbe una riga che sembra fare qualcosa e non fa niente, e la
    // prossima persona che legge questo file ci crederebbe.
    if (registrazione.waiting || registrazione.installing) return 'in-arrivo'
  }

  // Niente di nuovo dal service worker. Può voler dire due cose: che siamo
  // davvero all'ultima, o che la cache è incastrata su una versione
  // vecchia e il controllo non se ne accorge. Si distingue chiedendo al
  // server la pagina, saltando ogni cache.
  //
  // ⚠️ Con un pezzo di indirizzo che cambia ogni volta, e non `/index.html`
  // liscio. `cache: 'reload'` salta la cache del browser ma **non il
  // service worker**, che ha `/index.html` fra le cose precaricate e lo
  // servirebbe lui dalla sua copia: il controllo confronterebbe la
  // versione vecchia con se stessa e direbbe sempre «sei aggiornato»,
  // cioè esattamente la bugia che questo tasto esiste per smontare.
  // Un indirizzo che il service worker non ha in elenco non lo tocca, e
  // la richiesta arriva al server.
  const fresca = await fetch(`/index.html?controllo=${Date.now()}`, { cache: 'reload' })
    .then((r) => (r.ok ? r.text() : null))
    .catch(() => null)

  if (fresca) {
    // Gli script hanno il nome col codice del contenuto: se quello che il
    // server serve adesso non è quello che stiamo eseguendo, siamo
    // indietro davvero.
    const suoi = [...fresca.matchAll(/\/assets\/([\w.-]+\.js)/g)].map((m) => m[1])
    const nostri = [...document.querySelectorAll('script[src]')].map((s) =>
      s.src.split('/').pop()
    )
    const indietro = suoi.length > 0 && !suoi.some((s) => nostri.includes(s))

    if (indietro) {
      if (registrazione) await registrazione.unregister().catch(() => {})
      if ('caches' in window) {
        const nomi = await caches.keys().catch(() => [])
        await Promise.all(nomi.map((n) => caches.delete(n).catch(() => {})))
      }
      window.location.reload()
      return 'ricarico'
    }
    return 'gia-aggiornata'
  }

  return 'niente-da-fare'
}

// Il controllo che si fa da solo, nelle ore morte.
//
// `forzaAggiornamento` qui sopra è il tasto: lo preme chi si è accorto di
// qualcosa. Questo è l'altra metà — perché quasi nessuno se ne accorge, e
// una copia ferma a una versione vecchia resta lì per giorni senza che
// nessuno la guardi.
//
// Le regole del *quando* stanno in `finestreAggiornamento.js`, pure e
// provate a parte. Qui c'è solo il collegamento al browser.
const CHIAVE_ULTIMO = 'all41.aggiornamento.ultimo'

function ultimoControllo() {
  try {
    return localStorage.getItem(CHIAVE_ULTIMO)
  } catch {
    return null
  }
}

function segnaControllo(quale) {
  try {
    localStorage.setItem(CHIAVE_ULTIMO, quale)
  } catch {
    // Navigazione privata: si ricontrollerà. Non è un motivo per fermarsi.
  }
}

export function controllaNelleOreMorte() {
  let attesa = null

  const forse = () => {
    if (document.visibilityState !== 'visible') return
    if (attesa) return

    const quale = segnalibro()
    if (!vaControllato({ ultimo: ultimoControllo(), occupato: !siPuoRicaricare() })) return

    // ⚠️ Il segnalibro si mette PRIMA di partire, non dopo.
    //
    // Se lo mettessimo dopo, e il controllo trovasse una versione nuova,
    // la pagina si ricaricherebbe senza aver segnato niente: alla
    // riapertura la finestra risulterebbe ancora da fare e si
    // ricontrollerebbe subito. Segnandolo prima, il peggio che può
    // succedere è saltare un giro.
    segnaControllo(quale)

    attesa = setTimeout(() => {
      attesa = null
      // Si ricontrolla adesso: fra l'apertura e questo momento sono
      // passati fino a due minuti, e in due minuti uno può essersi messo
      // a scrivere una spesa.
      if (!siPuoRicaricare()) return
      forzaAggiornamento().catch(() => {})
    }, attesaACaso())
  }

  document.addEventListener('visibilitychange', forse)
  window.addEventListener('focus', forse)
  forse()

  return () => {
    if (attesa) clearTimeout(attesa)
    document.removeEventListener('visibilitychange', forse)
    window.removeEventListener('focus', forse)
  }
}

export function tieniAggiornata() {
  if (!('serviceWorker' in navigator)) return () => {}

  let ricaricata = false
  let inAttesa = false

  // Quando il service worker nuovo prende il comando, la pagina che sta
  // sotto e' ancora quella vecchia: va ricaricata, una volta sola.
  const alCambio = () => {
    if (ricaricata) return

    // C'è qualcosa a metà: si aspetta che si liberi invece di portarselo
    // via. Il controllo si rifà quando l'app torna in primo piano e a
    // intervalli lenti, perché chiudere un foglio non emette nessun
    // evento che si possa ascoltare da qui.
    if (!siPuoRicaricare()) {
      if (!inAttesa) {
        inAttesa = true
        console.info('[all41] versione nuova pronta: aspetto che chiudi quello che hai aperto')
        const riprova = setInterval(() => {
          if (ricaricata) return clearInterval(riprova)
          if (!siPuoRicaricare()) return
          clearInterval(riprova)
          alCambio()
        }, 2000)
      }
      return
    }

    ricaricata = true
    window.location.reload()
  }
  navigator.serviceWorker.addEventListener('controllerchange', alCambio)

  const controlla = () => {
    if (document.visibilityState !== 'visible') return
    navigator.serviceWorker
      .getRegistration()
      .then((r) => r?.update())
      // Offline o registrazione non ancora pronta: si riprova alla
      // prossima apertura, non e' niente di cui avvisare nessuno.
      .catch(() => {})
  }

  document.addEventListener('visibilitychange', controlla)
  window.addEventListener('focus', controlla)
  controlla()

  return () => {
    navigator.serviceWorker.removeEventListener('controllerchange', alCambio)
    document.removeEventListener('visibilitychange', controlla)
    window.removeEventListener('focus', controlla)
  }
}

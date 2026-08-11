/* Il pezzo di service worker che fa suonare i telefoni.
 *
 * Script classico e non modulo: lo tira dentro `importScripts` dal service
 * worker generato da Workbox. Per questo non ci sono `import`/`export` e
 * tutto si appende a `self.__all41` — e per questo `prove/notifiche.mjs`
 * lo legge e lo esegue in una scatola finta invece di importarlo.
 *
 * ⚠️ Una copia sola. Le regole del "cosa si notifica" stanno QUI dentro e
 * da nessun'altra parte: se ne facessi una versione ESM per le prove e una
 * classica per il browser, fra un mese direbbero due cose diverse e la
 * prova continuerebbe a dire che va tutto bene.
 */

self.__all41 = self.__all41 || {}

/* Cosa fare di una cosa arrivata. Torna `null` se non si mostra niente.
 *
 * Tre regole, e ognuna ha una ragione diversa:
 *
 *   - **app aperta davanti a te: niente.** Il cartello in cima all'app fa
 *     gia' il suo lavoro, e una notifica di sistema per una cosa che stai
 *     guardando e' solo una vibrazione da zittire.
 *
 *   - **SOS: sempre, e ogni volta.** Anche se ce n'e' gia' una: due
 *     persone perse sono due cose diverse, e la seconda non deve
 *     sostituire la prima in silenzio.
 *
 *   - **chat e vocali: una sola.** Finche' non riapri l'app, il decimo
 *     messaggio non fa suonare niente. Un telefono che vibra venti volte
 *     durante una cena si mette in silenzioso, e da quel momento non
 *     arriva piu' nemmeno l'SOS.
 */
self.__all41.decidi = function decidi({ tipo, id, appAperta, giaMostrata, payload }) {
  if (appAperta) return null

  switch (tipo) {
    case 'sos':
      // Un tag per ogni SOS: due non si sovrascrivono.
      return { tag: 'sos-' + id, renotify: true, tab: 'gruppo' }

    case 'si_riparte':
    case 'dove_siete':
      return { tag: tipo, renotify: true, tab: 'gruppo' }

    case 'free_text':
      /* ⚠️ Una proposta non divide l'unica notifica della chat.
       *
       * La regola «una sola finche' non riapri» esiste per non far vibrare
       * un telefono venti volte a cena, e va tenuta. Ma con un solo posto
       * per tutto, un messaggio delle 20:10 zittiva la proposta delle
       * 20:12 — e una proposta ha un voto da dare e una scadenza, un
       * messaggio no. Tag suo, cosi' non si fanno la fila a vicenda; e la
       * regola del «una sola» resta, dentro il suo tag.
       */
      if (payload && payload.propostaVoto) {
        /* ⚠️ Non si zittisce, si sostituisce.
         *
         * Prima la seconda proposta veniva scartata perche' ce n'era gia'
         * una a schermo: niente vibrazione — accettabile — ma nemmeno il
         * testo veniva aggiornato, quindi restava scritta la prima. Chi
         * guardava il telefono leggeva «Marco propone -3 per Leo» mentre
         * la proposta da votare era un'altra, e andava a votare la cosa
         * sbagliata.
         *
         * Una proposta ha un voto da dare e una scadenza: la piu' recente
         * deve poter prendere il posto della precedente. `renotify: false`
         * fa esattamente questo — il testo si aggiorna, il telefono non
         * vibra una seconda volta.
         */
        return { tag: 'proposta', renotify: false, tab: 'gioco' }
      }
      return giaMostrata ? null : { tag: 'chat', renotify: false, tab: 'gruppo' }

    case 'vocale':
      return giaMostrata ? null : { tag: 'vocali', renotify: false, tab: 'gruppo' }

    // La sveglia del primo giorno, una volta sola in tutto il viaggio.
    // Porta su Oggi e non sul gruppo: quello che c'e' da vedere e' il
    // programma della giornata.
    case 'sveglia':
      return { tag: 'sveglia', renotify: true, tab: 'oggi' }

    // Foto, punti, Leggi scoperte, suoni: mai. Sono cose belle da
    // trovare aprendo l'app, non da farsi svegliare.
    default:
      return null
  }
}

/* Cosa c'e' scritto sopra.
 *
 * ⚠️ Per chat e vocali il testo NON dice chi ne' cosa, e non e' pigrizia:
 * e' una notifica sola che sta al posto di venti, quindi dire "Marco ha
 * scritto: ci vediamo alle 8" sarebbe falso appena arriva il secondo
 * messaggio. Dice che c'e' roba, e la roba si legge nell'app.
 *
 * Per l'SOS invece il nome c'e', ed e' l'unica cosa che conta: chi lo
 * legge deve sapere chi andare a cercare senza aprire niente.
 */
self.__all41.descrivi = function descrivi({ tipo, chi, payload }) {
  const nome = chi || 'Qualcuno'
  const p = payload || {}

  switch (tipo) {
    case 'sos':
      return { titolo: nome + ' ha chiesto aiuto', corpo: p.motivo || 'Serve una mano' }
    case 'si_riparte':
      return {
        titolo: 'Si riparte fra ' + (p.minuti != null ? p.minuti : '?') + ' minuti',
        corpo: 'Lo dice ' + nome,
      }
    case 'dove_siete':
      return { titolo: nome + ' chiede dove siete', corpo: 'Vuole sapere dove sei' }
    case 'free_text':
      /* ⚠️ Una proposta di punti passa da una riga di chat, e senza questo
       * caso si annuncerebbe come «qualcuno ha scritto»: chi la legge non
       * saprebbe che c'e' un voto da dare, ne' entro quando.
       *
       * Sta dentro `free_text` e NON e' un tipo suo, ed e' la ragione per
       * cui funziona: un tipo nuovo lo scarterebbe il `default` qui sotto
       * su ogni telefono fermo a una versione precedente di questo file —
       * e questo file si aggiorna solo insieme all'app. Cosi' invece chi
       * ha la versione vecchia legge la frase generica e chi ha la nuova
       * legge quella giusta. Nessuno resta senza notifica.
       */
      if (p.propostaVoto) {
        var q = typeof p.punti === 'number' ? (p.punti > 0 ? '+' + p.punti : '' + p.punti) : 'punti'
        return {
          titolo: nome + ' propone ' + q + (p.perNome ? ' per ' + p.perNome : ''),
          corpo: 'Apri per votare',
        }
      }
      return { titolo: 'Qualcuno ha scritto nel gruppo', corpo: 'Apri per leggere' }
    case 'vocale':
      return { titolo: 'Qualcuno ha mandato un vocale', corpo: 'Apri per ascoltarlo' }
    case 'sveglia':
      /* Il corpo dice cosa si e' aperto: chi ha provato l'app nei giorni
       * prima l'ha trovata mezza coperta.
       *
       * ⚠️ Diceva «Da stamattina funziona tutto», e ha smesso di essere
       * vero quando l'apertura e' scesa alla sera dell'11 — il volo
       * spostato a Palermo, la notte in aeroporto. La sveglia suona il 12
       * a mezzogiorno e mezzo, cioe' quasi un giorno dopo: «da stamattina»
       * era la frase di un piano che non esiste piu'. Adesso non nomina
       * nessun momento, cosi' non puo' invecchiare di nuovo.
       */
      return { titolo: 'All41 vi aspetta', corpo: 'Leggi, Trofei e giochi: e\' tutto aperto.' }
    default:
      return null
  }
}

/* ------------------------------------------------ il collegamento vero */

self.addEventListener('push', function (evento) {
  evento.waitUntil(
    (async function () {
      let roba = null
      try {
        roba = evento.data ? evento.data.json() : null
      } catch (e) {
        // Un pacchetto storto non deve buttare giu' il service worker: se
        // succede, quel telefono smetterebbe di ricevere anche gli SOS.
        return
      }
      if (!roba || !roba.tipo) return

      // C'e' una finestra dell'app aperta e davanti agli occhi?
      const finestre = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      const appAperta = finestre.some(function (f) {
        return f.visibilityState === 'visible'
      })

      // Per chat e vocali: ce n'e' gia' una a schermo?
      const provvisorio = self.__all41.decidi({
        tipo: roba.tipo,
        id: roba.id,
        appAperta: appAperta,
        giaMostrata: false,
        payload: roba.payload,
      })
      if (!provvisorio) return

      const esistenti = await self.registration.getNotifications({ tag: provvisorio.tag })
      const scelta = self.__all41.decidi({
        tipo: roba.tipo,
        id: roba.id,
        appAperta: appAperta,
        giaMostrata: esistenti.length > 0,
        payload: roba.payload,
      })
      if (!scelta) return

      const testo = self.__all41.descrivi(roba)
      if (!testo) return

      await self.registration.showNotification(testo.titolo, {
        body: testo.corpo,
        tag: scelta.tag,
        renotify: scelta.renotify,
        icon: '/apple-touch-icon.png',
        badge: '/favicon.svg',
        data: { tab: scelta.tab },
      })
    })()
  )
})

/* Toccata: si porta in primo piano la finestra che c'e' gia', invece di
 * aprirne una nuova. Aprirne una seconda vorrebbe dire due copie dell'app
 * con due sessioni realtime, e la prima resta li' a consumare. */
self.addEventListener('notificationclick', function (evento) {
  evento.notification.close()
  const tab = (evento.notification.data && evento.notification.data.tab) || 'gruppo'

  evento.waitUntil(
    (async function () {
      const finestre = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      for (const f of finestre) {
        if ('focus' in f) {
          f.postMessage({ all41: 'vaiA', tab: tab })
          return f.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow('/?tab=' + tab)
    })()
  )
})

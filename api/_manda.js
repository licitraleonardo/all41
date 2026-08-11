import webpush from 'web-push'
import { daTogliere } from './_regole.js'

// ⚠️ Il mittente della firma. Deve essere un indirizzo **vero**.
//
// Era `mailto:all41@example.invalid`, e ha tenuto muti tutti gli iPhone
// del gruppo dal primo giorno. `.invalid` e' un dominio riservato che per
// definizione non esiste (RFC 2606), e i due servizi di push non la
// prendono allo stesso modo:
//
//   - **Google** non guarda il mittente e consegna lo stesso. Le prove
//     si facevano su Android, quindi risultava tutto a posto.
//   - **Apple** lo valida e rifiuta con `403 BadJwtToken`. Silenzioso dal
//     lato del telefono: nessun errore, nessuna notifica, niente.
//
// Quattro persone su sette erano su Apple. E' il difetto piu' costoso di
// tutto il progetto ed e' durato tre giorni, perche' il sintomo — «a me
// non arrivano» — assomiglia a un problema di permessi del telefono, che
// e' la prima cosa che uno va a controllare.
//
// L'URL del sito va bene quanto una mail (RFC 8292) e non mette
// l'indirizzo di nessuno dentro il codice.
const MITTENTE = 'https://all41.vercel.app'


// Spedire una notifica push a un elenco di iscritti, e fare pulizia.
//
// ⚠️ Sta qui e non dentro `notifica.js` perché adesso la usano in due:
// le notifiche di quello che succede nel gruppo, e la sveglia del 12.
// Copiarla in due file voleva dire due pulizie diverse il giorno in cui
// una delle due cambia — e la pulizia è la parte che non si vede
// funzionare, quindi è quella che si sarebbe scordata.

export function chiaviPush() {
  return {
    pubblica: process.env.VAPID_PUBLIC_KEY,
    privata: process.env.VAPID_PRIVATE_KEY,
  }
}

// Manda `roba` a tutti gli `iscritti`, e restituisce quante sono partite
// e quante iscrizioni morte ha tolto.
//
// `db` è il client Supabase con la chiave di servizio: serve a togliere
// gli endpoint morti, che dal telefono nessuno può toccare.
export async function mandaATutti({ db, iscritti, roba, ttl = 600 }) {
  const { pubblica, privata } = chiaviPush()
  webpush.setVapidDetails(MITTENTE, pubblica, privata)

  const esiti = await Promise.allSettled(
    iscritti.map((i) =>
      webpush.sendNotification({ endpoint: i.endpoint, keys: i.chiavi }, roba, { TTL: ttl })
    )
  )

  // ⚠️ Le iscrizioni morte si tolgono da sole.
  //
  // Un telefono che disinstalla l'app lascia il suo endpoint nella
  // tabella per sempre, e il servizio di push risponde 404 o 410. Senza
  // questa pulizia, fra un anno si proverebbe a mandare a otto telefoni
  // che non esistono più — e ogni invio è tempo di attesa per chi ha
  // premuto SOS.
  const morte = daTogliere(esiti, iscritti)
  if (morte.length) await db.from('push_subscriptions').delete().in('endpoint', morte)

  return {
    mandate: esiti.filter((e) => e.status === 'fulfilled').length,
    tolte: morte.length,
  }
}

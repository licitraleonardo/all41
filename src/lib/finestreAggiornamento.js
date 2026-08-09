// Quando l'app può permettersi di ricaricarsi da sola.
//
// Il tasto «Aggiorna» nelle Info risolve il caso di chi si accorge di
// essere indietro. Ma quasi nessuno ci va a guardare: se una copia resta
// ferma a una versione vecchia, il modo più probabile è che non se ne
// accorga nessuno per giorni. È già successo.
//
// Quindi l'app ci prova da sola — ma non in qualunque momento.
//
// Niente browser qui dentro: sono condizioni, e si provano da riga di
// comando come il resto delle regole del progetto.

// ⚠️ Le due ore morte del viaggio.
//
// Il primo pomeriggio si sta in spiaggia o si dorme; dopo cena si è
// fermi. Una ricarica lì non porta via niente a nessuno.
//
// Le 9 del mattino sarebbero l'ora peggiore possibile: si carica la
// macchina, si cerca l'itinerario, si scrive in chat «dove siete». Ed è
// esattamente quando uno apre l'app.
export const FINESTRE = [
  { nome: 'pomeriggio', da: 14, a: 16 },
  { nome: 'sera', da: 21, a: 23 },
]

// In quale finestra siamo, se ce n'è una. Estremi: si entra alle 14:00 in
// punto e si esce alle 16:00 in punto — alle 16:00 si è già fuori, perché
// due finestre non devono potersi toccare.
export function finestraDi(adesso = new Date()) {
  const ora = adesso.getHours()
  return FINESTRE.find((f) => ora >= f.da && ora < f.a) ?? null
}

// Il segnalibro: una finestra per giorno, una volta sola.
//
// Volutamente col giorno del TELEFONO e non in UTC, come `dataDiOggi`:
// alle 21:30 in Italia la data UTC è ancora quella giusta, ma a
// mezzanotte e mezza no — e la finestra della sera del 14 non deve
// contare come già fatta il 15.
export function segnalibro(adesso = new Date()) {
  const f = finestraDi(adesso)
  if (!f) return null
  const due = (n) => String(n).padStart(2, '0')
  const giorno = `${adesso.getFullYear()}-${due(adesso.getMonth() + 1)}-${due(adesso.getDate())}`
  return `${giorno}-${f.nome}`
}

// Si controlla adesso?
//
// Tre condizioni, e servono tutte e tre:
//
//   1. siamo dentro una delle due finestre
//   2. quella finestra oggi non è già stata fatta — aprire l'app quattro
//      volte alle 14:30 non fa quattro controlli
//   3. ⚠️ non c'è niente a metà a schermo. È la stessa guardia del
//      difetto corretto oggi, l'app che si ricaricava sotto le dita
//      portandosi via il foglio della spesa compilato. Senza questa
//      condizione lo starei rimettendo dentro — solo, due volte al
//      giorno e a sorpresa.
export function vaControllato({ ultimo = null, occupato = false, adesso = new Date() }) {
  if (occupato) return false
  const ora = segnalibro(adesso)
  if (!ora) return false
  return ora !== ultimo
}

// Quanto aspettare prima di partire, in millisecondi.
//
// Due ragioni per non farlo subito: che otto telefoni non chiedano tutti
// nello stesso secondo, e che la ricarica non arrivi nell'istante esatto
// in cui uno ha aperto l'app per fare una cosa. Chi apre e chiude in
// venti secondi non se ne accorge nemmeno.
export const ATTESA_MAX_MS = 120000

export function attesaACaso(caso = Math.random()) {
  return Math.floor(caso * ATTESA_MAX_MS)
}

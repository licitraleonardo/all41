// Quando l'app si apre davvero.
//
// ⚠️ L'app esce **coperta**, e si scopre da sola alle **19 dell'11**.
//
// Doveva essere il 12 alle 6 — l'ora in cui il gruppo sarebbe arrivato a
// Quartu. Poi l'Etna ha chiuso Fontanarossa, il volo si e' spostato a
// Palermo alle 5:45 del 12, e la partenza da casa e' diventata la sera
// dell'11: si va in aeroporto, ci si dorme, si vola all'alba.
//
// Il viaggio comincia quando si esce di casa, non quando si atterra.
// Quelle ore — il viaggio verso l'aeroporto, la notte in sala d'attesa —
// sono la parte di viaggio in cui un'app come questa serve di piu': c'e'
// tempo morto, si e' tutti insieme, e non c'e' niente da fare.
//
// Il link va al gruppo due giorni prima di partire, e due giorni di
// prove bruciano cose che si possono scoprire una volta sola: le Leggi
// si svelano al primo scatto e valgono per tutti insieme, i conteggi
// della soundboard partono, le partite entrano in classifica. Chi apre
// l'app il 10 non deve poter consumare il 12.
//
// Quindi fino a quel momento sono coperti:
//
//   - le Leggi e i Trofei (`lib/punti.js`)
//   - i tasti speciali della chat e i suoni (`components/ChatRapida.jsx`)
//   - i giochi elencati in `GIOCHI_COPERTI` qui sotto
//
// ⚠️ Quello che NON si copre, e sono scelte:
//
//   - **l'SOS**, che è l'unica funzione di sicurezza dell'app: non tiene
//     nessun conteggio e non dà punti, e il 12 vi spostate tutti
//   - **le proposte di punti**, che sono il modo esplicito di darsi punti
//     a vicenda: non passano dalle Leggi e non scoprono niente
//   - **posizione, foto, spese, documenti, vocali, feedback**: servono
//     subito e non consumano niente
//
// ⚠️ Niente cron e niente deploy per aprire: ogni telefono guarda il
// proprio orologio. Alle 19 dell'11 si apre tutto da sé, in silenzio.

// L'ora locale, non UTC: le 19 sono le 19 sul telefono di chi c'è, ed è
// quello che conta.
export const APERTURA = '2026-08-11T19:00:00'

// ⚠️ Lo stesso istante, ma col fuso scritto dentro.
//
// `APERTURA` qui sopra la legge il telefono con il proprio fuso, ed è
// giusto per rispondere a «il viaggio è cominciato **qui**?». Ma quando
// serve a filtrare una query — le statistiche contano solo dal viaggio
// in poi — il confronto avviene nel database, e una data senza fuso
// verrebbe interpretata da lui in un altro modo.
//
// È lo stesso identico istante del taglio dentro `supabase/azzera.sql`,
// ed è controllato da `prove/rilascio.mjs`: se i due si separano, punti
// e statistiche raccontano due storie diverse.
export const APERTURA_ASSOLUTA = '2026-08-11T19:00:00+02:00'

// ⚠️ Per provarla senza aspettare il 12. Va lasciata a `null` quando si
// pubblica: messa a `true` l'app esce già aperta, e il primo che gioca
// si porta via le Leggi per tutti.
export const FORZA_APERTA = null

export function viaggioCominciato(adesso = new Date()) {
  if (FORZA_APERTA !== null) return FORZA_APERTA
  return adesso.getTime() >= new Date(APERTURA).getTime()
}

// Quello che si legge toccando una cosa coperta. Una riga sola: non c'è
// niente da spiegare, c'è una data da sapere.
export const COPERTO = 'Si sblocca stasera'

// ⚠️ Quali giochi restano coperti fino al 12. Gli altri sono aperti.
//
// All'inizio era coperta la Sala intera, una guardia sola invece di tre.
// L'11 il gruppo era già dentro l'app da una sera e non aveva niente da
// fare insieme, e la copertura è passata da porta a stanza: aperti la
// Dama e All, coperto l'Impostore.
//
// **La distinzione non è «quanto è divertente», è cosa si consuma.**
//
//   - **All** è tutto locale: nessuna partita, nessun avversario. Il
//     record del giorno finisce in `sheep_records`, che il 12 si azzera.
//   - **Dama** crea partite vere sul database, ma una partita giocata
//     l'11 è solo una partita giocata l'11: le Leggi sono congelate,
//     quindi non dà punti, e `dama_games` il 12 si azzera.
//   - **Impostore** no, e non per prudenza: si gioca **in otto, di
//     persona**, e ognuno vede la sua parola una volta sola. Giocarlo
//     l'11 da casa, in tre, con cinque parole bruciate e nessuno
//     seduto attorno a un tavolo, non è una prova — è la prima serata
//     spesa male.
//
// ⚠️ Un gioco messo qui dentro non viene **costruito**, non solo
// nascosto: vedi `SalaGiochi.jsx`. Coprire un gioco che apre ascoltatori
// lasciandolo montato non è coprirlo.
export const GIOCHI_COPERTI = ['impostore']

export function giocoCoperto(id, adesso = new Date()) {
  if (viaggioCominciato(adesso)) return false
  return GIOCHI_COPERTI.includes(id)
}

// Quando l'app si apre davvero.
//
// ⚠️ L'app esce **coperta**, e si scopre da sola alle 6 del 12.
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
//   - i tre giochi (`components/Gioco.jsx`)
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
// proprio orologio. Alle 6 del 12 si apre tutto da sé, in silenzio.

// L'ora locale, non UTC: le 6 del mattino in Sardegna sono le 6 sul
// telefono di chi è lì, ed è quello che conta.
export const APERTURA = '2026-08-12T06:00:00'

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
export const COPERTO = 'Si sblocca il 12'

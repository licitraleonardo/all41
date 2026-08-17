// La pagina che l'app apre adesso che il viaggio è finito.
//
// ⚠️ Il tasto «Carica prossimo viaggio» **non fa niente**, ed è voluto:
// serve a dare l'impressione di come sarà, non a caricare qualcosa. Se un
// giorno funzionerà davvero, il posto è questo.
//
// Per questo non c'è nessun campo dove lasciare un file: un tasto che non
// fa niente si capisce in mezzo secondo, un file che sparisce dentro una
// pagina finta no — e qualcuno ci lascerebbe l'itinerario del viaggio
// dopo credendo di averlo salvato.

export const PROSSIMO = {
  titolo: 'Il prossimo viaggio',
  sottotitolo: 'Quando decidiamo dove si va, si carica qui.',
  tasto: 'Carica prossimo viaggio',

  // Cosa dice il tasto dopo che l'hai premuto. Non finge di aver fatto
  // qualcosa: dice che non c'è ancora niente da caricare.
  dopoIlTasto: 'Non ancora. Prima bisogna decidere dove si va.',

  // La freccia che riporta al viaggio fatto.
  //
  // ⚠️ Porta un'etichetta accanto e non è una freccia sola, per quanto
  // «un'iconcina» fosse la richiesta: su una pagina quasi vuota una
  // freccia nuda non dice **dove** porta, e l'unica cosa che c'è dietro è
  // la memoria di cinque giorni. Vale una parola.
  indietro: 'Sardegna 2026',
}

export const TORNATI = {
  // L'ultimo momento del viaggio: da qui parte il conto.
  //
  // ⚠️ Cambiando questa riga si sposta il conto, e basta quella.
  fine: '2026-08-16T23:59:00',

  // ⚠️ Il participio NON sta qui dentro: lo decide il conto, perché
  // cambia con quello che si sta dicendo — «sono passati 4 giorni» ma
  // «sono passate 23 ore». Scrivendolo fisso qui, per quasi un'ora ogni
  // giorno la frase sarebbe sgrammaticata.
  prima: 'sono',
  rinforzo: 'ben',
  dopo: 'da questo incredibile viaggio',
  appena: 'è finito proprio adesso',
}

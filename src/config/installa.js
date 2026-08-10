// I testi della pagina di installazione. Stanno qui e non nel
// componente, come tutto il resto: questa è la pagina che verrà riletta
// e ritoccata più volte, perché è la prima cosa che vede il gruppo.
//
// ⚠️ Asciugata il 10 agosto. C'erano un'apertura che spiegava cos'è una
// PWA, un avviso sul codice e una nota in fondo a ogni procedura: chi
// apre questa pagina vuole installare l'app, non leggere di come
// funzionano le app. Restano le due procedure e basta.

export const INSTALLA = {
  titolo: 'Mettila sulla home',

  ios: {
    nome: 'iPhone',
    // ⚠️ Su iPhone non esiste nessuna API per installare: Safari non la
    // espone, punto. Qui un tasto non può esserci, e metterne uno che
    // non fa niente sarebbe peggio del non averlo.
    passi: [
      'Apri questa pagina in Safari.',
      'Tocca Condividi in fondo — il quadrato con la freccia in su.',
      'Scorri e scegli «Aggiungi alla schermata Home».',
    ],
  },

  android: {
    nome: 'Android',
    // Il tasto compare quando Chrome lo concede. Questi passi restano
    // per quando non scatta.
    passi: [
      'Apri questa pagina in Chrome.',
      'Tocca i tre puntini in alto a destra.',
      'Scegli «Installa app».',
    ],
  },

  desktop: {
    titolo: 'Questa è roba da telefono',
    testo:
      'L’app è pensata per stare in tasca durante il viaggio: mappa, foto, chat e spese si usano camminando. Apri questo indirizzo dal telefono.',
  },

  dopo: 'Fatto. Adesso c’è l’icona sulla home: si apre da lì, non dal browser.',

  // ⚠️ Questo avviso **non è sparito, ha cambiato momento** — stessa
  // mossa fatta per i Documenti.
  //
  // Stava in cima alla pagina, dove lo leggeva chi non aveva ancora
  // installato niente e se lo scordava dieci minuti dopo. Adesso sta
  // sulla schermata di «fatto», cioè nell'istante esatto prima di aprire
  // l'app e trovarsi il campo del codice davanti. L'app installata ha
  // uno storage suo: non eredita niente dal browser, e riparte da zero.
  avvisoCodice: 'Ti chiederà il codice di accesso: l’app installata parte da zero.',
}

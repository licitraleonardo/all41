// I testi della pagina di installazione. Stanno qui e non nel
// componente, come tutto il resto: questa è la pagina che verrà riletta
// e ritoccata più volte, perché è la prima cosa che vede il gruppo.

export const INSTALLA = {
  titolo: 'Mettila sulla home',
  apertura:
    'All For One non sta sugli store. Si aggiunge alla schermata Home e da lì si apre come un’app qualunque — a schermo pieno, senza barre del browser.',

  // ⚠️ Il codice di accesso è la cosa che si dimentica, e la si scopre
  // solo dopo aver installato: l'app installata ha uno storage suo,
  // quindi non eredita niente dal browser.
  avvisoCodice:
    'Tieni a portata il tuo codice di accesso: l’app installata parte da zero e te lo chiede.',

  ios: {
    browser: 'Safari',
    passi: [
      'Tocca il tasto Condividi in fondo allo schermo — il quadrato con la freccia in su.',
      'Scorri l’elenco e scegli “Aggiungi alla schermata Home”.',
      'Tocca “Aggiungi” in alto a destra.',
    ],
    // Su iPhone non esiste beforeinstallprompt: si può solo spiegare.
    nota: 'Su iPhone non c’è nessun bottone che lo faccia al posto tuo. È fatto così.',
  },

  android: {
    browser: 'Chrome',
    // Il bottone c'è quando il browser lo concede; queste restano come
    // ripiego, perché l'evento non scatta sempre.
    passi: [
      'Tocca i tre puntini in alto a destra.',
      'Scegli “Installa app” — oppure “Aggiungi a schermata Home”.',
      'Conferma.',
    ],
    nota: 'Se compare il bottone qui sopra, fa tutto lui.',
  },

  desktop: {
    titolo: 'Questa è roba da telefono',
    testo:
      'L’app è pensata per stare in tasca durante il viaggio: mappa, foto, chat e spese si usano camminando. Apri questo indirizzo dal telefono.',
  },

  dopo: 'Fatto. Adesso c’è l’icona sulla home: si apre da lì, non dal browser.',
}

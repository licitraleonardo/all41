// Che telefono è, e soprattutto: dove sta girando questa pagina.
//
// Funzione pura come formatoAudio: le si passa lo user agent e risponde,
// così si prova da riga di comando con stringhe finte invece di sperare
// in otto telefoni diversi.
//
// L'ostacolo vero non è iPhone contro Android, è il browser dentro
// un'altra app. Il link alla pagina di installazione verrà condiviso su
// WhatsApp, che su iPhone lo apre nel proprio browser interno — dove
// "Aggiungi alla schermata Home" non esiste proprio. Stessa storia con
// Instagram, Facebook e Telegram. Senza accorgersene, la guida
// spiegherebbe come premere un bottone che lì non c'è.

export function riconosci(ua = '', { standalone = false, tocco = false } = {}) {
  const s = String(ua)

  const iOS = /iPhone|iPad|iPod/i.test(s) || (/Macintosh/i.test(s) && tocco)
  const android = /Android/i.test(s)

  return {
    sistema: iOS ? 'ios' : android ? 'android' : 'desktop',
    dentroUnAltraApp: browserInterno(s),
    // Già installata: la pagina di installazione non ha niente da dire a
    // chi ci è arrivato dall'icona sulla home.
    installata: Boolean(standalone),
  }
}

// I browser interni si riconoscono da un pezzo di user agent che l'app
// ospite ci infila. Non è un elenco completo — non può esserlo — ma
// copre quelli da cui arriverà il link.
function browserInterno(s) {
  // WhatsApp, Instagram, Facebook, Telegram, TikTok, Snapchat, Line.
  if (/\bWhatsApp\b/i.test(s)) return 'WhatsApp'
  if (/\bInstagram\b/i.test(s)) return 'Instagram'
  if (/\bFB(AN|AV|_IAB)\b|FBAN|FBAV/i.test(s)) return 'Facebook'
  if (/\bTelegram\b/i.test(s)) return 'Telegram'
  if (/\bTikTok\b|musical_ly/i.test(s)) return 'TikTok'
  if (/\bSnapchat\b/i.test(s)) return 'Snapchat'
  if (/\bLine\//i.test(s)) return 'Line'

  // Android generico: i WebView si dichiarano con "; wv".
  if (/Android/i.test(s) && /;\s*wv\)/i.test(s)) return 'un’altra app'

  // iOS: Safari vero contiene "Safari" e non "CriOS"/"FxiOS". Una
  // WebView di terze parti non ha "Safari" nella coda.
  if (/iPhone|iPad|iPod/i.test(s)) {
    const altroBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/i.test(s)
    if (!altroBrowser && !/Safari/i.test(s)) return 'un’altra app'
  }

  return null
}

// Dove mandare la persona quando è dentro un browser interno. Su iOS non
// si può forzare l'apertura in Safari da una pagina web — lo schema
// x-safari-https:// funziona solo dalle app native — quindi l'unica via
// solida è copiare il link e incollarlo. Si dice, invece di far provare
// un bottone che non funziona.
export function comeUscire(sistema) {
  if (sistema === 'ios') {
    return {
      browser: 'Safari',
      dove: 'Tocca i tre puntini in alto a destra e scegli “Apri in Safari”.',
    }
  }
  if (sistema === 'android') {
    return {
      browser: 'Chrome',
      dove: 'Tocca i tre puntini in alto a destra e scegli “Apri in Chrome”.',
    }
  }
  return { browser: 'un browser vero', dove: 'Copia il link e aprilo nel browser.' }
}

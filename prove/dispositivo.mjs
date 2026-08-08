// Il riconoscimento del dispositivo per la pagina di installazione.
// Stessa idea di formato-audio: user agent veri, presi da telefoni veri,
// invece di sperare di averli tutti sottomano.
//
//   node prove/dispositivo.mjs

import { comeUscire, riconosci } from '../src/lib/dispositivo.js'

let falliti = 0
function prova(nome, ok, extra) {
  if (ok) {
    console.log('  ok   ' + nome)
  } else {
    falliti += 1
    console.error('  NO   ' + nome, extra ?? '')
  }
}

const UA = {
  safari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  chromeIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0 Mobile/15E148 Safari/604.1',
  whatsappIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WhatsApp/2.24',
  instagramIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.0',
  webviewIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  chromeAndroid:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
  webviewAndroid:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.0.0 Mobile Safari/537.36',
  whatsappAndroid:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.0.0 Mobile Safari/537.36 WhatsApp/2.24',
  telegramAndroid:
    'Mozilla/5.0 (Linux; Android 14; SM-S918B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36 Telegram-Android/10.14',
  facebookIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/470.0]',
  desktopChrome:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  desktopSafari:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  ipadOS:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
}

console.log('\nche sistema è')
{
  prova('Safari su iPhone → ios', riconosci(UA.safari).sistema === 'ios')
  prova('Chrome su iPhone → ios', riconosci(UA.chromeIos).sistema === 'ios')
  prova('Chrome su Android → android', riconosci(UA.chromeAndroid).sistema === 'android')
  prova('Chrome su Windows → desktop', riconosci(UA.desktopChrome).sistema === 'desktop')
  prova('Safari su Mac → desktop', riconosci(UA.desktopSafari).sistema === 'desktop')

  // L'iPad da anni si dichiara Macintosh: l'unico modo di distinguerlo
  // da un Mac è il touch. Senza, riceverebbe la guida sbagliata.
  prova(
    'iPad si dichiara Mac, ma ha il touch → ios',
    riconosci(UA.ipadOS, { tocco: true }).sistema === 'ios'
  )
  prova(
    'un Mac vero resta desktop',
    riconosci(UA.desktopSafari, { tocco: false }).sistema === 'desktop'
  )
}

console.log('\nil browser dentro un’altra app: è l’ostacolo vero')
{
  prova('WhatsApp su iPhone', riconosci(UA.whatsappIos).dentroUnAltraApp === 'WhatsApp')
  prova('WhatsApp su Android', riconosci(UA.whatsappAndroid).dentroUnAltraApp === 'WhatsApp')
  prova('Instagram', riconosci(UA.instagramIos).dentroUnAltraApp === 'Instagram')
  prova('Facebook', riconosci(UA.facebookIos).dentroUnAltraApp === 'Facebook')
  prova('Telegram', riconosci(UA.telegramAndroid).dentroUnAltraApp === 'Telegram')
  prova('una WebView Android generica', Boolean(riconosci(UA.webviewAndroid).dentroUnAltraApp))
  prova('una WebView iOS generica', Boolean(riconosci(UA.webviewIos).dentroUnAltraApp))
}

console.log('\ni browser veri NON devono sembrare app')
{
  // È il caso che conta più di tutti: sbagliare qui vuol dire dire
  // "apri in Safari" a chi è già in Safari, e lì la persona si blocca.
  prova('Safari su iPhone non è un browser interno', riconosci(UA.safari).dentroUnAltraApp === null)
  prova('Chrome su iPhone nemmeno', riconosci(UA.chromeIos).dentroUnAltraApp === null)
  prova(
    'Chrome su Android nemmeno',
    riconosci(UA.chromeAndroid).dentroUnAltraApp === null
  )
  prova('Chrome desktop nemmeno', riconosci(UA.desktopChrome).dentroUnAltraApp === null)
  prova('Safari desktop nemmeno', riconosci(UA.desktopSafari).dentroUnAltraApp === null)
}

console.log('\ngià installata')
{
  prova('standalone → installata', riconosci(UA.safari, { standalone: true }).installata)
  prova('da browser → non installata', !riconosci(UA.safari).installata)
}

console.log('\ndove mandare chi è dentro un’altra app')
{
  prova('su iOS si dice Safari', comeUscire('ios').browser === 'Safari')
  prova('su Android si dice Chrome', comeUscire('android').browser === 'Chrome')
  prova('e su desktop non si nomina un browser preciso', comeUscire('desktop').browser.includes('browser'))
  prova(
    'ogni caso spiega dove guardare',
    ['ios', 'android', 'desktop'].every((s) => comeUscire(s).dove.length > 15)
  )
}

console.log('\nniente esplode con input storti')
{
  prova('user agent vuoto', riconosci('').sistema === 'desktop')
  prova('undefined', riconosci(undefined).sistema === 'desktop')
  prova('senza opzioni', riconosci(UA.safari).installata === false)
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} falliti.\n`)
process.exit(falliti === 0 ? 0 : 1)

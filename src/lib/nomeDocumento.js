import { MAX_TITOLO } from '../config/documenti.js'

// Il nome del file a volte è già buono ("biglietto traghetto.pdf") e a
// volte è quello che ci mette la fotocamera. Precompilare "IMG_2931" non
// aiuta nessuno: meglio lasciare il campo vuoto col suggerimento, che
// almeno dice che tipo di nome serve.
// Due segnali insieme, non uno: comincia con una parola da fotocamera
// (o da chat) e contiene dei numeri. Serve tutti e due, altrimenti
// "foto biglietto barca" verrebbe buttato, e quello e' un nome buono.
//
// Niente \b dopo la parola: l'underscore è un carattere di parola, quindi
// fra "IMG" e "_2931" un confine non c'è e la prova falliva proprio sul
// caso più comune di tutti. Serve un separatore dichiarato, o una cifra
// attaccata come in "IMG2931".
const PAROLA_DA_MACCHINA =
  /^(image|img|dscn|dsc|pxl|photo|foto|screenshot|schermata|scan|whatsapp|signal|telegram)([-_ .]|\d|$)/i

// E il caso in cui il nome sia solo una data o un numero lunghissimo.
const SOLO_NUMERI = /^[\d\s\-_.]{6,}$/

export function nomeUtile(nomeFile) {
  const senzaEstensione = String(nomeFile ?? '')
    .replace(/\.[^.]+$/, '')
    .trim()

  if (!senzaEstensione) return ''
  if (SOLO_NUMERI.test(senzaEstensione)) return ''
  if (PAROLA_DA_MACCHINA.test(senzaEstensione) && /\d/.test(senzaEstensione)) return ''

  return senzaEstensione.slice(0, MAX_TITOLO)
}

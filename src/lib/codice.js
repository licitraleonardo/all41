import { CODICE } from '../config/viaggio.js'

export function generaCodice() {
  const numeri = new Uint32Array(CODICE.lunghezza)
  crypto.getRandomValues(numeri)
  let codice = ''
  for (const n of numeri) {
    codice += CODICE.alfabeto[n % CODICE.alfabeto.length]
  }
  return codice
}

// Chi lo digita scriverà minuscolo o con spazi. I caratteri ambigui (I L O
// 0 1) non esistono nell'alfabeto, quindi qui vengono semplicemente scartati.
export function normalizzaCodice(grezzo) {
  return (grezzo || '')
    .toUpperCase()
    .split('')
    .filter((c) => CODICE.alfabeto.includes(c))
    .join('')
    .slice(0, CODICE.lunghezza)
}

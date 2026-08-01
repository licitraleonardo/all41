// Legge XXVI. Aggiungete e togliete parole liberamente: è un file di
// dati, non serve toccare altro.
//
// Il confronto ignora maiuscole e accenti e cerca la parola dentro la
// frase, quindi "ritardati" becca anche "siete dei RITARDATI!!".
// Scrivetele minuscole e senza accenti.

export const PAROLE_PROIBITE = ['ritardati']

// -2, come le altre penalità di fastidio.
export const PUNTI_PAROLA_PROIBITA = -2

export function parolaProibitaIn(testo) {
  const pulito = normalizza(testo)
  return PAROLE_PROIBITE.find((p) => pulito.includes(normalizza(p))) ?? null
}

function normalizza(s) {
  // Si tolgono i segni di accento confrontando i codici, senza scriverli:
  // stanno fra 0x300 e 0x36F e nel sorgente sarebbero invisibili.
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .split('')
    .filter((c) => {
      const codice = c.charCodeAt(0)
      return codice < 0x300 || codice > 0x36f
    })
    .join('')
}

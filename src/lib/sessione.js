// Comodità, non fonte di verità: il profilo vive nel database, questo serve
// solo a non richiedere il codice a ogni apertura. Se si svuota la cache,
// il codice di accesso lo riporta indietro.

const CHIAVE = 'all41.memberId'

export function memberIdSalvato() {
  try {
    return localStorage.getItem(CHIAVE)
  } catch {
    return null
  }
}

export function salvaMemberId(id) {
  try {
    localStorage.setItem(CHIAVE, id)
  } catch {
    // Safari in navigazione privata può rifiutare: si continua senza.
  }
}

export function dimenticaMemberId() {
  try {
    localStorage.removeItem(CHIAVE)
  } catch {
    // vedi sopra
  }
}

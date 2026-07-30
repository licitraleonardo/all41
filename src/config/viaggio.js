// Dati del viaggio. Cambiando questo file l'app si sposta su un altro viaggio.

export const VIAGGIO = {
  id: 'sardegna-2026',
  nome: 'Sardegna',
  dataInizio: '2026-08-12',
  dataFine: '2026-08-16',
  etichetta: 'Sardegna · 12–16 agosto',
}

// Vincoli dell'onboarding, tenuti fuori dai componenti.
export const NOME = {
  lunghezzaMin: 2,
  lunghezzaMax: 20,
}

// Codice personale: 5 caratteri, alfabeto senza I L O 0 1 per non
// confondersi quando lo si detta a voce o lo si copia da uno screenshot.
export const CODICE = {
  lunghezza: 5,
  alfabeto: 'ABCDEFGHJKMNPQRSTUVWXYZ23456789',
}

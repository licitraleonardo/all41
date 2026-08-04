// Proposte di punti votate dal gruppo — la Legge I.
//
// Slider e non campo libero, di proposito: senza tetto, un +500 votato
// per ridere azzera il senso della classifica in un colpo solo. Il tetto
// vero è che non esista una casella dove scrivere un numero.

export const PROPOSTA = {
  limite: 5,
  minutiDiVoto: 60,
  lunghezzaMaxMotivo: 80,

  // Tre proposte al giorno a testa. Non è un freno contro lo spam — per
  // quello ci sono i limiti della Chat Rapida — è quello che rende una
  // proposta una cosa che pesa: se puoi darne quindici, nessuna vale
  // niente, e la classifica diventa un contatore di clic.
  alGiorno: 3,
}

export const OPZIONI_PROPOSTA = ['Sì', 'No']

// Se hanno votato tutti si chiude subito, senza aspettare l'ora. Se ha
// votato meno della metà del gruppo la proposta si annulla: non è stata
// bocciata, semplicemente non l'ha guardata nessuno, e chi l'ha
// proposta non si merita la penalità della Legge XIII.
export function quorumRaggiunto(votanti, totale) {
  return votanti * 2 >= totale
}

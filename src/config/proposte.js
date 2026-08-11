// Proposte di punti votate dal gruppo — la Legge I.
//
// Slider e non campo libero, di proposito: senza tetto, un +500 votato
// per ridere azzera il senso della classifica in un colpo solo. Il tetto
// vero è che non esista una casella dove scrivere un numero.

export const PROPOSTA = {
  limite: 5,

  // Un giorno, non un'ora.
  //
  // ⚠️ Un'ora presuppone che tutti guardino il telefono nell'ora giusta,
  // e in vacanza non succede: si è in spiaggia, in barca, a tavola. Una
  // proposta che scade prima che qualcuno l'abbia vista non è stata
  // bocciata — non è stata **letta**, e sparisce senza lasciare niente.
  //
  // Non è comunque il caso normale: se hanno votato tutti si chiude
  // subito, senza aspettare (vedi `quorumRaggiunto` qui sotto). Questo è
  // il tetto, non l'attesa.
  minutiDiVoto: 1440,

  // ⚠️ Quanto dura il «ne hai già una in voto», che NON è la scadenza.
  //
  // Le due cose erano la stessa finché la scadenza era un'ora, e
  // separarle è stato obbligatorio. Con la scadenza a un giorno, «hai già
  // una proposta aperta» sarebbe durato un giorno: la prima proposta del
  // mattino avrebbe bloccato le altre due — o gliele avrebbe fatte pagare
  // con la Legge XIII, che scatta su chi insiste. Tre proposte al giorno
  // sarebbero diventate una.
  //
  // Resta un'ora, che è quello che la regola voleva dire: non due di fila
  // a caldo sulla stessa cena. Dopo un'ora si ripropone senza penalità.
  minutiPrimaDiRiproporre: 60,

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

// La Dama: il gioco di coppia. L'Impostore è di gruppo, la Pecora è da
// soli, questa si gioca in due — dopo cena, un telefono per uno.
//
// Regole all'inglese, che sono quelle che tutti conoscono senza saperlo:
// le pedine mangiano solo in avanti, la dama muove e mangia di un passo
// in ogni diagonale (niente dame volanti), mangiare è obbligatorio, la
// catena si completa, la promozione chiude la mossa. Rispetto alla dama
// italiana da torneo manca una cosa sola: da noi la pedina può mangiare
// la dama. Semplifica le regole senza cambiare il gioco che si aspetta
// chiunque l'abbia giocata da bambino.

export const DAMA = {
  // Dopo tante mosse (fra tutti e due) senza né una presa né una
  // promozione, è patta: due dame che si rincorrono per sempre non sono
  // una partita, sono una schermata bloccata.
  pattaDopo: 80,

  // Quante partite si tengono in elenco. Le vecchie restano sul
  // database, semplicemente non si mostrano — verifica bloccante n.4.
  inElenco: 10,
}

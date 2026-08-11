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

// ⚠️ Chi è Allan, per il codice. Non è un membro del gruppo e non esiste
// sul database: è una stringa che non può collidere con un uuid, così se
// per sbaglio finisse dentro una query non troverebbe niente invece di
// trovare la persona sbagliata.
export const ALLAN_ID = 'allan'

// Allan come avversario, per giocare da soli. Le manopole stanno qui e
// non dentro il motore: cambiare quanto è forte non deve voler dire
// aprire il file della ricerca.
export const ALLAN = {
  // ⚠️ Il tetto di tempo conta più della profondità.
  //
  // La ricerca gira sul telefono di chi sta giocando. Un avversario che
  // ci mette due secondi a ogni mossa rende la partita noiosa molto
  // prima di renderla difficile: 400 ms non si notano, e in 400 ms si
  // arriva comunque abbastanza in fondo perché Allan veda le trappole a
  // due mosse — che è quello che serve.
  millisecondiMax: 400,

  // ⚠️ Il limite oltre il quale non si scende comunque, anche se ci
  // fosse tempo — ed è la manopola vera della difficoltà, più del tempo.
  //
  // Misurato contro un avversario che mangia sempre il più possibile
  // (come gioca chi non sta pensando), su dodici partite: a profondità 2
  // Allan ne vince 11, a 3 ne vince 9, a 4 ne vince 6 e le altre sei
  // finiscono patte. Non perde mai, a nessuna profondità.
  //
  // Quattro è il punto in cui vede le trappole a due mosse — che è quello
  // che fa dire «gioca» — senza calcolare i finali alla perfezione, che è
  // quello che farebbe dire «è inutile provarci». Senza tetto
  // l'approfondimento progressivo arriverebbe a profondità venti in un
  // finale con quattro pezzi, e la partita diventerebbe imperdibile
  // proprio nel momento in cui uno sta per vincerla.
  profonditaMax: 4,

  // ⚠️ Quanto spesso gioca apposta la seconda mossa migliore.
  //
  // Non è pigrizia: un motore che gioca sempre il meglio, a questa
  // profondità, vince quasi sempre — e un avversario che non si batte
  // mai si smette di sfidare dopo due partite. «Medio» non è una via di
  // mezzo fra forte e debole: è forte abbastanza da far ragionare,
  // debole abbastanza da far vincere. Alzarlo lo rende sciocco, non più
  // simpatico.
  sbaglia: 0.18,

  // Quanto "ci pensa" prima di muovere, a schermo. Una mossa che compare
  // nell'istante in cui stacchi il dito non sembra una risposta: sembra
  // che il gioco stia giocando da solo.
  pausa: 450,
}

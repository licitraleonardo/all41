// Quando un telefono si aggancia, e quando no.
//
// ⚠️ Sta in un file suo, senza nessun import, per una ragione pratica:
// `aggancio.js` tira dentro il client Supabase, che fuori dal browser non
// esiste — e una regola che non si puo' provare fuori dal browser non si
// prova, e basta. Qui invece si prova.

// Il segno tiene **tutt'e due** le cose, e non e' pignoleria.
//
// Solo la sessione: chi entra come un altro membro sullo stesso telefono
// resterebbe agganciato al precedente. Solo il membro: una sessione nuova
// (cache svuotata, Safari privato, telefono nuovo) non si riaggancerebbe
// mai piu', perche' il segno di prima e' ancora li' — e il giorno della
// chiusura quel telefono resta fuori con l'app che gli sembra vuota.
export function segno(uid, membroId) {
  return `${uid}:${membroId}`
}

export function deveAgganciare({ uid, membroId, segnato }) {
  if (!uid || !membroId) return false
  return segnato !== segno(uid, membroId)
}

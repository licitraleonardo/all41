// Le regole della coda delle foto, senza IndexedDB e senza React, così si
// provano da riga di comando.
//
// La coda esisteva già, ma le decisioni su quando una voce entra, quando
// esce e di chi è stavano sparse in `Album.jsx` — ed è lì che si è
// nascosto il difetto peggiore: si toglieva la voce PRIMA di sapere se il
// ritentativo fosse andato bene. Una foto già al sicuro tornava in aria a
// ogni tocco di "Riprova".
//
// La regola che tiene insieme tutto il file è una sola:
//
//   una voce esce dalla coda solo per due motivi — è arrivata a
//   destinazione, oppure il suo autore ha detto di buttarla.
//
// Un rifiuto, un errore, una scadenza: tutti la lasciano dov'è.

import { MASSIMO_IN_CODA } from '../config/foto.js'

export function nuovaVoce({ id, file, nome, sfidaId = null, membroId, quando }) {
  return { id, file, nome, sfidaId, membroId, quando }
}

// Mette la voce in coda, o la aggiorna se c'era già.
//
// Aggiorna invece di aggiungere perché il ritentativo passa da qui: senza,
// ogni "Riprova" fallito lasciava un doppione con un id nuovo, e due voci
// senza nome sono indistinguibili — a quel punto la × si tocca su quella
// sbagliata.
//
// `quando` è quello della voce che c'era: è l'ora dello scatto, non l'ora
// dell'ultimo tentativo. Riscriverla faceva mentire l'etichetta ("Foto
// delle 21:40" per un tramonto delle 19:12) e saltare l'ordine.
export function conVoce(coda, voce, massimo = MASSIMO_IN_CODA) {
  const posto = coda.findIndex((v) => v.id === voce.id)

  if (posto >= 0) {
    const copia = [...coda]
    copia[posto] = { ...voce, quando: coda[posto].quando }
    return { coda: copia, entrata: true }
  }

  if (coda.length >= massimo) return { coda, entrata: false }
  return { coda: [...coda, voce], entrata: true }
}

export function senzaVoce(coda, id) {
  return coda.filter((v) => v.id !== id)
}

// Le voci che riguardano chi sta usando l'app adesso.
//
// La coda sta sul dispositivo, non sul profilo: senza questo filtro, chi
// entrava col codice di un altro si ritrovava in mano le foto in sospeso
// del precedente e, premendo Riprova, le caricava a nome proprio.
//
// Le voci senza `membroId` sono di prima che questo campo esistesse: si
// mostrano a chiunque, perché nasconderle vorrebbe dire far sparire una
// foto vera per rispettare una regola nuova.
export function mie(coda, membroId) {
  return coda.filter((v) => !v.membroId || v.membroId === membroId)
}

// Ordine di consegna: si riprova nell'ordine in cui sono state scattate.
export function inOrdine(coda) {
  return [...coda].sort((a, b) => (a.quando ?? 0) - (b.quando ?? 0))
}

// Una voce che non è riuscita a scriversi su IndexedDB vive solo nella
// memoria della schermata: basta cambiare scheda perché il componente si
// smonti e non ne resti niente. Va mostrata lo stesso — è pur sempre
// l'unico posto dove quella foto esiste — ma non deve sembrare al sicuro
// come le altre, o si obbedisce a un messaggio che non protegge.
export function soloInMemoria(voce) {
  return voce.salvata === false
}

// A quale partita appartiene ogni voto dell'Impostore.
//
// Serve perche' i voti non sono legati alla partita da nessuna chiave: la
// riga della partita ha una sola colonna `vote_id`, e ripartendo per un
// altro giro `chiudi_accusa` la azzera. Del primo giro non resta niente
// che dica "ero di quella partita li'".
//
// La regola e' una sola, e vale sia qui che nella lettura di una partita
// singola (`leggiSchedeDeiGiri` in partiteImpostore.js, che la scrive in
// SQL invece che in JavaScript):
//
//   un voto appartiene all'ultima partita cominciata prima di lui.
//
// Regge perche' di partita aperta ce n'e' sempre una sola. Ed e' per lo
// stesso motivo che le finestre hanno DUE estremi: col solo pavimento,
// "i voti di questa partita" diventa "i suoi piu' quelli di tutte le
// partite giocate dopo".

// ⚠️ `partite` devono essere TUTTE, in qualunque stato. Con le sole
// finite, i voti di una partita abbandonata a meta' finirebbero nel conto
// della finita che la precede — e li' dentro ci sono accuse vere, con id
// di persone vere, che diventerebbero indovini di una partita che non
// hanno giocato.
export function votiPerPartita(partite, voti) {
  const inizi = (partite ?? [])
    .filter((p) => p?.id && p?.creataIl)
    .map((p) => ({ id: p.id, quando: Date.parse(p.creataIl) }))
    .filter((p) => Number.isFinite(p.quando))
    // A parita' di istante l'id piu' basso, come ovunque in questo
    // progetto: due telefoni devono raggruppare allo stesso modo.
    .sort((a, b) => a.quando - b.quando || (a.id < b.id ? -1 : 1))

  const per = Object.fromEntries(inizi.map((p) => [p.id, []]))

  for (const voto of voti ?? []) {
    const quando = Date.parse(voto?.created_at)
    if (!Number.isFinite(quando)) continue

    // L'ultima cominciata prima di lui. Un voto nato prima di qualunque
    // partita non e' di nessuna: succede al voto d'apertura, che
    // `creaPartita` scrive un istante prima della riga della partita.
    let quale = null
    for (const p of inizi) {
      if (p.quando > quando) break
      quale = p.id
    }
    if (quale) per[quale].push(voto)
  }

  for (const id of Object.keys(per)) {
    per[id].sort(
      (a, b) =>
        Date.parse(a.created_at) - Date.parse(b.created_at) || (a.id < b.id ? -1 : 1)
    )
  }

  return per
}

// Sappiamo tutti i giri di questa partita, o solo una parte?
//
// Non e' una domanda oziosa: la risposta decide se il finale puo' dire
// "Nessuno ha indovinato". Con una parte dei giri quella frase e' falsa —
// e in classifica il +2 c'e' lo stesso.
//
// Il conto e' esatto perche' `giro` conta proprio i giri d'accusa: parte
// da uno e sale di uno ogni volta che il gruppo riparte senza accusare
// nessuno. Se le schede in mano sono almeno tante quante i giri, non ne
// manca nessuna.
export function giriTuttiNoti(partita, schedeDeiGiri) {
  const giri = partita?.giro ?? 1
  return (schedeDeiGiri?.length ?? 0) >= giri
}

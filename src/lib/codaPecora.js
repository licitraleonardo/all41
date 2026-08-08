const CHIAVE = 'all41.pecora.coda'

// I punteggi della Pecora fatti senza rete, tenuti da parte finché non si
// possono consegnare.
//
// Serviva davvero: il salvataggio falliva dentro un catch vuoto, con un
// commento che prometteva "resta nell'elenco locale finché non torna la
// rete" e nessun elenco da nessuna parte. Una gita in barca senza segnale
// e il record della giornata spariva — col +3 della Legge XX che a
// mezzanotte andava a chi aveva giocato col wifi del villaggio.
//
// La coda si comprime da sola: al database interessa solo il meglio di
// ciascuno per ogni giornata, quindi tre partite da consegnare diventano
// una riga. È la stessa forma della tabella, e vuol dire che la coda non
// cresce mai oltre il numero di giorni del viaggio.

// Funzione pura, provata da riga di comando.
export function accoda(coda, voce) {
  const altre = coda.filter((v) => !(v.membroId === voce.membroId && v.giorno === voce.giorno))
  const gia = coda.find((v) => v.membroId === voce.membroId && v.giorno === voce.giorno)
  const punti = Math.max(voce.punti, gia?.punti ?? 0)
  return [...altre, { membroId: voce.membroId, giorno: voce.giorno, punti }]
}

// Quello che resta da consegnare dopo che alcune voci sono passate.
export function togli(coda, consegnate) {
  const fatte = new Set(consegnate.map((v) => `${v.membroId}|${v.giorno}`))
  return coda.filter((v) => !fatte.has(`${v.membroId}|${v.giorno}`))
}

export function leggiCoda() {
  try {
    const grezzo = JSON.parse(localStorage.getItem(CHIAVE) ?? '[]')
    if (!Array.isArray(grezzo)) return []
    // Una riga storta non deve impedire di consegnare le altre.
    return grezzo.filter(
      (v) => v && typeof v.membroId === 'string' && typeof v.giorno === 'string' && v.punti > 0
    )
  } catch {
    return []
  }
}

export function salvaCoda(coda) {
  try {
    if (coda.length === 0) localStorage.removeItem(CHIAVE)
    else localStorage.setItem(CHIAVE, JSON.stringify(coda))
  } catch {
    // Safari in navigazione privata può rifiutare: pazienza, si perde
    // solo la coda, non il punteggio appena fatto.
  }
}

// Chi tiene il record della pecora, e quando. Niente Supabase qui
// dentro: da queste funzioni dipendono due Leggi che assegnano punti,
// quindi vanno provate da riga di comando come i conti delle Spese.
//
// Il dato di partenza è sempre lo stesso: una riga per persona e per
// giornata, col meglio che ha fatto quel giorno. Il record del giorno e
// quello del viaggio non sono salvati da nessuna parte, si ricavano.

// Il migliore di una giornata. In pareggio non vince nessuno, come per
// le sfide della caccia al tesoro: assegnare a caso è peggio che non
// assegnare, e a fine viaggio ci si ricorda dell'errore, non del punto.
export function migliore(righe) {
  if (righe.length === 0) return null

  const massimo = Math.max(...righe.map((r) => r.punteggio))
  if (massimo <= 0) return null

  const primi = righe.filter((r) => r.punteggio === massimo)
  if (primi.length !== 1) return null

  return { membroId: primi[0].membroId, punteggio: massimo }
}

export function classificaDelGiorno(righe, giorno) {
  return righe
    .filter((r) => r.giorno === giorno && r.punteggio > 0)
    .sort((a, b) => b.punteggio - a.punteggio || a.membroId.localeCompare(b.membroId))
}

export function recordDelGiorno(righe, giorno) {
  return migliore(righe.filter((r) => r.giorno === giorno))
}

// Il migliore di tutto il viaggio: la singola partita più alta, non la
// somma. È il record della pecora, non una classifica a punti.
export function recordDelViaggio(righe) {
  return migliore(righe)
}

// Il tuo meglio di oggi, per dirti se hai appena migliorato.
export function tuoRecord(righe, membroId, giorno) {
  const riga = righe.find((r) => r.membroId === membroId && r.giorno === giorno)
  return riga?.punteggio ?? 0
}

// Le giornate finite che aspettano ancora il loro +3 (Legge XX).
//
// Si valuta all'apertura del giorno dopo, come per la penalità di gruppo
// sulle foto: nessuno è sveglio a mezzanotte a chiudere la giornata, e
// senza questo il record del 13 resterebbe senza premio per sempre.
//
// `oggi` non entra mai nell'elenco: la giornata in corso può ancora
// cambiare padrone fino a mezzanotte.
export function giornateDaPremiare(righe, oggi, dataInizio, dataFine) {
  const giorni = [...new Set(righe.map((r) => r.giorno))]
    .filter((g) => g < oggi && g >= dataInizio && g <= dataFine)
    .sort()

  return giorni
    .map((giorno) => {
      const vincitore = recordDelGiorno(righe, giorno)
      return vincitore ? { giorno, ...vincitore } : null
    })
    .filter(Boolean)
}

// Il +5 di fine viaggio (Legge XXV), una volta sola e solo a viaggio
// concluso.
export function premioDelViaggio(righe, oggi, dataFine) {
  if (oggi <= dataFine) return null
  return recordDelViaggio(righe)
}

// Calcoli della classifica. Parte pura: si prova da riga di comando.
//
// MVP e Maglia Nera si ricavano al volo dagli eventi del giorno, senza
// nessun lavoro programmato che debba girare a mezzanotte.

// Solo gli eventi approvati muovono qualcosa: le proposte in attesa di
// voto non contano ancora.
export function saldiDelGiorno(eventi, data) {
  const saldi = new Map()
  for (const e of eventi) {
    if (e.stato !== 'approved') continue
    if (!e.creatoIl.startsWith(data)) continue
    saldi.set(e.membroId, (saldi.get(e.membroId) ?? 0) + e.punti)
  }
  return saldi
}

// MVP del giorno: chi ha guadagnato più punti in quella data. Se nessuno
// ha guadagnato niente non c'è MVP — zero non è una vittoria.
export function mvpDelGiorno(saldi) {
  return estremo(saldi, (valore, migliore) => valore > migliore, 0)
}

// Maglia Nera del giorno: il saldo più negativo, e solo se è davvero
// negativo. Il criterio è "punti persi" e non "guadagnati meno di tutti"
// apposta: col secondo la maglia finirebbe addosso a chi semplicemente
// non ha partecipato — telefono scarico, o era in acqua a godersi la
// vacanza. Così invece te la guadagni con i fatti.
export function magliaNeraDelGiorno(saldi) {
  return estremo(saldi, (valore, peggiore) => valore < peggiore, 0)
}

function estremo(saldi, meglio, soglia) {
  let vincitore = null
  let migliore = soglia
  for (const [membroId, valore] of saldi) {
    if (meglio(valore, migliore)) {
      migliore = valore
      vincitore = membroId
    }
  }
  return vincitore === null ? null : { membroId: vincitore, saldo: migliore }
}

// A viaggio finito il primo e l'ultimo della classifica prendono le due
// etichette, come chiusura simmetrica.
export function finaliDelViaggio(classifica) {
  if (classifica.length === 0) return { mvp: null, magliaNera: null }
  return {
    mvp: classifica[0],
    magliaNera: classifica.length > 1 ? classifica[classifica.length - 1] : null,
  }
}

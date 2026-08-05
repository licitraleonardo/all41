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

// A pari merito vince l'id più basso, e non il primo che capita
// nell'elenco. Sembra un dettaglio da niente ed è l'opposto: l'ordine
// degli eventi cambia da un telefono all'altro, quindi senza questo
// pareggio due telefoni che chiudono la stessa giornata scriverebbero
// due MVP diversi, e a vincere sarebbe chi ha premuto per primo.
function estremo(saldi, meglio, soglia) {
  let vincitore = null
  let migliore = soglia

  for (const [membroId, valore] of saldi) {
    const vince =
      meglio(valore, migliore) ||
      (vincitore !== null && valore === migliore && membroId < vincitore)

    if (vince) {
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

// ---------------------------------------------------- l'MVP di ogni giorno
//
// L'MVP vive solo dentro la sua giornata: a mezzanotte la data cambia, la
// card torna vuota e quello di ieri sparisce. Non e' nascosto — non
// esiste piu', perche' l'app tiene in memoria solo gli ultimi eventi e
// dopo una giornata movimentata ieri e' gia' fuori dalla finestra.
//
// Quindi si fissa: alla prima apertura dopo mezzanotte i giorni finiti si
// chiudono uno per uno e restano scritti. Da qui viene anche la Legge XXI,
// che senza una memoria di quante volte sei stato MVP non poteva scattare.

// I giorni gia' finiti e non ancora chiusi, dal primo all'ultimo. Si
// ferma a ieri: oggi non e' finito e l'MVP puo' ancora cambiare.
export function giorniDaChiudere(oggi, giaChiusi = [], primoGiorno) {
  if (!primoGiorno || !oggi) return []

  const fatti = new Set(giaChiusi)
  const giorni = []
  const data = new Date(`${primoGiorno}T12:00:00Z`)
  const limite = new Date(`${oggi}T12:00:00Z`)

  // Il limite e' oggi escluso, e c'e' un tetto: se qualcuno apre l'app
  // dopo mesi non deve mettersi a chiudere trecento giornate.
  while (data < limite && giorni.length < 30) {
    const iso = data.toISOString().slice(0, 10)
    if (!fatti.has(iso)) giorni.push(iso)
    data.setUTCDate(data.getUTCDate() + 1)
  }

  return giorni
}

// Il giorno prima, in formato data. Serve a sapere quale chiusura merita
// i coriandoli: le altre sono recuperi silenziosi di giornate vecchie.
export function ieriRispettoA(oggi) {
  const data = new Date(`${oggi}T12:00:00Z`)
  data.setUTCDate(data.getUTCDate() - 1)
  return data.toISOString().slice(0, 10)
}

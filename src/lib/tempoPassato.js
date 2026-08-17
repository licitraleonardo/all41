// Quanto tempo è passato dal viaggio, e come si dice in italiano.
//
// Sta qui e non dentro il componente perché è tutta roba che si può
// sbagliare in silenzio: un conto che va in negativo, un «0 giorni» che
// resta a schermo, un participio che sbaglia genere. Qui si prova.

const UN_MINUTO = 60000
const UN_ORA = 60
const UN_GIORNO = 24 * UN_ORA

export function scomponi(millisecondi) {
  if (!Number.isFinite(millisecondi)) return null
  // Prima della fine del viaggio non c'è niente da contare. ⚠️ Senza
  // questo, il giorno che si cambia la data del viaggio in
  // configurazione comparirebbe «sono passati -3 giorni», che è il tipo
  // di cosa che nessuno prova perché «non può succedere».
  if (millisecondi < 0) return null

  const minuti = Math.floor(millisecondi / UN_MINUTO)
  return {
    giorni: Math.floor(minuti / UN_GIORNO),
    ore: Math.floor((minuti % UN_GIORNO) / UN_ORA),
    minuti: minuti % UN_ORA,
  }
}

// ⚠️ Il participio si accorda col PRIMO pezzo che si dice, non con
// l'ultimo: «sono passati 4 giorni e 12 minuti», ma «sono passate 23 ore
// e 12 minuti». È lo stesso inciampo di `Riparo.jsx` — «le foto si è
// rotto» — e qui capiterebbe per quasi un'ora ogni giorno, cioè
// abbastanza spesso da farsi notare.
const UNITA = [
  { chiave: 'giorni', uno: 'giorno', tanti: 'giorni', femminile: false },
  { chiave: 'ore', uno: 'ora', tanti: 'ore', femminile: true },
  { chiave: 'minuti', uno: 'minuto', tanti: 'minuti', femminile: false },
]

export function inParole(pezzi) {
  if (!pezzi) return null

  // I pezzi a zero si saltano: «4 giorni e 12 minuti» invece di «4
  // giorni, 0 ore e 12 minuti».
  const dette = UNITA.filter((u) => pezzi[u.chiave] > 0)
  if (dette.length === 0) return { verbo: null, elenco: null }

  const parti = dette.map((u) => {
    const n = pezzi[u.chiave]
    return `${n} ${n === 1 ? u.uno : u.tanti}`
  })

  const elenco =
    parti.length === 1
      ? parti[0]
      : `${parti.slice(0, -1).join(', ')} e ${parti[parti.length - 1]}`

  return { verbo: dette[0].femminile ? 'passate' : 'passati', elenco }
}

// Chi ha fatto cosa, in numeri. Parte pura: si prova da riga di comando.
//
// Non c'e' niente di nuovo nel database. Tutto quello che serve e' gia'
// scritto da qualche parte — i messaggi, le foto, i vocali, i punti — e
// qui si conta soltanto. Una sezione che aggiunge una tabella per dire
// cose che si sapevano gia' sarebbe uno spreco.

export const VOCI = [
  { id: 'punti', nome: 'Punti', icona: '🏆' },
  { id: 'messaggi', nome: 'Messaggi', icona: '💬' },
  { id: 'vocali', nome: 'Vocali', icona: '🎤' },
  { id: 'foto', nome: 'Foto', icona: '📷' },
  { id: 'suoni', nome: 'Suoni', icona: '🔊' },
  { id: 'leggi', nome: 'Leggi scattate', icona: '📜' },
  { id: 'pecora', nome: 'Record All', icona: '🐉' },
]

// I titoli: a chi sta in cima in ciascuna categoria. Servono a leggere la
// tabella senza leggerla — con otto persone e sette colonne, i numeri da
// soli non dicono niente a colpo d'occhio.
//
// Il minimo evita i titoli tristi: "il fotografo" a chi ha caricato una
// foto sola perche' gli altri zero non fa ridere nessuno.
export const TITOLI = [
  { voce: 'messaggi', titolo: 'Il chiacchierone', minimo: 10 },
  { voce: 'vocali', titolo: 'La voce', minimo: 5 },
  { voce: 'foto', titolo: 'L’occhio', minimo: 5 },
  { voce: 'suoni', titolo: 'Il rumoroso', minimo: 10 },
  { voce: 'leggi', titolo: 'Il pregiudicato', minimo: 3 },
  { voce: 'pecora', titolo: 'Il domatore', minimo: 100 },
]

// Conta le righe per persona. `chiave` dice dove sta l'autore, perche' le
// tabelle non lo chiamano tutte allo stesso modo.
export function contaPerMembro(righe, chiave = 'author_id') {
  const conta = {}
  for (const r of righe ?? []) {
    const chi = r[chiave]
    if (!chi) continue
    conta[chi] = (conta[chi] ?? 0) + 1
  }
  return conta
}

// Il massimo per persona, non la somma: per la Pecora conta la partita
// migliore, non quante ne hai giocate.
export function massimoPerMembro(righe, chiave, valore) {
  const massimo = {}
  for (const r of righe ?? []) {
    const chi = r[chiave]
    if (!chi) continue
    const v = r[valore] ?? 0
    if (massimo[chi] === undefined || v > massimo[chi]) massimo[chi] = v
  }
  return massimo
}

// Una riga per persona, con tutte le voci. Chi non ha fatto niente resta
// in tabella con degli zeri: sparire dall'elenco perche' non hai
// partecipato e' peggio che vedersi uno zero.
export function tabella({ membri, conteggi }) {
  return (membri ?? []).map((m) => {
    const riga = { id: m.id, nome: m.nome, punti: m.punteggio ?? 0 }
    for (const v of VOCI) {
      if (v.id === 'punti') continue
      riga[v.id] = conteggi[v.id]?.[m.id] ?? 0
    }
    return riga
  })
}

// Chi sta in cima a ogni categoria. A pari merito vince l'id piu' basso,
// come per l'MVP: senza, due telefoni mostrerebbero due vincitori
// diversi per gli stessi identici numeri.
export function titoli(righe) {
  const esito = []

  for (const t of TITOLI) {
    let primo = null
    for (const r of righe ?? []) {
      const v = r[t.voce] ?? 0
      if (v < t.minimo) continue
      if (!primo || v > primo.valore || (v === primo.valore && r.id < primo.id)) {
        primo = { id: r.id, nome: r.nome, valore: v }
      }
    }
    if (primo) esito.push({ ...t, ...primo })
  }

  return esito
}

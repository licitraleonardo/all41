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

// ------------------------------------------------------- per i grafici

// Una voce sola, ordinata dal piu' alto, con quanto e' lunga la barra
// rispetto al primo. Zero resta zero: una barra minima per chi non ha
// fatto niente direbbe una bugia piccola ma direbbe una bugia.
export function classificaPerVoce(righe, voce) {
  const elenco = (righe ?? [])
    .map((r) => ({ id: r.id, nome: r.nome, valore: r[voce] ?? 0 }))
    // A pari merito l'id piu' basso, come ovunque: due telefoni non
    // devono mostrare due ordini diversi per gli stessi numeri.
    .sort((a, b) => b.valore - a.valore || (a.id < b.id ? -1 : 1))

  // I punti possono essere negativi — e' il gioco — e una barra larga
  // meno di zero non esiste: il browser la ignora e resta quella di
  // prima, cioe' mostra il numero di un altro. Si taglia a zero, e il
  // valore negativo resta scritto accanto, che e' la verita'.
  const massimo = elenco[0]?.valore ?? 0
  return elenco.map((r) => ({
    ...r,
    quota: massimo > 0 ? Math.min(1, Math.max(0, r.valore / massimo)) : 0,
  }))
}

// A che posto sta una persona in una voce. Serve alla scheda personale:
// "quarto su undici" dice molto piu' di un numero da solo.
export function posizioneDi(righe, voce, id) {
  const elenco = classificaPerVoce(righe, voce)
  const dove = elenco.findIndex((r) => r.id === id)
  if (dove < 0) return null
  return { posto: dove + 1, su: elenco.length, valore: elenco[dove].valore }
}

// Le voci in cui uno se la cava meglio: quelle dove sta piu' in alto.
// E' il pezzo che rende la scheda personale invece che una copia della
// tabella di tutti.
export function dovePrimeggia(righe, id, quante = 3) {
  return VOCI.map((v) => ({ voce: v, ...posizioneDi(righe, v.id, id) }))
    .filter((r) => r.posto && r.valore > 0)
    .sort((a, b) => a.posto - b.posto || b.valore - a.valore)
    .slice(0, quante)
}

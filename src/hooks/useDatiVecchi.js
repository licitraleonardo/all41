import { useEffect, useState } from 'react'
import { quandoSiRipiega } from '../lib/cache.js'

// «Dati delle 18:04». Si iscrive al canale laterale di `lib/cache.js` e
// dice se quello che c'è a schermo viene da una copia, e di quando.
//
// Serve perché la striscia «Niente rete» guarda `navigator.onLine`, che
// con una tacca di segnale dice *sono online*: nel caso più comune — la
// rete che c'è ma non risponde — non compariva niente, e una classifica
// di due ore prima passava per quella di adesso.
export function useDatiVecchi() {
  const [copia, setCopia] = useState(null)

  useEffect(() => quandoSiRipiega(setCopia), [])

  return copia
}

// L'ora e basta, senza data: chi legge sta guardando lo schermo adesso, e
// «18:04» si confronta con l'orologio senza doverci pensare. Se la copia
// è di un altro giorno lo dice, perché lì «18:04» sarebbe una bugia.
export function oraDellaCopia(quando, adesso = new Date()) {
  // ⚠️ `new Date(null)` non è una data invalida: è il 1º gennaio 1970.
  // Senza questa riga una copia senza data finiva a schermo come «Dati
  // del 1 gennaio», che è la cosa più allarmante che l'app potesse dire
  // per un campo semplicemente mancante.
  if (typeof quando !== 'string' || quando === '') return null

  const data = new Date(quando)
  if (Number.isNaN(data.getTime())) return null

  const ora = data.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  if (data.toDateString() === adesso.toDateString()) return `delle ${ora}`

  const ieri = new Date(adesso)
  ieri.setDate(ieri.getDate() - 1)
  if (data.toDateString() === ieri.toDateString()) return `di ieri, ${ora}`

  return `del ${data.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}`
}

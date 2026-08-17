// Chi sale sul podio.
//
// ⚠️ Funzione pura, e non una riga dentro il componente, per una ragione
// che vale più della pulizia: **il podio deve essere lo stesso su tutti
// gli otto telefoni.** È una premiazione, non una schermata — se Martina
// vede sé stessa prima e Gioxs vede sé stesso primo, la festa diventa
// una lite.

import { PODIO } from '../config/podio.js'

// ⚠️ L'ordinamento NON si fida di quello che arriva dal database.
//
// `leggiClassifica` ordina solo per punteggio (`order('score')`), senza
// spareggio: a parità, Postgres restituisce le righe nell'ordine che gli
// conviene, e può essere diverso da una richiesta all'altra. Oggi i
// punteggi sono tutti distinti e non si vedrebbe mai — cioè è il tipo di
// difetto che aspetta il caso giusto per farsi notare, e il caso giusto
// sarebbe la sera della premiazione.
//
// Il nome come spareggio è arbitrario, ed è esattamente il punto: deve
// essere arbitrario **allo stesso modo per tutti**. È la stessa scelta
// che c'è in `chiDeveAChi`, e per lo stesso motivo.
export function ordina(gente) {
  return [...(gente ?? [])].sort(
    (a, b) => (b.punteggio ?? 0) - (a.punteggio ?? 0) || (a.nome ?? '').localeCompare(b.nome ?? '')
  )
}

export function primiTre(gente) {
  const ordinata = ordina(gente)
  // Sotto i tre non c'è un podio: non si inventa un gradino vuoto.
  if (ordinata.length < PODIO.minimo) return null
  return ordinata.slice(0, 3).map((chi, i) => ({ ...chi, posto: i + 1 }))
}

// L'ordine in cui si scoprono: terzo, secondo, primo.
export function ordineDiScoperta(tre) {
  if (!tre) return []
  return [...tre].reverse()
}

// Quanti sono già stati scoperti dopo `passati` millisecondi.
//
// Sta qui e non dentro un `useEffect` perché è la parte che si sbaglia:
// un fuori-di-uno e il primo posto non compare mai, oppure compaiono
// tutti insieme e la premiazione diventa un elenco.
export function quantiScoperti(passati, passo = PODIO.passo) {
  if (!Number.isFinite(passati) || passati < 0) return 0
  return Math.min(3, Math.floor(passati / passo) + 1)
}

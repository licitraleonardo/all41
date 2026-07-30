import { GIORNI } from '../config/itinerario.js'

// Data del dispositivo in formato YYYY-MM-DD. Volutamente NON passa da UTC:
// alle 01:00 in Italia la data UTC è ancora quella di ieri, e il giorno
// "OGGI" finirebbe sulla riga sbagliata proprio a fine serata.
export function dataDiOggi(adesso = new Date()) {
  const due = (n) => String(n).padStart(2, '0')
  return `${adesso.getFullYear()}-${due(adesso.getMonth() + 1)}-${due(adesso.getDate())}`
}

// Fuori dal 12–16 non c'è nessun giorno corrente, come da spec.
export function giornoCorrente(adesso = new Date()) {
  const oggi = dataDiOggi(adesso)
  return GIORNI.find((g) => g.data === oggi) ?? null
}

// Calcolato, non scritto a mano: i nomi dei giorni cambiano ogni anno.
export function giornoDellaSettimana(data) {
  const [anno, mese, giorno] = data.split('-').map(Number)
  return new Date(anno, mese - 1, giorno).toLocaleDateString('it-IT', { weekday: 'long' })
}

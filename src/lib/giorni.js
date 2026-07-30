import { GIORNI } from '../config/itinerario.js'

// Data del dispositivo in formato YYYY-MM-DD. Volutamente NON passa da UTC:
// alle 01:00 in Italia la data UTC è ancora quella di ieri, e il giorno
// "OGGI" finirebbe sulla riga sbagliata proprio a fine serata.
export function dataDiOggi(adesso = new Date()) {
  const due = (n) => String(n).padStart(2, '0')
  return `${adesso.getFullYear()}-${due(adesso.getMonth() + 1)}-${due(adesso.getDate())}`
}

// Fuori dal 12–16 non c'è nessun giorno corrente, come da spec.
export function giornoPerData(data) {
  return GIORNI.find((g) => g.data === data) ?? null
}

export function giornoCorrente(adesso = new Date()) {
  return giornoPerData(dataDiOggi(adesso))
}

// Calcolato, non scritto a mano: i nomi dei giorni cambiano ogni anno.
export function giornoDellaSettimana(data) {
  return aData(data).toLocaleDateString('it-IT', { weekday: 'long' })
}

function aData(iso) {
  const [anno, mese, giorno] = iso.split('-').map(Number)
  return new Date(anno, mese - 1, giorno)
}

// Math.round e non floor: l'ora legale rende alcuni giorni di 23 o 25 ore,
// e un troncamento sbaglierebbe il conteggio proprio a cavallo del cambio.
function giorniTra(da, a) {
  return Math.round((aData(a) - aData(da)) / 86400000)
}

// Le date ISO si confrontano bene come stringhe: 2026-08-09 < 2026-08-12.
export function statoViaggio(data) {
  const primo = GIORNI[0].data
  const ultimo = GIORNI[GIORNI.length - 1].data

  if (data < primo) return { fase: 'prima', mancano: giorniTra(data, primo) }
  if (data > ultimo) return { fase: 'dopo' }
  return { fase: 'durante' }
}

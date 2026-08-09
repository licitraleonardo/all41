import { GIORNI } from '../config/itinerario.js'

// Data del dispositivo in formato YYYY-MM-DD. Volutamente NON passa da UTC:
// alle 01:00 in Italia la data UTC è ancora quella di ieri, e il giorno
// "OGGI" finirebbe sulla riga sbagliata proprio a fine serata.
export function dataDiOggi(adesso = new Date()) {
  const due = (n) => String(n).padStart(2, '0')
  return `${adesso.getFullYear()}-${due(adesso.getMonth() + 1)}-${due(adesso.getDate())}`
}

// Da quando a quando dura una giornata, in istanti veri da mandare al
// database.
//
// ⚠️ Esiste perché le due metà dell'app non erano d'accordo su cosa sia
// «oggi». `dataDiOggi` usa il giorno del telefono — giustamente, e il
// commento qui sopra dice perché — mentre chi leggeva gli eventi di una
// giornata chiedeva al database `created_at >= '2026-08-14T00:00:00'`,
// senza fuso: Postgres lo legge come mezzanotte UTC.
//
// In Italia d'estate sono due ore di scarto, e cadono nel punto peggiore.
// Tutto quello che si guadagna fra mezzanotte e le due — le partite a
// Impostore e a dama dopo cena, la soundboard dell'una di notte che ha una
// Legge sua — per il telefono è di oggi e per il database è ancora di ieri.
// Risultato: non finiva in nessun MVP. Troppo tardi per ieri, perché la
// riga su `mvp_days` era già scritta e la chiave primaria non la fa
// riscrivere; e non abbastanza per oggi.
//
// Qui la giornata comincia e finisce a mezzanotte **del telefono**, e i due
// estremi si mandano come istanti espliciti.
export function estremiDelGiorno(giorno) {
  const [anno, mese, numero] = giorno.split('-').map(Number)
  const inizio = new Date(anno, mese - 1, numero, 0, 0, 0, 0)
  // Il giorno dopo alla stessa ora: `new Date` normalizza da solo i
  // trentuno del mese e i cambi d'anno, quindi non c'è niente da contare.
  const fine = new Date(anno, mese - 1, numero + 1, 0, 0, 0, 0)
  return { da: inizio.toISOString(), a: fine.toISOString() }
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

// Le date ISO si confrontano bene come stringhe: 2026-08-09 < 2026-08-12.
export function statoDelViaggio(data) {
  if (data < GIORNI[0].data) return 'prima'
  if (data > GIORNI[GIORNI.length - 1].data) return 'dopo'
  return 'durante'
}

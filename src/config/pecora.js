// Il tema del gioco è un dato, non codice. Lo spec lo chiede
// esplicitamente: il motore di un endless runner è identico ovunque,
// cambiano solo i disegni. In Islanda sarebbe un husky fra blocchi di
// ghiaccio, e non si toccherebbe una riga di logica.
//
// Quindi qui dentro non c'è niente che il motore debba capire: sono
// nomi. Chi li disegna sta in Pecora.jsx, chi li fa scorrere in
// lib/pecora.js, e nessuno dei due sa cosa sia un nuraghe.

export const TEMA = {
  protagonista: 'pecora',
  ostacoli: ['fico-india', 'nuraghe', 'muretto'],
  volante: 'gabbiano',
  cielo: '#0B3550',
  terra: '#F2A93B',
}

// Misure del mondo, in unità sue: il canvas ci si adatta sopra, così la
// fisica non cambia fra un telefono stretto e un desktop.
export const MONDO = {
  larghezza: 600,
  altezza: 180,
  suolo: 34, // quanto è alta la striscia di terra
  giocatoreX: 56,
}

export const FISICA = {
  gravita: 2200, // unità al secondo quadrato
  spintaSalto: 640,
  velocitaIniziale: 260,
  velocitaMax: 620,
  accelerazione: 7, // quanto accelera ogni secondo
  // Un salto dura 2·spinta/gravità ≈ 0,58s e arriva a spinta²/(2·gravità)
  // ≈ 93 unità: sopra ogni ostacolo di terra, che è ciò che conta.
}

export const SAGOME = {
  pecora: { larghezza: 34, altezza: 30 },
  'fico-india': { larghezza: 26, altezza: 36, quota: 0 },
  nuraghe: { larghezza: 36, altezza: 44, quota: 0 },
  muretto: { larghezza: 48, altezza: 22, quota: 0 },
  // Passa basso ma non a terra: non si salta, ci si passa sotto restando
  // giù. È il gabbiano al posto dello pterodattilo.
  gabbiano: { larghezza: 38, altezza: 16, quota: 46 },
}

export const RITMO = {
  // Distanza minima fra un ostacolo e il successivo, in multipli di
  // quanto si percorre durante un salto: sotto questa soglia ci sono
  // combinazioni impossibili da superare, e un gioco che uccide senza
  // scampo non è difficile, è rotto.
  stacco: 1.35,
  staccoExtra: 1.4, // quanto può allungarsi a caso oltre il minimo
  // Il gabbiano non compare subito: prima si impara a saltare.
  volanteDopo: 400,
  probabilitaVolante: 0.22,
}

// Un punto ogni dieci unità percorse: numeri che crescono a una velocità
// leggibile, non un contachilometri impazzito.
export const UNITA_PER_PUNTO = 10

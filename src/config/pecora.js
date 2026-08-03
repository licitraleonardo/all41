// Il tema del gioco è un dato, non codice. Lo spec lo chiede
// esplicitamente: il motore di un endless runner è identico ovunque,
// cambiano solo i disegni. In Islanda sarebbe Alan con le orecchie da
// husky fra blocchi di ghiaccio, e non si toccherebbe una riga di logica.
//
// Quindi qui dentro non c'è niente che il motore debba capire: sono
// nomi. Chi li disegna sta in Pecora.jsx, chi li fa scorrere in
// lib/pecora.js, e nessuno dei due sa cosa sia un nuraghe.

export const TEMA = {
  // Alan è il draghetto e basta: niente vestiti, niente accessori. A 30
  // pixel ogni dettaglio in più diventa una macchia, e il personaggio si
  // riconosce dalla sagoma. Se un giorno si vorrà cambiare ambientazione
  // si cambierà lo sfondo — cielo, terra, ostacoli — non lui.
  protagonista: 'alan',
  ostacoli: ['fico-india', 'nuraghe', 'muretto'],
  volante: 'gabbiano',
  raggio: 'raggio',
  navicella: 'navicella',
  cielo: '#79B4D4',
  terra: '#F2A93B',
  nuvola: '#F7F4EC',
}

// Misure del mondo, in unità sue: il canvas ci si adatta sopra, così la
// fisica non cambia fra un telefono stretto e un desktop.
//
// Il riquadro è più alto che largo di quanto sembri necessario apposta:
// su un telefono da 375px un rettangolo 600×180 diventa alto 112px, cioè
// una fessura. Il cielo in più non serve alla fisica, serve a far
// sembrare il gioco un gioco.
// Il riquadro è più stretto e più alto di quanto sembri necessario
// apposta. Su un telefono da 375px la larghezza è quella e non si
// discute: l'unico modo di far vedere Alan più grande è mettere meno
// mondo dentro la stessa striscia. Da 600×180 a 500×320 il personaggio
// passa da 25 a 30 pixel veri e il riquadro da 112 a 240 di altezza.
export const MONDO = {
  larghezza: 500,
  altezza: 320,
  suolo: 48, // quanto è alta la striscia di terra
  giocatoreX: 52,
}

export const FISICA = {
  gravita: 2200, // unità al secondo quadrato
  spintaSalto: 640,
  velocitaIniziale: 260,
  velocitaMax: 700,
  accelerazione: 7, // quanto accelera ogni secondo
  // Un salto dura 2·spinta/gravità ≈ 0,58s e arriva a spinta²/(2·gravità)
  // ≈ 93 unità: sopra ogni ostacolo di terra, che è ciò che conta.
}

export const SAGOME = {
  alan: { larghezza: 40, altezza: 36 },
  'fico-india': { larghezza: 26, altezza: 38, quota: 0 },
  nuraghe: { larghezza: 36, altezza: 46, quota: 0 },
  muretto: { larghezza: 50, altezza: 24, quota: 0 },
  // Passa basso ma non a terra: non si salta, ci si passa sotto restando
  // giù. È il gabbiano al posto dello pterodattilo.
  gabbiano: { larghezza: 40, altezza: 18, quota: 52 },
  // Il raggio prende la quota dalla navicella che lo spara, quindi qui
  // non ne ha una sua.
  raggio: { larghezza: 30, altezza: 26 },
  navicella: { larghezza: 84, altezza: 34 },
}

export const RITMO = {
  // Distanza minima fra un ostacolo e il successivo, in multipli di
  // quanto si percorre durante un salto: sotto questa soglia ci sono
  // combinazioni impossibili da superare, e un gioco che uccide senza
  // scampo non è difficile, è rotto. Questo numero non scende mai.
  stacco: 1.35,

  // La difficoltà cresce stringendo il respiro fra un ostacolo e
  // l'altro, non accorciando lo stacco minimo: all'inizio c'è molto
  // spazio in più a caso, dopo qualche migliaio di unità quasi niente.
  // Così il gioco diventa duro restando sempre leale.
  staccoExtraIniziale: 1.5,
  staccoExtraFinale: 0.35,
  distanzaDiRodaggio: 4500,

  // Anche il gabbiano si fa vedere più spesso andando avanti.
  volanteDopo: 400,
  volanteDaProbabilita: 0.18,
  volanteAProbabilita: 0.34,
}

export const NAVICELLA = {
  // Sempre allo stesso punteggio, e scritto sotto il gioco. Legarlo al
  // record lo rendeva un evento che non si sa quando arriva: ogni
  // partita una soglia diversa, invisibile, e nessuno può prepararsi.
  soglia: 300,

  // Sta ferma sul bordo destro, come Alan sta fermo sul sinistro, e i
  // raggi nascono da lì. Non li insegue e non si avvicina: è il mondo
  // che scorre, e quella resta.
  x: 454,

  // Tre quote fra cui si sposta a caso. Raso terra obbliga a saltare, al
  // centro obbliga a restare giù. Quella in alto passa sopra la testa
  // anche saltando: è un respiro, non un terzo pericolo — coi due soli
  // comandi che ci sono non potrebbe essere altro, ma fa vedere che la
  // navicella si muove.
  quote: [0, 44, 140],

  // Quanto ci mette a cambiare quota, e a scendere dal cielo la prima
  // volta.
  velocitaVerticale: 190,
  quotaDArrivo: 330,

  // Ogni quanto, fra gli ostacoli che tocca generare, tocca a un raggio.
  probabilitaRaggio: 0.38,

  // Il lampo alla bocca quando spara: dura poco, ma è quello che lega il
  // raggio alla navicella invece di farlo sembrare un ostacolo qualunque.
  lampo: 0.22,
}

export const NUVOLE = {
  quante: 5,
  // Scorrono più piano di tutto il resto: è la parallasse che dà la
  // sensazione di distanza, e costa due moltiplicazioni.
  lentezza: 0.22,
}

// Un punto ogni dieci unità percorse: numeri che crescono a una velocità
// leggibile, non un contachilometri impazzito.
export const UNITA_PER_PUNTO = 10

export const CHIAVE_RECORD = 'all41.pecora.record'

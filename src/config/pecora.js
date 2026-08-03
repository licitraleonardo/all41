// Il tema del gioco è un dato, non codice. Lo spec lo chiede
// esplicitamente: il motore di un endless runner è identico ovunque,
// cambiano solo i disegni. In Islanda sarebbe Alan con le orecchie da
// husky fra blocchi di ghiaccio, e non si toccherebbe una riga di logica.
//
// Quindi qui dentro non c'è niente che il motore debba capire: sono
// nomi. Chi li disegna sta in Pecora.jsx, chi li fa scorrere in
// lib/pecora.js, e nessuno dei due sa cosa sia un nuraghe.

export const TEMA = {
  // Alan è un dragone, e in Sardegna porta il giubbotto di pecora — da
  // cui il nome del gioco. Cambiando meta si cambia questo nome e il
  // disegno corrispondente: 'alan-islanda' avrebbe le orecchie da husky.
  protagonista: 'alan-sardegna',
  ostacoli: ['fico-india', 'nuraghe', 'muretto'],
  volante: 'gabbiano',
  // Arrivano solo dopo che hai battuto il record.
  raggi: ['raggio-basso', 'raggio-alto'],
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
export const MONDO = {
  larghezza: 600,
  altezza: 280,
  suolo: 46, // quanto è alta la striscia di terra
  giocatoreX: 56,
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
  'alan-sardegna': { larghezza: 40, altezza: 36 },
  'fico-india': { larghezza: 26, altezza: 38, quota: 0 },
  nuraghe: { larghezza: 36, altezza: 46, quota: 0 },
  muretto: { larghezza: 50, altezza: 24, quota: 0 },
  // Passa basso ma non a terra: non si salta, ci si passa sotto restando
  // giù. È il gabbiano al posto dello pterodattilo.
  gabbiano: { larghezza: 40, altezza: 18, quota: 52 },
  // I raggi della navicella. Uno costringe a saltare, l'altro a NON
  // saltare: un raggio verticale sarebbe inschivabile, perché il
  // protagonista non si sposta mai in orizzontale.
  'raggio-basso': { larghezza: 26, altezza: 30, quota: 0 },
  'raggio-alto': { larghezza: 46, altezza: 24, quota: 54 },
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
  // Arriva quando superi il record: da lì in poi ai nuraghi si
  // aggiungono i suoi raggi.
  probabilitaRaggio: 0.34,
  // Chi non ha ancora un record deve poterla vedere lo stesso, o la
  // sorpresa non arriva mai alla prima partita.
  recordMinimo: 250,
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

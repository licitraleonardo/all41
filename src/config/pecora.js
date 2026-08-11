// Il tema del gioco è un dato, non codice. Lo spec lo chiede
// esplicitamente: il motore di un endless runner è identico ovunque,
// cambiano solo i disegni. In Islanda sarebbe Allan con le orecchie da
// husky fra blocchi di ghiaccio, e non si toccherebbe una riga di logica.
//
// Quindi qui dentro non c'è niente che il motore debba capire: sono
// nomi. Chi li disegna sta in Pecora.jsx, chi li fa scorrere in
// lib/pecora.js, e nessuno dei due sa cosa sia un nuraghe.

export const TEMA = {
  // Allan è il draghetto e basta: niente vestiti, niente accessori. A 30
  // pixel ogni dettaglio in più diventa una macchia, e il personaggio si
  // riconosce dalla sagoma. Se un giorno si vorrà cambiare ambientazione
  // si cambierà lo sfondo — cielo, terra, ostacoli — non lui.
  protagonista: 'allan',
  ostacoli: ['fico-india', 'nuraghe', 'muretto'],
  volante: 'gabbiano',
  // Tre raggi invece di uno: cambia la sagoma, quindi cambia il momento
  // in cui devi saltare. Con un comando solo la varieta' puo' stare
  // soltanto qui.
  raggi: ['raggio', 'raggio-lungo', 'raggio-alto'],
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
// discute: l'unico modo di far vedere Allan più grande è mettere meno
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

  // ⚠️ Il tetto non è un capriccio: è dove il gioco smetterebbe di essere
  // difficile e comincerebbe a essere rotto.
  //
  // La scena è larga 500 unità e Allan corre a 52: un ostacolo si vede
  // per (500-52)/velocità secondi prima di arrivargli addosso. A 700 fa
  // 0,64 s — comodissimo, ed è il motivo per cui era troppo facile. A
  // 1150 fa 0,39 s, che è duro ma sta sopra il tempo di reazione umano
  // (~0,25 s) con margine per decidere. Oltre i 1400 (0,32 s) non è più
  // una sfida: è un dado.
  velocitaMax: 1150,

  // Quanto accelera al secondo, e quanto **cresce** quell'accelerazione.
  //
  // Prima era una sola costante e la corsa saliva in linea retta: dopo il
  // primo minuto non cambiava più niente e restava uguale a sé stessa per
  // sempre. Il secondo termine è quello che si sente — la corsa non
  // smette mai di stringere, e il tetto arriva verso i 50 secondi invece
  // che al minuto e mezzo.
  accelerazione: 9,
  accelerazioneCrescente: 0.25,
  // Un salto dura 2·spinta/gravità ≈ 0,58s e arriva a spinta²/(2·gravità)
  // ≈ 93 unità: sopra ogni ostacolo di terra, che è ciò che conta.
}

export const SAGOME = {
  allan: { larghezza: 40, altezza: 36 },
  'fico-india': { larghezza: 26, altezza: 38, quota: 0 },
  nuraghe: { larghezza: 36, altezza: 46, quota: 0 },
  muretto: { larghezza: 50, altezza: 24, quota: 0 },
  // Passa basso ma non a terra: non si salta, ci si passa sotto restando
  // giù. È il gabbiano al posto dello pterodattilo.
  gabbiano: { larghezza: 40, altezza: 18, quota: 52 },
  // Il raggio prende la quota dalla navicella che lo spara, quindi qui
  // non ne ha una sua.
  raggio: { larghezza: 30, altezza: 26 },
  // Largo: si salta prima, perche' sotto ci resti piu' a lungo.
  'raggio-lungo': { larghezza: 64, altezza: 22 },
  // Alto: raso terra va scavalcato pulito, e il salto ha meno margine.
  'raggio-alto': { larghezza: 26, altezza: 52 },
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

  // Oltre il muro il respiro si chiude quasi del tutto: resta lo stacco
  // minimo e un soffio. Difficile fin dove la fisica lo consente, mai
  // oltre — un gioco che uccide senza scampo non e' difficile, e' rotto.
  staccoExtraOltreIlMuro: 0.1,

  // Le doppiette: due ostacoli attaccati che si scavalcano con un salto
  // solo. Sono la cosa che rende il ritmo cattivo senza renderlo sleale,
  // perche' la coppia resta larga meno di quanto copre un salto.
  doppiettaDopo: 2000,
  doppiettaProbabilita: 0.22,
  doppiettaStacco: 8,
  // Quanta parte del margine fisico puo' occupare una coppia. Non e' una
  // frazione del salto: e' una frazione di quello che ci sta davvero nel
  // tempo passato sopra l'ostacolo piu' alto, tolto il corpo di Allan.
  // A 0.6 resta abbastanza aria da poter sbagliare il tempo di un
  // capello e cavarsela lo stesso.
  doppiettaLarghezzaMax: 0.6,

  // Anche il gabbiano si fa vedere più spesso andando avanti.
  volanteDopo: 400,
  volanteDaProbabilita: 0.18,
  volanteAProbabilita: 0.34,
}

export const NAVICELLA = {
  // Sempre allo stesso punteggio, ma non scritto da nessuna parte: era
  // stampato sotto il gioco e toglieva la sorpresa. Resta fisso e non
  // casuale perche' cosi' si impara giocando, che e' diverso
  // dall'indovinare.
  soglia: 300,

  // Sta ferma sul bordo destro, come Allan sta fermo sul sinistro, e i
  // raggi nascono da lì. Non li insegue e non si avvicina: è il mondo
  // che scorre, e quella resta.
  x: 454,

  // Tre quote fra cui si sposta a caso. Raso terra obbliga a saltare, al
  // centro obbliga a restare giù. Quella in alto passa sopra la testa
  // anche saltando: è un respiro, non un terzo pericolo — coi due soli
  // comandi che ci sono non potrebbe essere altro, ma fa vedere che la
  // navicella si muove.
  quote: [0, 44, 140],

  // Quanto spesso sceglie ciascuna quota. Quella in alto e' un respiro,
  // non un pericolo, e prima usciva quanto le altre: la navicella se ne
  // stava lassu' a far niente per mezza partita.
  pesiQuote: [0.42, 0.42, 0.16],

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

// Il muro: da qui in poi il gioco smette di essere gentile.
//
// Il record finto serve a chi non ne ha ancora uno. Senza, il primo che
// gioca non incontrerebbe mai la parte dura, e il gioco sembrerebbe
// facile proprio a chi lo prova per la prima volta.
export const MURO = {
  recordFinto: 600,
}

// Dove si stringe: oltre il muro la velocita' sale piu' in fretta e il
// respiro fra gli ostacoli si chiude.
export function muroDi(record) {
  return Math.max(MURO.recordFinto, record || 0)
}

export const CHIAVE_RECORD = 'all41.pecora.record'

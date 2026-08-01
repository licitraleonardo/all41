// Le Leggi di All For One.
//
// Tabella unica da cui si generano la logica, il tutorial e il codice
// delle Leggi scoperte. Tre sono pubbliche e partono già rivelate; il
// resto è nascosto e si scopre quando scatta.
//
// La scoperta è collettiva: quando una Legge scatta per la prima volta su
// chiunque, si sblocca per tutto il gruppo. Rende la cosa cooperativa e
// lascia la competizione dove deve stare, nella classifica.
//
// `attiva: false` = la Legge esiste nel codice ma niente la fa ancora
// scattare, perché dipende da una sezione non costruita. Nel Testamento
// resta oscurata come tutte le altre non scoperte, quindi non si nota —
// ma qui è bene sapere quali sono vive.

export const LEGGI = [
  // ——— PUBBLICHE (rivelate dall'inizio) ———
  { n: 1, id: 'poll-proposed', punti: '±10 (max ±15)', pubblica: true, attiva: false,
    testo: 'Punti proposti da qualcuno e approvati dal gruppo a maggioranza' },
  { n: 2, id: 'challenge-won', punti: '10/15/20', pubblica: true, attiva: false,
    testo: 'Hai vinto una sfida della caccia al tesoro' },
  { n: 3, id: 'impostore-impunito', punti: 5, pubblica: true, attiva: false,
    testo: "Sei sfuggito al voto: l'impostore l'ha fatta franca" },

  // ——— NASCOSTE: ritmo quotidiano ———
  { n: 4, id: 'first-photo-day', punti: 3, attiva: true,
    testo: 'Prima foto della giornata' },
  { n: 5, id: 'early-bird', punti: 1, attiva: false,
    testo: 'Primo del gruppo ad aprire l’app la mattina' },
  { n: 6, id: 'ghost-day', punti: -2, attiva: false,
    testo: 'Non hai aperto l’app per un giorno intero' },
  { n: 7, id: 'group-silence', punti: -1, bersaglio: 'tutti', attiva: false,
    testo: 'Nessuno ha caricato foto per un’intera giornata' },
  { n: 8, id: 'night-owl-sound', punti: -2, attiva: true,
    testo: 'Soundboard lanciato tra l’01:00 e le 07:00' },

  // ——— NASCOSTE: voti e democrazia ———
  { n: 9, id: 'last-to-vote', punti: -1, attiva: false,
    testo: 'Ultimo del gruppo a votare in un sondaggio' },
  { n: 10, id: 'lone-voter', punti: 1, attiva: false,
    testo: 'Unico ad aver votato in un sondaggio scaduto' },
  { n: 11, id: 'poll-tie', punti: -1, bersaglio: 'tutti', attiva: false,
    testo: 'Una proposta di punti è finita in pareggio' },
  { n: 12, id: 'unanimous', punti: 5, attiva: false,
    testo: 'Una tua proposta è passata con voto unanime' },
  { n: 13, id: 'proposal-rejected', punti: -2, attiva: false,
    testo: 'Una tua proposta è stata bocciata dal gruppo' },
  { n: 14, id: 'self-praise', punti: -3, attiva: false,
    testo: 'Hai proposto punti per te stesso' },
  { n: 15, id: 'wrong-side', punti: -1, attiva: false,
    testo: 'Hai votato l’opzione perdente tre volte di fila' },

  // ——— NASCOSTE: foto e vocali ———
  { n: 16, id: 'photo-spam', punti: -1, attiva: true,
    testo: 'Più di 30 foto caricate in un solo giorno' },
  { n: 17, id: 'triple-challenge', punti: 5, attiva: false,
    testo: 'Hai vinto tre sfide della caccia al tesoro' },
  { n: 18, id: 'the-mute', punti: -2, attiva: false,
    testo: 'Nessun vocale registrato in tutto il viaggio' },
  { n: 19, id: 'spam-insistente', punti: '-1 progressivo (max -5)', attiva: true,
    testo: 'Hai insistito su un bottone già bloccato dal limite' },

  // ——— NASCOSTE: pecora e classifica ———
  { n: 20, id: 'sheep-daily', punti: 3, attiva: false,
    testo: 'Detieni il record della pecora a fine giornata' },
  { n: 21, id: 'double-mvp', punti: 5, attiva: false,
    testo: 'Sei stato MVP di giornata due volte' },
  { n: 22, id: 'discoverer', punti: 1, attiva: true,
    testo: 'Hai fatto scattare una Legge mai vista prima' },
  { n: 23, id: 'riscatto', punti: 3, attiva: false,
    testo: 'Eri Maglia Nera e non lo sei più' },
  { n: 24, id: 'smascheratore', punti: 2, attiva: false,
    testo: 'Hai votato l’impostore giusto' },
  { n: 25, id: 'sheep-trip', punti: 5, attiva: false,
    testo: 'Record della Pecora al termine del viaggio' },

  // ——— AGGIUNTE DAL GRUPPO ———
  // Lo spec prevede che le Leggi si aggiungano strada facendo: il
  // denominatore cresce insieme al gruppo, ed è parte del gioco.
  { n: 26, id: 'parola-proibita', punti: -2, attiva: true,
    testo: 'Hai scritto una parola che il Testamento non tollera' },
]

export const PER_ID = Object.fromEntries(LEGGI.map((l) => [l.id, l]))

// Il tocco che trasforma una lista di regole in un codice.
export function numeroRomano(n) {
  const tavola = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ]
  let resto = n
  let romano = ''
  for (const [valore, segno] of tavola) {
    while (resto >= valore) {
      romano += segno
      resto -= valore
    }
  }
  return romano
}

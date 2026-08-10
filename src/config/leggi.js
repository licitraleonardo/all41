import { PROPOSTA } from './proposte.js'
import { CACCIA, SFIDE_PER_ID } from './sfide.js'

// Le Leggi di All For One.
//
// Tabella unica da cui si generano la logica, il tutorial e il codice
// delle Leggi scoperte.
//
// Non ce n'è nessuna nota dall'inizio: lo spec ne prevedeva tre
// pubbliche, spiegate nel tutorial, ma sapere in partenza cosa fa
// guadagnare punti trasforma il gioco in un elenco di compiti. Si
// scoprono tutte usando l'app, e il Testamento parte tutto oscurato.
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
  // I punti si prendono dalla configurazione e non si riscrivono a mano:
  // qui c'era ancora "±10 (max ±15)" della prima stesura, mentre il
  // limite vero era sceso a ±5 da un pezzo. Il Testamento è il posto
  // dove una bugia del genere resta scritta per tutto il viaggio.
  { n: 1, id: 'poll-proposed', punti: `±${PROPOSTA.limite}`, attiva: true, verso: 'trofeo',
    testo: 'Punti proposti da qualcuno e approvati dal gruppo a maggioranza' },
  // Non più una sfida qualsiasi: il premio è uno solo, a fine caccia. Con
  // dieci-venti punti a sfida la classifica diventava la classifica
  // della caccia al tesoro, e tutto il resto rumore di fondo.
  { n: 2, id: 'challenge-won', punti: CACCIA.premioPrimo, attiva: true,
    testo: 'Hai vinto più sfide della caccia al tesoro di chiunque altro' },
  { n: 3, id: 'impostore-impunito', punti: 5, attiva: true,
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
  { n: 11, id: 'poll-tie', punti: -1, bersaglio: 'tutti', attiva: true,
    testo: 'Una proposta di punti è finita in pareggio' },
  { n: 12, id: 'unanimous', punti: 5, attiva: true,
    testo: 'Una tua proposta è passata con voto unanime' },
  { n: 13, id: 'proposal-rejected', punti: -2, attiva: true,
    testo: 'Una tua proposta è stata bocciata dal gruppo' },
  // Una trappola vera: nessun avviso prima di premere, altrimenti non ci
  // casca nessuno. E la derisione è pubblica per costruzione — questo
  // testo finisce nello storico della classifica, che leggono tutti, e
  // ci resta per tutto il viaggio.
  { n: 14, id: 'self-praise', punti: 'quanti te ne sei dati', attiva: true, verso: 'legge',
    testo: 'Hai proposto punti per te stesso. Lo sanno tutti.' },
  { n: 15, id: 'wrong-side', punti: -1, attiva: false,
    testo: 'Hai votato l’opzione perdente tre volte di fila' },

  // ——— NASCOSTE: foto e vocali ———
  { n: 16, id: 'photo-spam', punti: -1, attiva: true,
    testo: 'Più di 30 foto caricate in un solo giorno' },
  { n: 17, id: 'triple-challenge', punti: 5, attiva: false,
    testo: 'Hai vinto tre sfide della caccia al tesoro' },
  { n: 18, id: 'the-mute', punti: -2, attiva: false,
    testo: 'Nessun vocale registrato in tutto il viaggio' },
  { n: 19, id: 'spam-insistente', punti: '-1 progressivo (max -5)', attiva: true, verso: 'legge',
    testo: 'Hai insistito su un bottone già bloccato dal limite' },

  // ——— NASCOSTE: pecora e classifica ———
  { n: 20, id: 'sheep-daily', punti: 3, attiva: true,
    testo: 'Detieni il record della pecora a fine giornata' },
  { n: 21, id: 'double-mvp', punti: 5, attiva: true,
    testo: 'Sei stato MVP di giornata due volte' },
  { n: 22, id: 'discoverer', punti: 1, attiva: true,
    testo: 'Hai fatto scattare una Legge mai vista prima' },
  { n: 23, id: 'riscatto', punti: 3, attiva: false,
    testo: 'Eri Maglia Nera e non lo sei più' },
  { n: 24, id: 'smascheratore', punti: 2, attiva: true,
    testo: 'Hai votato l’impostore giusto' },
  { n: 25, id: 'sheep-trip', punti: 5, attiva: true,
    testo: 'Record della Pecora al termine del viaggio' },

  // ——— AGGIUNTE DAL GRUPPO ———
  // Lo spec prevede che le Leggi si aggiungano strada facendo: il
  // denominatore cresce insieme al gruppo, ed è parte del gioco.
  { n: 26, id: 'parola-proibita', punti: -2, attiva: true,
    testo: 'Hai scritto una parola che il Testamento non tollera' },
  { n: 27, id: 'sound-abuse', punti: -3, attiva: true,
    testo: 'Hai svuotato la soundboard a raffica e te l’hanno tolta' },
  // La recidiva nella stessa giornata costa il doppio e dura dodici volte
  // tanto: la prima volta puo' essere entusiasmo, la seconda no.
  { n: 31, id: 'sound-abuse-ancora', punti: -6, attiva: true,
    testo: 'Hai rifatto la stessa raffica nello stesso giorno' },
  { n: 28, id: 'sfida-solitario', punti: CACCIA.puntiUnico, attiva: true,
    testo: 'Sei stato l’unico a mandare una foto per una sfida' },
  // La collettiva non è una gara e non può passare dalla Legge II, che
  // adesso premia chi ne ha vinte di più: ha la sua.
  { n: 29, id: 'gruppo-al-completo', punti: SFIDE_PER_ID['ci-siamo-tutti'].punti, attiva: true,
    testo: 'Il gruppo al completo, uno per uno' },
  // Si parte tutti sopra lo zero grazie al selfie di gruppo, quindi
  // andare sotto è una cosa che ti sei guadagnato.
  { n: 30, id: 'sotto-zero', punti: -1, attiva: true,
    testo: 'Sei sceso sotto lo zero' },

  // ——— IL SECONDO CODICE (8 agosto) ———
  // Il criterio è quello di idee-leggi-trofei.md: esca e trappola in
  // coppia, trappole raggiungibili per caso, malus che non fanno male
  // sul serio, mai punire l'uso normale. Le fasce sono ±1 per il ritmo
  // quotidiano, ±2/3 per il resto, ±5 solo per gli eventi rari.
  // Si aggiungono in coda apposta: l'etichetta romana è posizionale, e
  // una voce in mezzo rinumererebbe mezzo Testamento.

  // Ritmo quotidiano: piccoli, frequenti, uno al giorno a testa.
  { n: 32, id: 'primo-sveglio', punti: 1, attiva: true,
    testo: 'Primo messaggio della giornata in chat' },
  { n: 33, id: 'sveglia-il-gruppo', punti: -2, attiva: true,
    testo: 'Messaggio in chat fra le 3:00 e le 6:00. C’era davvero bisogno?' },
  { n: 34, id: 'insonne', punti: -2, attiva: true,
    testo: 'App aperta fra le 4:00 e le 6:00. Domani sarà colpa nostra.' },

  // Vocali: il corto e il lungo, tutti e due una volta sola a testa.
  { n: 35, id: 'telegrafico', punti: 1, attiva: true,
    testo: 'Un vocale sotto i due secondi. Tutto lì?' },
  { n: 36, id: 'il-podcast', punti: 2, attiva: true,
    testo: 'Un vocale da quasi un minuto. Ascoltato per dovere.' },

  // Foto: il primo scatto del viaggio e il rullino finito.
  { n: 37, id: 'prima-luce', punti: 3, attiva: true,
    testo: 'La prima foto del viaggio, in assoluto' },
  { n: 38, id: 'paparazzo', punti: 2, attiva: true,
    testo: 'Rullino del giorno finito: cinque su cinque' },

  // Proposte e voti: da quando i voti sono palesi, l'esito vede anche i
  // singoli — ed è qui che il gioco si fa cattivo.
  { n: 39, id: 'suspense', punti: 1, attiva: true,
    testo: 'Hai votato negli ultimi sessanta secondi' },
  { n: 40, id: 'in-difficolta', punti: 3, attiva: true,
    testo: 'La tua proposta ha spaccato il gruppo a metà' },
  { n: 41, id: 'contro-te-stesso', punti: -3, attiva: true,
    testo: 'Hai votato No alla tua stessa proposta' },
  // L'esca e la trappola dell'escalation: la seconda proposta alla
  // stessa persona premia, la terza presenta il conto. Il premio è
  // proprio quello che rende la terza irresistibile.
  { n: 42, id: 'vera-amicizia', punti: 2, attiva: true,
    testo: 'Due proposte per la stessa persona in un giorno. Questa è vera amicizia.' },
  { n: 43, id: 'ci-nascondete-qualcosa', punti: -3, attiva: true,
    testo: 'Tre proposte per la stessa persona in un giorno. Ci nascondete qualcosa?' },
  { n: 44, id: 'troppo-giudicante', punti: -3, attiva: true,
    testo: 'Un’altra proposta mentre la tua era ancora in voto. Troppo giudicante.' },
  { n: 45, id: 'bastian-contrario', punti: -3, attiva: true,
    testo: 'Quattro No di fila. Ti piace qualcosa?' },

  // La Guida chiude il cerchio col tutorial: aprirla è ammettere di non
  // aver ascoltato, e l'ammissione vale un punto.
  { n: 46, id: 'non-hai-ascoltato', punti: 1, attiva: true,
    testo: 'Hai aperto la Guida. Classico.' },

  // ——— LA DAMA ———
  // Il punteggio della Dama passa quasi tutto dal titolo di giornata,
  // non dalla singola vittoria: con le partite a raffica dopo cena,
  // pagare ogni vittoria vorrebbe dire che chi gioca di più vince il
  // viaggio. Così invece si vince la giornata, una volta al giorno.
  { n: 47, id: 'dama-campione', punti: 3, attiva: true,
    testo: 'Hai vinto più partite a dama di tutti, in una giornata' },
  { n: 48, id: 'dama-prima-vittoria', punti: 2, attiva: true,
    testo: 'La tua prima partita a dama vinta' },
  // ⚠️ Qui c'era la Legge «hai abbandonato una partita a dama», -2.
  //
  // Spenta il 9 agosto e **tolta il 10**, e la differenza conta. Spenta
  // voleva dire «un giorno forse»: restava nell'elenco, e chi passava di
  // qui poteva riaccenderla senza sapere perché fosse spenta. Adesso
  // uscire da una partita non registra più niente — non l'ha vinta
  // nessuno, non entra in classifica, non costa un punto a nessuno — e
  // una Legge che punisce quel gesto contraddirebbe la regola, non la
  // completerebbe.
  //
  // Il ragionamento di allora era che mollare lascia l'altro davanti a
  // una scacchiera ferma. Regge, ma sbaglia il verso: una partita dopo
  // cena si molla perché arriva da mangiare o perché si va a fare il
  // bagno, non per dispetto. All'altro adesso lo dice la partita stessa,
  // che scrive «è uscito, la partita non conta».
]

// Il Testamento si legge in due metà: quello che ti fa guadagnare
// qualcosa e quello che te lo toglie. La distinzione si dichiara qui e
// non si deduce dal segno, perché la Legge I può andare in tutte e due
// le direzioni e la XIX ha un punteggio che è una frase.
export function verso(legge) {
  if (legge.verso) return legge.verso
  return typeof legge.punti === 'number' && legge.punti > 0 ? 'trofeo' : 'legge'
}

export const TROFEI = LEGGI.filter((l) => verso(l) === 'trofeo')
export const PUNIZIONI = LEGGI.filter((l) => verso(l) === 'legge')

// Ogni metà si conta per conto suo: Trofeo I, II, III e Legge I, II,
// III. Il numero globale resta nel dato — serve all'identità — ma a
// schermo "Legge XXVIII" dentro la scheda dei Trofei non voleva dire
// niente a nessuno.
const ETICHETTE = new Map()
TROFEI.forEach((l, i) => ETICHETTE.set(l.id, `Trofeo ${numeroRomano(i + 1)}`))
PUNIZIONI.forEach((l, i) => ETICHETTE.set(l.id, `Legge ${numeroRomano(i + 1)}`))

export function etichetta(legge) {
  return ETICHETTE.get(legge.id) ?? `Legge ${numeroRomano(legge.n)}`
}

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

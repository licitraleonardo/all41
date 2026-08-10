import { LIMITI } from './limiti.js'

// La guida. Tutto testo, niente logica: sta qui perche' cambiera' molte
// volte e non deve costringere a rileggere un componente ogni volta.
//
// Non elenca le regole dei punti, e non e' una dimenticanza. Lo spec
// diceva di generarle dalle Leggi pubbliche, ma di Leggi pubbliche non ne
// e' rimasta nessuna: si e' deciso che si scoprono usando l'app, e un
// tutorial che le elenca smonterebbe proprio quella scelta. Quindi qui si
// spiega solo dove stanno le cose e quali gesti non si trovano da soli.

export const VOCI = [
  {
    icona: '📅',
    titolo: 'Oggi',
    testo:
      'Il programma della giornata, il meteo e quanto manca alla partenza. Ogni tappa ha il suo link a Maps: si tocca e si parte. E c’è il mondino: si tocca e si vede dove sono tutti.',
  },
  {
    icona: '💬',
    titolo: 'Gruppo',
    testo:
      'La chat per le cose brevi. I tasti sopra la tastiera fanno il lavoro sporco: SOS, "dove siete", "si riparte tra 10 minuti", un sondaggio al volo. E nel Cassetto ci sono le spese divise e i documenti del viaggio.',
    gesto: 'Nella scheda Vocali si tocca il microfono per parlare, e si tocca di nuovo per mandare.',
  },
  {
    icona: '📷',
    titolo: 'Foto',
    testo: `L'album del viaggio, ${LIMITI.photo.giorno} foto al giorno a testa. Ci sono anche delle sfide a tema: chi le fa se la gioca a fine vacanza.`,
    gesto: 'Tocca una foto per aprirla grande e scaricarla.',
  },
  {
    icona: '🏆',
    titolo: 'Gioco',
    testo:
      'La classifica, il Testamento delle Leggi scoperte, l’Impostore per il dopocena, la Dama per sfidarsi in due, un gioco della Pecora per le attese e le statistiche del viaggio.',
    gesto: 'Tocca qualcuno nella classifica per proporgli punti, in su o in giù. Poi vota il gruppo.',
  },
  {
    icona: 'ℹ️',
    titolo: 'Info',
    testo:
      'Dove si dorme, i numeri da chiamare se serve, i telefoni del gruppo — e in fondo questa guida e le impostazioni. Roba che serve in un momento preciso e poi si dimentica.',
  },
]

// La card finale, volutamente vaga. E' l'unica cosa che la guida dice sui
// punti, ed e' una promessa che l'app puo' mantenere davvero: il motivo
// ⚠️ Qui c'era «E poi ci sono le Leggi», tolto il 10 agosto.
//
// Diceva quante sono e che si scoprono facendole scattare, e il conto era
// guardato da una prova: la Guida aveva gia' detto «sono 49» quando le
// attive erano 39, promettendo dieci Leggi introvabili.
//
// ⚠️ Tolto quel blocco, delle Leggi la Guida non parla piu'. Restano il
// Testamento, dove si vedono quelle scoperte, e il motivo che compare
// nella Classifica ogni volta che una scatta. Se all'atto pratico durante
// il viaggio nessuno capisce da dove arrivano i punti, e' questa la riga
// da rimettere.

export const APERTURA = 'Cinque tab, qualche gesto che non si vede, e un mucchio di regole che non ti diciamo.'

// La nuvoletta di Allan. Una sola, e sta in Classifica.
//
// ⚠️ Erano quindici, una per ogni sezione, e si aprivano la prima volta
// che ci entravi. Sulla carta era un tutorial gentile: nella pratica sono
// quindici cartelli da chiudere nei primi cinque minuti, e chi ne chiude
// tre di fila impara a chiuderli senza leggerli — compresi quelli che
// dicevano qualcosa.
//
// Ne resta una, dove serve davvero: la Classifica e' l'unico posto
// dell'app dove si puo' fare una cosa che nessuno si aspetta — dare punti
// agli altri, anche a chi ti sta davanti. Quello va detto, perche' non lo
// indovina nessuno.
export const NUVOLETTE = {
  // ⚠️ Segue il nome della scheda, che dal 10 agosto e' «allbo».
  // Agganciata al nome vecchio non darebbe nessun errore: smetterebbe
  // solo di comparire, e nessuno se ne accorgerebbe. Se ne accorge
  // `prove/guida.mjs`, che confronta le nuvolette scritte qui con quelle
  // che i componenti chiedono davvero.
  'gioco.allbo': {
    testo:
      'Qui puoi guadagnare punti. In Classifica pero’ puoi anche assegnarli agli altri. Sì, aiutare qualcuno a superarti. Strano, no? Comunque prova tutti i giochi. Magari sei bravo in qualcosa.',
  },
}

import { LEGGI } from './leggi.js'
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
      'Il programma della giornata, il meteo e quanto manca alla partenza. Ogni tappa ha il suo link a Maps: si tocca e si parte.',
  },
  {
    icona: '💬',
    titolo: 'Gruppo',
    testo:
      'La chat per le cose brevi. I tasti sopra la tastiera fanno il lavoro sporco: SOS, "dove siete", "si riparte tra 10 minuti", un sondaggio al volo.',
    gesto: 'Nella scheda Vocali si tiene premuto il microfono e si parla, come un walkie-talkie.',
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
      'La classifica, il Testamento delle Leggi scoperte, l’Impostore per il dopocena, la Dama per sfidarsi in due e un gioco della Pecora per le attese.',
    gesto: 'Tocca qualcuno nella classifica per proporgli punti, in su o in giù. Poi vota il gruppo.',
  },
  {
    icona: '📎',
    titolo: 'Altro',
    testo:
      'Le spese divise, i documenti del viaggio, la mappa di dove siete tutti, i numeri utili e le statistiche. Roba che serve in un momento preciso e poi si dimentica.',
  },
]

// La card finale, volutamente vaga. E' l'unica cosa che la guida dice sui
// punti, ed e' una promessa che l'app puo' mantenere davvero: il motivo
// di ogni punto compare sempre nella Classifica quando scatta.
// ⚠️ `attiva`, non `LEGGI.length`.
//
// L'elenco ne contiene 49, ma dieci sono spente: aspettano sezioni che
// non ci sono ancora. La guida diceva «Sono 49» e prometteva quaranta
// punti che non possono scattare — in un gioco il cui unico meccanismo e'
// «si scoprono facendole scattare», dieci Leggi introvabili vogliono dire
// dieci persone che a fine viaggio contano il proprio Testamento e
// pensano di essersi persi qualcosa.
const QUANTE_LEGGI = LEGGI.filter((l) => l.attiva).length

export const FINALE = {
  titolo: 'E poi ci sono le Leggi',
  testo: `Sono ${QUANTE_LEGGI}. Danno e tolgono punti da sole, e nessuno ti dira' quali sono: si scoprono facendole scattare. Quando ne scatta una, il motivo compare nella Classifica — quindi si capisce sempre cos'e' successo, anche se non si sapeva prima.`,
}

export const APERTURA = 'Cinque tab, qualche gesto che non si vede, e un mucchio di regole che non ti diciamo.'

// Le nuvolette di Allan: una per tab, la prima volta che ci entri e mai
// piu'. Servono a dire "qui si puo' fare questo" nel momento in cui uno
// ci e' appena arrivato, che e' l'unico in cui gli interessa saperlo.
//
// Sono nella voce di Allan e non in quella di un tutorial: asciutta, un
// po' svogliata, mai entusiasta. Allan non fa il cicerone contento —
// custodisce il Testamento e lo sa. Se diventasse una mascotte allegra
// il personaggio si consumerebbe alla prima schermata.
// Ogni voce ha un id che dice dove si trova: `gruppo` è il tab,
// `gruppo.vocali` la sua sotto-scheda. Il segnalibro usa questo id,
// quindi ogni pezzo dell'app si spiega una volta sola nella vita.
//
// `posizione: 'alto'` per i due step che lo spec vuole "solo spostamento
// del fumetto": lì non si entra in una sezione nuova, si indica una
// scheda che sta in cima, e il fumetto va a stare vicino a lei.
export const NUVOLETTE = {
  oggi: {
    testo:
      'Qui c’è il programma del viaggio. Così almeno sapete dove dovreste essere... anche se arriverete in ritardo lo stesso.',
  },

  gruppo: {
    testo:
      'Questa è la chat. Parlate, litigate, prendetevi in giro. Cercate solo di non infrangere le Leggi...',
  },
  'gruppo.vocali': {
    posizione: 'alto',
    testo:
      'Se scrivere vi stanca, lasciate un vocale. Sarà comunque troppo lungo per essere ascoltato.',
  },

  foto: {
    testo: 'Qui finiscono le foto del viaggio.. Che c’è?? Non c’è nient’altro da dire',
  },
  'foto.sfide': {
    posizione: 'alto',
    testo: 'Dai un’occhiata alle sfide, ce ne sono di nuove ogni giorno, yuppy...',
  },

  'gioco.classifica': {
    testo:
      'Qui vedete chi sta vincendo il viaggio. Puoi proporre dei punti per ribaltare o confermare la situazione.',
  },
  'gioco.testamento': {
    testo:
      'Le Leggi decidono cosa vale punti e cosa vi farà pentire delle vostre azioni. I Trofei? Gloria eterna.',
  },
  'gioco.impostore': {
    testo: 'Uno mente. Gli altri provano a scoprirlo. Claudio non fare il babbo maligno',
  },
  // Non era nell'elenco dei quindici perché quando l'hai scritto la Dama
  // non c'era. Senza, sarebbe l'unica scheda muta di tutta l'app.
  'gioco.dama': {
    testo: 'Due persone, una scacchiera, e un’amicizia che regge fino alla terza partita.',
  },
  'gioco.pecora': {
    testo: 'Provo a evitare gli ostacoli, che bella metafora della vita',
  },

  altro: {
    testo: 'Le cose utili che nessuno cerca finché non servono davvero.',
  },

// Le sei sotto-voci di Altro. Lo spec le voleva in fila automatica
// all'ingresso, ed e' stato fatto: alla prova sono sei cartelli uno
// dietro l'altro appena entri, e si leggono come un muro. Adesso ognuna
// aspetta la sua sezione, come tutte le altre dieci.
//
// Il prezzo lo si sapeva ed e' quello: in Guida e Info nessuno entra per
// curiosita', quindi quei due messaggi molti non li vedranno mai. Meglio
// due non visti che sei saltati in blocco.
  'altro.spese': {
    testo:
      'Segnate chi ha pagato. Così a fine viaggio smettete di dire “non mi ricordo quanto ti devo”.',
  },

  // Mancava, ed era l'unica sezione muta di tutta l'app: stessa ragione
  // per cui e' stata aggiunta quella della Dama.
  'altro.documenti': {
    testo:
      'Biglietti, prenotazioni, il documento di chi guida. Metteteli qui adesso, non alle sei di mattina in aeroporto.',
  },

  'altro.mappa': {
    testo:
      'Per chi si perde anche seguendo il gruppo.',
  },

  'altro.stat': {
    testo:
      'Numeri, record e altre prove oggettive delle vostre pessime decisioni.',
  },

  'altro.guida': {
    testo:
      'Se siete arrivati qui significa che non avete ascoltato il tutorial. Classico.',
  },

  'altro.info': {
    testo:
      'Versione dell’app, crediti e altre cose che leggerete per circa quattro secondi.',
  },
}

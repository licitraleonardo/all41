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
      'Le spese divise, i documenti del viaggio e la mappa di dove siete tutti. Roba che serve in un momento preciso e poi si dimentica.',
  },
]

// La card finale, volutamente vaga. E' l'unica cosa che la guida dice sui
// punti, ed e' una promessa che l'app puo' mantenere davvero: il motivo
// di ogni punto compare sempre nella Classifica quando scatta.
export const FINALE = {
  titolo: 'E poi ci sono le Leggi',
  testo: `Sono ${LEGGI.length}. Danno e tolgono punti da sole, e nessuno ti dira' quali sono: si scoprono facendole scattare. Quando ne scatta una, il motivo compare nella Classifica — quindi si capisce sempre cos'e' successo, anche se non si sapeva prima.`,
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
export const NUVOLETTE = {
  oggi: 'Il programma dei cinque giorni. Non l’ho scritto io. Ogni tappa ha il suo indirizzo: si tocca e vi porta.',
  gruppo:
    'Qui si scrive. Se avete le mani occupate si parla: il tasto grande si tiene premuto e registra. Io ascolto tutto, per dovere.',
  foto: 'Caricate pure. Cinque al giorno a testa, poi basta. C’è chi ci prova a farne una più bella delle altre: si nota.',
  gioco:
    'La classifica. Toccate qualcuno per proporgli dei punti, in su o in giù, e poi decide il gruppo. Il Testamento sta lì sotto: dategli un’occhiata, ma non troppo lunga.',
  altro:
    'Spese, documenti, la mappa e la guida. Roba noiosa finché non serve, e poi serve tutta insieme.',
}

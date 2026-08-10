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
  'gioco.classifica': {
    testo:
      'Qui puoi guadagnare punti. In Classifica pero’ puoi anche assegnarli agli altri. Sì, aiutare qualcuno a superarti. Strano, no? Comunque prova tutti i giochi. Magari sei bravo in qualcosa.',
  },
}

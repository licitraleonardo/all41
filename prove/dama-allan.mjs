// Allan che gioca a dama.
//
// ⚠️ Queste prove non fanno MAI giocare Allan a tempo pieno.
//
// Con il tetto vero — 400 ms a mossa — venti partite simulate sono venti
// minuti, e una prova che dura venti minuti non la lancia più nessuno,
// quindi smette di proteggere. Qui si chiama `mosseValutate` a profondità
// bassa e fissa, che è la stessa ricerca senza l'orologio: si prova come
// sceglie, non quanto in fretta. Il quanto in fretta ha una prova sua,
// corta, in fondo.

import {
  BIANCO,
  NERO,
  applicaMossa,
  esito,
  mosseLegali,
  partitaNuova,
} from '../src/lib/dama.js'
import { mosseValutate, scegliMossa, valuta } from '../src/lib/allanDama.js'
import { ALLAN } from '../src/config/dama.js'
import { readFileSync } from 'node:fs'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio !== undefined) console.log('       ', JSON.stringify(dettaglio))
  }
}

// Generatore con seme: se una partita va storta si rilancia identica
// invece di sperare che ricapiti.
function conSeme(seme) {
  let s = seme
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

const allan = (stato, profondita = 2) => mosseValutate(stato, profondita)[0].mossa

// Una scacchiera scritta a mano: '.' vuoto, 'b'/'n' pedine, 'B'/'N' dame.
function scacchiera(disegno, turno) {
  const caselle = Array(64).fill(null)
  const pulito = disegno.replace(/\s/g, '')
  for (let i = 0; i < 64; i += 1) {
    const c = pulito[i]
    if (c === 'b') caselle[i] = { colore: BIANCO, dama: false }
    if (c === 'B') caselle[i] = { colore: BIANCO, dama: true }
    if (c === 'n') caselle[i] = { colore: NERO, dama: false }
    if (c === 'N') caselle[i] = { colore: NERO, dama: true }
  }
  return { caselle, turno, senzaPresa: 0 }
}

console.log('\ngioca solo mosse che esistono')
{
  // ⚠️ La riga più importante del file, e la meno interessante da
  // leggere. Il motore delle regole rifiuta una mossa illegale
  // sollevando: se Allan ne producesse una, la partita di chi ci sta
  // giocando esploderebbe a metà, e succederebbe solo in una posizione
  // su mille — cioè si scoprirebbe in vacanza e non qui.
  const casuale = conSeme(4242)
  let stato = partitaNuova()
  let mosse = 0
  let sempreLegale = true

  while (!esito(stato).finita && mosse < 120) {
    const legali = mosseLegali(stato)
    const scelta =
      stato.turno === BIANCO ? legali[Math.floor(casuale() * legali.length)] : allan(stato)

    const esiste = legali.some(
      (m) => m.da === scelta.da && m.passi.join(',') === scelta.passi.join(',')
    )
    if (!esiste) {
      sempreLegale = false
      break
    }
    stato = applicaMossa(stato, scelta)
    mosse += 1
  }

  prova('una partita intera senza una mossa inventata', sempreLegale)
  prova('e la partita e arrivata da qualche parte', mosse > 20, mosse)
}

console.log('\nmangia quando e obbligatorio, e prende la catena piu lunga')
{
  // ⚠️ Le caselle sono verificate, non disegnate a occhio: si gioca solo
  // sulle scure, quelle con (riga + colonna) dispari. La prima versione
  // di questa prova metteva un pezzo su una casella chiara e falliva —
  // e sembrava un difetto del motore.
  //
  // Bianco in 42 (riga 5, colonna 2). Due prede: 33 con un secondo salto
  // dietro (17), e 35 da sola. Mangiare e' obbligatorio, quindi la mossa
  // semplice non esiste nemmeno; fra le due catene Allan deve prendere
  // quella che porta via due pezzi.
  const stato = scacchiera(
    `
    . . . . . . . .
    . . . . . . . .
    . n . . . . . .
    . . . . . . . .
    . n . n . . . .
    . . b . . . . .
    . . . . . . . .
    . . . . . . . .
    `,
    BIANCO
  )

  const legali = mosseLegali(stato)
  prova('con una preda davanti non esistono mosse semplici', legali.every((m) => m.prese.length > 0), legali)

  const scelta = scegliMossa(stato, { casuale: () => 1 })
  prova('e Allan porta via due pezzi invece di uno', scelta.prese.length === 2, scelta)
}

console.log('\nnon si arrende quando sta perdendo')
{
  // ⚠️ Questa prova guarda il **codice** e non il comportamento, e la
  // ragione va scritta o fra sei mesi sembra pigrizia.
  //
  // La regola da tenere ferma è che la profondità entri nel punteggio del
  // finale: fra due vittorie Allan deve prendere la più vicina, fra due
  // sconfitte la più lontana. Senza, chi si vede perso gioca a caso — e
  // uno che smette di provarci a metà partita non è un avversario.
  //
  // Provarla dal comportamento vorrebbe dire una posizione in cui **tutte**
  // le mosse perdono e differiscono solo per quanto ci mettono. La prima
  // versione di questa prova ci provava, e non sapeva fallire: nella
  // posizione che avevo scelto i punteggi erano diversi per il materiale,
  // non per la distanza, quindi restava verde anche togliendo il termine.
  // L'ho scoperto rompendo il codice apposta.
  //
  // Una posizione buona in dama si costruisce con un solutore, non a
  // mano. Finché non c'è, meglio una prova che dice il vero su poco che
  // una che dice il falso su tanto.
  const sorgente = readFileSync('src/lib/allanDama.js', 'utf8')
  const finale = sorgente.slice(sorgente.indexOf('if (fine.finita)'))
  const riga = finale.slice(0, finale.indexOf('\n  }'))
  prova('il punteggio del finale porta dentro la profondita', /VINTA \+ profondita/.test(riga), riga)
  prova('e la sconfitta la porta col segno giusto', /-VINTA - profondita/.test(riga), riga)
}

console.log('\nsbaglia apposta, ma non quando conta')
{
  // La seconda mossa migliore ogni tanto: e' quello che lo rende
  // battibile. Qui si prova che il pezzo e' collegato davvero — con un
  // `casuale` che dice sempre «sbaglia» deve uscire una mossa diversa da
  // quella che esce quando dice sempre «non sbagliare».
  const aperta = partitaNuova()
  const meglio = scegliMossa(aperta, { casuale: () => 1 })
  const peggio = scegliMossa(aperta, { casuale: () => 0 })
  const uguali = meglio.da === peggio.da && meglio.passi.join() === peggio.passi.join()
  prova('con l errore acceso gioca un altra mossa', !uguali, { meglio, peggio })

  prova('e la manopola e accesa ma bassa', ALLAN.sbaglia > 0 && ALLAN.sbaglia < 0.35, ALLAN.sbaglia)

  // ⚠️ E la guardia sul finale ha senso solo se nessun vantaggio di
  // pezzi puo' arrivare al punteggio di una vittoria. Se ci arrivasse,
  // Allan scambierebbe una vittoria vera per un vantaggio materiale — e
  // smetterebbe di sbagliare proprio dove sbagliare non fa danno.
  const tuttoBianco = scacchiera(
    `
    . . . . . . . .
    . . . . . . . .
    . . . . . . . .
    . . . . . . . .
    . B . B . B . B
    B . B . B . B .
    . B . B . B . B
    B . B . B . B .
    `,
    BIANCO
  )
  prova(
    'e nessun vantaggio di pezzi vale quanto una vittoria',
    Math.abs(valuta(tuttoBianco, BIANCO)) < 100000,
    valuta(tuttoBianco, BIANCO)
  )
}

console.log('\nrisponde in fretta')
{
  // ⚠️ L'unica prova che guarda l'orologio, e guarda una mossa sola.
  //
  // La ricerca gira sul telefono di chi sta giocando: un avversario che
  // ci mette due secondi rende la partita noiosa molto prima di renderla
  // difficile. Il margine è largo perché una macchina occupata è più
  // lenta, e una prova che fallisce quando il computer è carico
  // insegnerebbe solo a ignorarla.
  const inizio = Date.now()
  scegliMossa(partitaNuova(), { casuale: () => 1 })
  const durata = Date.now() - inizio

  prova('una mossa sta dentro il tetto, con margine', durata < ALLAN.millisecondiMax * 3, {
    durata,
    tetto: ALLAN.millisecondiMax,
  })
  prova('e il tetto e piccolo abbastanza da non farsi notare', ALLAN.millisecondiMax <= 800)
}

console.log('\nbatte chi gioca a caso')
{
  // Non è una prova di forza: è la prova che la ricerca è collegata a
  // qualcosa. Un motore rotto — che valuta al contrario, o che ordina le
  // mosse a rovescio — perde contro il caso, e non lo direbbe nessun
  // altro controllo di questo file.
  const casuale = conSeme(20260812)
  let vinte = 0

  for (let n = 0; n < 6; n += 1) {
    let stato = partitaNuova()
    let mosse = 0
    while (!esito(stato).finita && mosse < 160) {
      if (stato.turno === BIANCO) {
        const legali = mosseLegali(stato)
        stato = applicaMossa(stato, legali[Math.floor(casuale() * legali.length)])
      } else {
        stato = applicaMossa(stato, allan(stato, 2))
      }
      mosse += 1
    }
    if (esito(stato).vincitore === NERO) vinte += 1
  }

  prova('vince quasi sempre contro il caso', vinte >= 5, `${vinte} su 6`)
}

console.log('\nla valutazione guarda le cose giuste')
{
  const solaPedina = scacchiera(
    `
    . . . . . . . .
    . . . . . . . .
    . . . . . . . .
    . . . . . . . .
    . . . . . . . .
    . . b . . . . .
    . . . . . . . .
    . . . . . . . .
    `,
    BIANCO
  )
  const conDama = scacchiera(
    `
    . . . . . . . .
    . . . . . . . .
    . . . . . . . .
    . . . . . . . .
    . . . . . . . .
    . . B . . . . .
    . . . . . . . .
    . . . . . . . .
    `,
    BIANCO
  )
  prova('una dama vale piu di una pedina', valuta(conDama, BIANCO) > valuta(solaPedina, BIANCO))

  // ⚠️ Ma meno di due: con le regole di casa (niente dame volanti, e la
  // pedina puo' mangiare la dama) una dama e' comoda, non e' una
  // vittoria. Se valesse di piu', Allan darebbe via due pedine per farne
  // una, che e' il modo piu' veloce di perdere.
  const duePedine = scacchiera(
    `
    . . . . . . . .
    . . . . . . . .
    . . . . . . . .
    . . . . . . . .
    . . . . . . . .
    . . b . b . . .
    . . . . . . . .
    . . . . . . . .
    `,
    BIANCO
  )
  prova('e meno di due pedine', valuta(conDama, BIANCO) < valuta(duePedine, BIANCO))
}

console.log('\ncontro Allan non si prendono punti')
{
  // ⚠️ La riga che tiene onesta la classifica della Dama, e la sola cosa
  // di questo file che riguarda il resto dell'app.
  //
  // La scacchiera e' la stessa di una partita vera, e una partita vera
  // assegna i punti quando la vede finire. Senza la guardia, battere una
  // macchina varrebbe quanto battere una persona: il Trofeo lo
  // prenderebbe chi ha piu' tempo libero, e non lo direbbe nessun errore
  // -- si vedrebbe solo una classifica che non torna con quello che vi
  // ricordate di aver giocato.
  const dama = readFileSync('src/components/Dama.jsx', 'utf8')

  // La partita contro Allan si costruisce a mano, in memoria: non passa
  // dalla funzione che ne crea una sul database.
  const locale = dama.slice(dama.indexOf('function partitaControAllan'), dama.indexOf('function partitaControAllan') + 400)
  prova('la partita contro Allan e locale', /id: ALLAN_ID/.test(locale), locale.slice(0, 200))
  prova('e non passa da sfida()', !/sfida\(/.test(locale))

  // E la guardia sui punti c'e', e viene PRIMA di tutto il resto:
  // qualunque cosa cambi sotto, questa resta davanti.
  prova('la guardia sui punti c e', dama.includes('if (allenamento) return'))
  const daGuardia = dama.slice(dama.indexOf('if (allenamento) return'))
  const distanza = daGuardia.indexOf('dopoUnaVittoria')
  prova('e viene prima di assegnare la vittoria', distanza > 0 && distanza < 900, distanza)
}

console.log('\nuna sfida vera scavalca la partita con Allan')
{
  // ⚠️ Il ramo `if (conAllan)` sta sopra tutto il resto, quindi
  // accettando una sfida dal banner non succedeva **niente**: lo stato
  // veniva impostato, il banner si spegneva, e sullo schermo restava la
  // scacchiera di Allan. Si ritoccava «Vediamo» e di nuovo niente.
  const dama = readFileSync('src/components/Dama.jsx', 'utf8')
  const effetto = dama.slice(dama.indexOf('if (!apriPartita) return'))
  const finoAlSet = effetto.slice(0, effetto.indexOf('onAperta?.()'))
  prova('accettare una sfida chiude la partita con Allan', /setConAllan\(null\)/.test(finoAlSet), finoAlSet.slice(0, 200))

  // ⚠️ E le due scacchiere hanno chiavi diverse: sono lo stesso
  // componente nella stessa posizione dell'albero, e senza chiave React
  // ne riusa l'istanza — uscendo da Allan per entrare in una partita
  // vera ci si portava dietro la casella selezionata e il «Abbandoni?
  // Vince l'altro» lasciato aperto, che sarebbe comparso su una partita
  // con una persona.
  prova('la scacchiera di Allan ha la sua chiave', /key="allan"/.test(dama))
  prova('e quella vera ha la sua', /key=\{aperta\.id\}/.test(dama))
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} cose non vanno.\n`)
process.exit(falliti === 0 ? 0 : 1)

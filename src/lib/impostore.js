import { COPPIE, IMPOSTORE, NESSUNA_PAROLA } from '../config/impostore.js'
import { PER_ID } from '../config/leggi.js'

// Il mazziere, senza database: tutto qui dentro e' puro e deterministico
// se gli si passa un generatore. Le partite si possono provare senza
// toccare Supabase, che e' l'unico modo di sapere se le parole finiscono
// davvero dove devono. Le scritture stanno in partiteImpostore.js.

// ------------------------------------------------------------ sorteggio

// Fisher-Yates. Non ordina per Math.random() - 0.5: quello sembra un
// mescolamento ma lascia le carte quasi dove stavano.
export function mescola(elenco, casuale = Math.random) {
  const carte = [...elenco]
  for (let i = carte.length - 1; i > 0; i--) {
    const j = Math.floor(casuale() * (i + 1))
    ;[carte[i], carte[j]] = [carte[j], carte[i]]
  }
  return carte
}

export function pescaCoppia(casuale = Math.random) {
  return COPPIE[Math.floor(casuale() * COPPIE.length)]
}

export function preparaPartita({
  giocatori,
  coppia = null,
  variante = 'parola-simile',
  quantiImpostori = null,
  casuale = Math.random,
}) {
  if (giocatori.length < IMPOSTORE.minimoGiocatori) {
    throw new Error(`Servono almeno ${IMPOSTORE.minimoGiocatori} giocatori.`)
  }

  const [parolaGruppo, parolaSimile] = coppia ?? pescaCoppia(casuale)
  const quanti = quantiImpostori ?? IMPOSTORE.quantiImpostori(giocatori.length)
  const impostori = mescola(giocatori, casuale).slice(0, quanti)

  const parolaImpostore = variante === 'senza-parola' ? NESSUNA_PAROLA : parolaSimile

  const assegnazioni = Object.fromEntries(
    giocatori.map((id) => [id, impostori.includes(id) ? parolaImpostore : parolaGruppo])
  )

  return {
    parolaGruppo,
    parolaImpostore,
    impostori,
    assegnazioni,
    // Il primo giro e' gia' mescolato: l'ordine in cui si e' seduti non
    // deve contare nemmeno all'inizio.
    ordine: mescola(giocatori, casuale),
  }
}

// ---------------------------------------------------------------- turni

// Chiunque puo' farlo avanzare, non solo chi e' di turno: se a qualcuno
// si scarica il telefono la partita non si blocca.
// Restituisce sempre uno stato completo, `giriTotali` compreso: se lo
// omettesse, incatenare due avanza() di fila perderebbe per strada
// quanti giri mancano e la partita non arriverebbe mai al voto.
export function avanza({ ordine, turno, giro, giriTotali, casuale = Math.random }) {
  if (turno + 1 < ordine.length) {
    return { ordine, turno: turno + 1, giro, giriTotali, stato: 'in-corso' }
  }

  if (giro >= giriTotali) {
    return { ordine, turno, giro, giriTotali, stato: 'voto' }
  }

  // Rimescolato a ogni giro: senza, chi parla per ultimo ha sentito tutti
  // gli altri e bara senza volerlo. E' il difetto principale del gioco
  // giocato a voce.
  return {
    ordine: mescola(ordine, casuale),
    turno: 0,
    giro: giro + 1,
    giriTotali,
    stato: 'in-corso',
  }
}

export function diTurno(partita) {
  return partita.ordine[partita.turno] ?? null
}

// Quanti "fatto" mancano alla fine dei giri: serve solo a scrivere
// "ultimo giro" invece di un numero che non dice niente.
export function quantiMancano({ ordine, turno, giro, giriTotali }) {
  return (giriTotali - giro) * ordine.length + (ordine.length - turno)
}

// ----------------------------------------------------------------- voto

// Il database salva le schede come { chiHaVotato: numeroDellOpzione },
// perche' i sondaggi normali hanno opzioni di testo. Qui le opzioni sono
// le persone, quindi il numero va riportato a chi e': senza questo passo
// i punti finirebbero a nessuno, e in silenzio.
// Una scheda puo' contenere piu' di un'accusa: con due impostori se ne
// indicano due, altrimenti si e' costretti a indovinarne uno e sperare.
// Dal database arriva un numero o un elenco di numeri, e qui esce sempre
// un elenco di persone.
export function schedePerId(schede, giocatori) {
  return Object.fromEntries(
    Object.entries(schede ?? {})
      .map(([chi, quali]) => [
        chi,
        (Array.isArray(quali) ? quali : [quali])
          .map((q) => giocatori[q])
          .filter(Boolean),
      ])
      .filter(([, accusati]) => accusati.length > 0)
  )
}

// `schede` e' { chiHaVotato: chiHaVotatoContro }, gia' passato da
// schedePerId: qui dentro sono id di persone, non numeri.
export function esito({ impostori, giocatori, schede }) {
  const conteggi = Object.fromEntries(giocatori.map((id) => [id, 0]))
  for (const accusati of Object.values(schede ?? {})) {
    // Ogni scheda puo' portare piu' accuse, e ognuna vale un voto.
    for (const accusato of Array.isArray(accusati) ? accusati : [accusati]) {
      if (accusato in conteggi) conteggi[accusato] += 1
    }
  }

  const massimo = Math.max(0, ...Object.values(conteggi))
  // Si accusano tanti quanti sono gli impostori, presi dai piu' votati.
  // A parita' sull'ultimo posto utile entrano tutti i pari: nessuno
  // spareggio inventato, e il gruppo se la vede da solo.
  const ordinati = [...giocatori]
    .filter((id) => conteggi[id] > 0)
    .sort((a, b) => conteggi[b] - conteggi[a] || (a < b ? -1 : 1))

  const soglia = ordinati.length
    ? conteggi[ordinati[Math.min(impostori.length, ordinati.length) - 1]]
    : 0
  const accusati = massimo === 0 ? [] : giocatori.filter((id) => conteggi[id] >= soglia && conteggi[id] > 0)

  const scoperti = impostori.filter((id) => accusati.includes(id))
  const impuniti = impostori.filter((id) => !accusati.includes(id))
  // Indovina chi ha indicato almeno un impostore vero.
  const indovini = Object.entries(schede ?? {})
    .filter(
      ([chi, accusati_]) =>
        !impostori.includes(chi) &&
        (Array.isArray(accusati_) ? accusati_ : [accusati_]).some((a) => impostori.includes(a))
    )
    .map(([chi]) => chi)

  return { conteggi, accusati, scoperti, impuniti, indovini }
}

// I punti non si scrivono qui: si prendono dalle Leggi, cosi' cambiare
// una Legge cambia il gioco e non restano due numeri da tenere allineati.
export function premi({ impostori, giocatori, schede, colpoRiuscito = false }) {
  const { impuniti, indovini, ...resto } = esito({ impostori, giocatori, schede })

  const impunito = PER_ID['impostore-impunito']
  const smascheratore = PER_ID['smascheratore']

  // Col colpo di coda riuscito la partita e' ribaltata: hanno vinto gli
  // impostori, tutti quanti, e chi li aveva beccati non prende niente.
  // Premiare chi ha indovinato in una partita che il gruppo ha perso
  // vorrebbe dire pagare due volte lo stesso finale, ai due lati opposti.
  if (colpoRiuscito) {
    return {
      ...resto,
      impuniti,
      indovini,
      colpoRiuscito: true,
      assegnazioni: impostori.map((id) => ({
        membroId: id,
        punti: impunito.punti,
        leggeId: impunito.id,
      })),
    }
  }

  return {
    ...resto,
    impuniti,
    indovini,
    colpoRiuscito: false,
    assegnazioni: [
      ...impuniti.map((id) => ({
        membroId: id,
        punti: impunito.punti,
        leggeId: impunito.id,
      })),
      ...indovini.map((id) => ({
        membroId: id,
        punti: smascheratore.punti,
        leggeId: smascheratore.id,
      })),
    ],
  }
}

// ------------------------------------------------------ la rivelazione

// Quando tutti hanno votato non serve chiedere niente: si rivela e basta.
export function tuttiHannoVotato(partita, hannoVotato = []) {
  return partita.giocatori.length > 0 && hannoVotato.length >= partita.giocatori.length
}

// Piu' della meta'. Non la meta': un gruppo spaccato a meta' non ha
// deciso niente. Vale per tutte le decisioni collettive del gioco —
// rivelare in anticipo e far partire la partita — perche' due soglie
// diverse per due votazioni della stessa sera sarebbero solo confusione.
export function maggioranza(quanti) {
  return Math.floor(quanti / 2) + 1
}

// Se manca qualcuno, rivelare e' una scelta del gruppo e non di chi tocca
// il tasto per primo: un tocco per sbaglio brucerebbe la partita a tutti
// gli altri.
export function quantiPerRivelare(quantiGiocatori) {
  return maggioranza(quantiGiocatori)
}

export function bastaPerRivelare(partita, chiesta = []) {
  return chiesta.length >= quantiPerRivelare(partita.giocatori.length)
}

// -------------------------------------------------- il colpo di coda

// L'impostore beccato ha un'ultima carta: se indovina la parola del
// gruppo, vince lo stesso. Quindi il confronto deve essere generoso —
// chi ha in testa la parola giusta non deve perdere per un accento o per
// una maiuscola, che sarebbe perdere per colpa della tastiera.
export function normalizzaParola(testo) {
  return String(testo ?? '')
    .trim()
    .toLowerCase()
    // Toglie gli accenti scomponendo le lettere e buttando i segni.
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Apostrofi tipografici e dritti sono la stessa cosa per chi scrive.
    .replace(/[\u2018\u2019\u02bc]/g, "'")
    // Spazi doppi da copia-incolla o da pollice incerto.
    .replace(/\s+/g, ' ')
}

export function stessaParola(a, b) {
  const x = normalizzaParola(a)
  return x.length > 0 && x === normalizzaParola(b)
}

// Chi puo' tentare il colpo: gli impostori che sono stati scoperti. Chi
// l'ha fatta franca ha gia' vinto e non ha niente da tentare.
export function chiPuoTentare({ impostori, giocatori, schede }) {
  return esito({ impostori, giocatori, schede }).scoperti
}

// Quale opzione ha vinto il voto d'apertura. A parita' vince quella
// consigliata, e se non e' in ballo la prima: serve una regola qualunque
// purche' sia sempre la stessa, o due telefoni che chiudono il voto nello
// stesso istante farebbero partire due partite diverse.
export function sceltaVincente(conteggi, scelte, consigliata) {
  const voti = scelte.map((_, i) => conteggi?.[i] ?? 0)
  const massimo = Math.max(...voti)
  if (massimo === 0) return consigliata ?? scelte[0]

  const inTesta = scelte.filter((_, i) => voti[i] === massimo)
  return inTesta.includes(consigliata) ? consigliata : inTesta[0]
}

// Il voto d'apertura si chiude quando ha votato piu' della meta', non
// quando hanno votato tutti: aspettare l'ultimo vuol dire restare fermi
// per chi e' in bagno, e l'ultimo non arriva mai.
export function bastaPerCominciare(quantiHannoVotato, quantiGiocatori) {
  return quantiGiocatori > 0 && quantiHannoVotato >= maggioranza(quantiGiocatori)
}

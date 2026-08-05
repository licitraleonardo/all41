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
export function schedePerId(schede, giocatori) {
  return Object.fromEntries(
    Object.entries(schede ?? {})
      .map(([chi, quale]) => [chi, giocatori[quale]])
      .filter(([, accusato]) => accusato)
  )
}

// `schede` e' { chiHaVotato: chiHaVotatoContro }, gia' passato da
// schedePerId: qui dentro sono id di persone, non numeri.
export function esito({ impostori, giocatori, schede }) {
  const conteggi = Object.fromEntries(giocatori.map((id) => [id, 0]))
  for (const accusato of Object.values(schede)) {
    if (accusato in conteggi) conteggi[accusato] += 1
  }

  const massimo = Math.max(0, ...Object.values(conteggi))
  // A parita' di voti sono accusati tutti: nessuno spareggio inventato,
  // e il gruppo se la vede da solo.
  const accusati = massimo === 0 ? [] : giocatori.filter((id) => conteggi[id] === massimo)

  const scoperti = impostori.filter((id) => accusati.includes(id))
  const impuniti = impostori.filter((id) => !accusati.includes(id))
  const indovini = Object.entries(schede)
    .filter(([chi, accusato]) => impostori.includes(accusato) && !impostori.includes(chi))
    .map(([chi]) => chi)

  return { conteggi, accusati, scoperti, impuniti, indovini }
}

// I punti non si scrivono qui: si prendono dalle Leggi, cosi' cambiare
// una Legge cambia il gioco e non restano due numeri da tenere allineati.
export function premi({ impostori, giocatori, schede }) {
  const { impuniti, indovini, ...resto } = esito({ impostori, giocatori, schede })

  const impunito = PER_ID['impostore-impunito']
  const smascheratore = PER_ID['smascheratore']

  return {
    ...resto,
    impuniti,
    indovini,
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

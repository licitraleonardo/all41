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
// Finito il giro si vota, sempre. Quanti giri fare non lo decide piu' un
// numero scelto a partita non ancora cominciata: lo decide il gruppo nel
// voto, dove "un altro giro" e' una delle risposte.
export function avanza({ ordine, turno, giro, giriTotali, casuale = Math.random }) {
  if (turno + 1 < ordine.length) {
    return { ordine, turno: turno + 1, giro, giriTotali, stato: 'in-corso' }
  }
  return { ordine, turno, giro, giriTotali, stato: 'voto' }
}

// Un altro giro invece di accusare. Sta fra le opzioni del voto e non in
// un bottone a parte perche' e' la stessa decisione: o ne sappiamo
// abbastanza per accusare, o non ne sappiamo abbastanza — e nel secondo
// caso si ascolta ancora.
export const ALTRO_GIRO = 'altro-giro'

// Le opzioni del voto d'accusa: chi e' ancora in gioco, piu' "un altro
// giro". Chi e' uscito non c'e': dal secondo giro in poi accusare un
// fantasma non ha senso.
export function opzioniDelVoto(partita) {
  return [...vivi(partita), ALTRO_GIRO]
}

// Quanti hanno chiesto un altro giro. `schede` e' gia' passato da
// schedePerId, quindi qui dentro ci sono id di persone e la costante.
export function quantiVoglionoUnAltroGiro(schede) {
  return Object.values(schede ?? {}).filter((accusati) =>
    (Array.isArray(accusati) ? accusati : [accusati]).includes(ALTRO_GIRO)
  ).length
}

// Il giro riparte se "un altro giro" ha preso piu' voti di chiunque
// altro. A parita' si accusa: restare fermi e' la scelta che allunga, e
// in caso di dubbio il gioco deve andare avanti.
export function siRiparte(partita, schede) {
  const voglionoAncora = quantiVoglionoUnAltroGiro(schede)
  if (voglionoAncora === 0) return false

  const conteggi = Object.fromEntries(vivi(partita).map((id) => [id, 0]))
  for (const accusati of Object.values(schede ?? {})) {
    for (const a of Array.isArray(accusati) ? accusati : [accusati]) {
      if (a in conteggi) conteggi[a] += 1
    }
  }
  return voglionoAncora > Math.max(0, ...Object.values(conteggi))
}

export function diTurno(partita) {
  return partita.ordine[partita.turno] ?? null
}

// Il testimone: per i primi trenta secondi il turno lo passa solo chi
// sta parlando, poi lo puo' passare chiunque.
//
// ⚠️ Non e' il countdown che lo spec vieta. Un countdown mette fretta a
// chi parla; questo protegge chi parla da chi ha il dito veloce — e alla
// scadenza non succede niente, si sblocca soltanto il tasto per gli
// altri. Il turno non si perde mai e nessuno viene saltato.
//
// La regola vecchia resta intera: chiunque puo' far avanzare, se a
// qualcuno si scarica il telefono la partita non si blocca. Cambia solo
// che deve aspettare mezzo minuto prima di poterlo fare.
export function secondiDelTestimone(partita, adesso = Date.now()) {
  if (!partita?.turnoDa) return 0
  const passati = (adesso - Date.parse(partita.turnoDa)) / 1000
  if (!Number.isFinite(passati)) return 0
  return Math.max(0, Math.ceil(IMPOSTORE.secondiDelTestimone - passati))
}

export function puoAvanzare(partita, membroId, adesso = Date.now()) {
  // Chi parla passa quando vuole, anche subito: il testimone e' suo.
  if (diTurno(partita) === membroId) return true
  // Chi guarda aspetta che il testimone scada.
  return secondiDelTestimone(partita, adesso) === 0
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

// Come è finita, in una risposta sola.
//
// ⚠️ Esiste perché non esisteva: il finale se lo calcolavano per conto
// loro la schermata della rivelazione, l'elenco delle partite vecchie e
// chi assegna i punti. Due su tre non sapevano del colpo di coda, e
// quindi lo storico diceva "Beccato" su una partita ribaltata, e la
// rivelazione annunciava "+2 a chi ha indovinato" mentre i punti — quelli
// veri, scritti da premi() — andavano tutti all'impostore.
//
// Non era un difetto di calcolo: era la stessa domanda fatta a tre
// persone diverse, e due non avevano l'ultima notizia.
export function raccontaFinale({
  impostori,
  giocatori,
  schede,
  tentativo = null,
  parolaGruppo = null,
  fuori = [],
}) {
  const r = esito({ impostori, giocatori, schede })
  const colpoRiuscito = Boolean(tentativo) && stessaParola(tentativo, parolaGruppo)

  // "Vi hanno fatti fuori" e "l'ha fatta franca" non sono la stessa cosa,
  // e la differenza e' quanti ne restano: nel primo caso il gruppo ha
  // eliminato tanti innocenti da mettere gli impostori in maggioranza, e
  // da li' in poi il voto lo decidevano loro. Nel secondo l'impostore e'
  // semplicemente passato inosservato al voto.
  const perNumeri =
    !colpoRiuscito && impostoriInMaggioranza({ impostori, giocatori, fuori })

  return {
    colpoRiuscito,
    perNumeri,
    // Chi ha vinto davvero. Col colpo riuscito vincono gli impostori
    // anche se erano stati scoperti tutti: è il senso del ribaltamento.
    vincitore: colpoRiuscito || perNumeri || r.impuniti.length > 0 ? 'impostori' : 'gruppo',
    scoperti: r.scoperti,
    // Chi ha indovinato e viene PAGATO. Col colpo riuscito la lista è
    // vuota: hanno indovinato, ma la partita l'hanno persa lo stesso, e
    // annunciare punti che nessuno riceve è peggio che tacere.
    premiati: colpoRiuscito ? [] : r.indovini,
    // Chi aveva indovinato, a prescindere dai punti: serve a raccontare
    // il colpo di coda a chi c'era andato vicino.
    indovini: r.indovini,
    // Come si chiama questo finale, detto in due parole.
    titolo: colpoRiuscito
      ? 'Ribaltata all’ultimo'
      : perNumeri
        ? 'Vi hanno fatti fuori'
        : r.impuniti.length > 0
          ? 'L’ha fatta franca'
          : 'Beccato',
  }
}

// ------------------------------------------------------ la rivelazione

// Quando tutti hanno votato non serve chiedere niente: si rivela e basta.
//
// "Tutti" sono i vivi, non i giocatori di partenza. Con l'elenco intero,
// dopo la prima eliminazione il conto non tornava mai piu': i sette
// superstiti votavano tutti e la schermata continuava a dire "manca
// ancora qualcuno", aspettando il voto di chi era gia' uscito.
export function tuttiHannoVotato(partita, hannoVotato = []) {
  const inGioco = vivi(partita)
  return inGioco.length > 0 && inGioco.every((id) => hannoVotato.includes(id))
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

// Anche qui la soglia e' sui vivi: l'interfaccia scrive "devono
// chiederlo in 4" contando i superstiti, e se la soglia vera restasse
// sugli otto di partenza il contatore arriverebbe a 4 su 4 senza che
// succeda niente. Tutti a pigiare un bottone che non fa nulla.
export function bastaPerRivelare(partita, chiesta = []) {
  const inGioco = vivi(partita)
  const validi = chiesta.filter((id) => inGioco.includes(id))
  return validi.length >= quantiPerRivelare(inGioco.length)
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
    // Gli apostrofi si buttano via del tutto, non si uniformano. Prima si
    // normalizzavano al dritto, e bastava che la parola sul mazzo fosse
    // scritta "Caffe'" invece di "Caff\u00e8" perch\u00e9 la risposta giusta \u2014
    // "caff\u00e8", che perde l'accento due righe sopra e diventa "caffe" \u2014
    // non combaciasse pi\u00f9. Il colpo di coda veniva rifiutato a chi aveva
    // indovinato, senza nessun errore visibile.
    .replace(/['\u2018\u2019\u02bc]/g, '')
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
// Il conteggio è arrivato, o siamo indietro?
//
// ⚠️ Serve perché la partita parte da sola sul primo telefono che vede
// la maggioranza, e quel telefono può avere l'elenco di chi ha votato
// già aggiornato e i numeri ancora fermi. In quel buco sceltaVincente
// non trova nessun massimo e ripiega sul valore consigliato: il gruppo
// vota due impostori, ne parte uno, e nessuno capisce perché.
//
// È successo davvero, con sei persone che votavano nello stesso secondo.
export function conteggioAffidabile(conteggi, quantiHannoVotato) {
  const contati = (conteggi ?? []).reduce((somma, n) => somma + (n ?? 0), 0)
  return contati > 0 && contati >= quantiHannoVotato
}

// Quale apertura ha vinto: impostori e giri insieme. A parita' vince
// quella consigliata, e se non e' in ballo la prima — serve una regola
// qualunque purche' sia sempre la stessa, o due telefoni che chiudono il
// voto nello stesso istante farebbero partire due partite diverse.
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

// -------------------------------------------------------- l'eliminazione

// Chi accusi e sbagli esce dal gioco, e si continua. E' quello che rende
// il voto una decisione invece di un sondaggio finale: sbagliare costa,
// e costa a tutto il gruppo.

export function vivi(partita) {
  const fuori = partita.fuori ?? []
  return partita.giocatori.filter((id) => !fuori.includes(id))
}

export function impostoriVivi(partita) {
  const fuori = partita.fuori ?? []
  return partita.impostori.filter((id) => !fuori.includes(id))
}

export function innocentiVivi(partita) {
  const fuori = partita.fuori ?? []
  return partita.giocatori.filter(
    (id) => !fuori.includes(id) && !partita.impostori.includes(id)
  )
}

export function eFuori(partita, id) {
  return (partita.fuori ?? []).includes(id)
}

// Gli impostori vincono per numeri quando smettono di essere in
// minoranza: da li' in poi qualunque voto lo decidono loro, e continuare
// sarebbe allungare una partita gia' decisa.
export function impostoriInMaggioranza(partita) {
  const imp = impostoriVivi(partita).length
  return imp > 0 && innocentiVivi(partita).length <= imp
}

// Cosa succede dopo un'accusa. E' il cuore della regola nuova, e sta qui
// dentro tutto insieme apposta: chi esce, chi e' stato beccato, se la
// partita finisce o riparte.
//
// `schede` sono gia' passate da schedePerId, e `opzioni` e' l'elenco di
// chi era votabile in quel giro — che dal secondo in poi non e' piu'
// tutto il gruppo.
export function dopoAccusa(partita, schede, casuale = Math.random) {
  // Il gruppo ha chiesto di sentire ancora: nessuno esce, si rimescola e
  // si ricomincia a parlare.
  if (siRiparte(partita, schede)) {
    return {
      fuori: partita.fuori ?? [],
      scopertiOra: [],
      eliminatiOra: [],
      vincitore: null,
      stato: 'in-corso',
      ordine: mescola(vivi(partita), casuale),
      turno: 0,
      giro: (partita.giro ?? 1) + 1,
      giriTotali: (partita.giro ?? 1) + 1,
      unAltroGiro: true,
    }
  }

  const inGioco = vivi(partita)
  const impostoriOra = impostoriVivi(partita)
  const r = esito({ impostori: impostoriOra, giocatori: inGioco, schede })

  const scopertiOra = r.accusati.filter((id) => impostoriOra.includes(id))
  const eliminatiOra = r.accusati.filter((id) => !impostoriOra.includes(id))
  const fuori = [...(partita.fuori ?? []), ...r.accusati]

  const dopo = { ...partita, fuori }
  const restano = impostoriVivi(dopo)

  // Beccati tutti: al gruppo resta da temere solo il colpo di coda.
  if (restano.length === 0) {
    return {
      fuori,
      scopertiOra,
      eliminatiOra,
      vincitore: 'gruppo',
      stato: scopertiOra.length > 0 ? 'colpo' : 'finita',
    }
  }

  // Non sono piu' in minoranza: hanno vinto, e non serve un altro giro
  // per scoprirlo.
  if (impostoriInMaggioranza(dopo)) {
    return { fuori, scopertiOra, eliminatiOra, vincitore: 'impostori', stato: 'finita' }
  }

  // Si continua, coi superstiti e con l'ordine rimescolato.
  return {
    fuori,
    scopertiOra,
    eliminatiOra,
    vincitore: null,
    stato: 'in-corso',
    ordine: mescola(vivi(dopo), casuale),
    turno: 0,
    giro: (partita.giro ?? 1) + 1,
    giriTotali: (partita.giro ?? 1) + 1,
  }
}

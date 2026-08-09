import { supabase } from './supabase.js'
import { VIAGGIO } from '../config/viaggio.js'
import { IMPOSTORE } from '../config/impostore.js'
import {
  avanza,
  dopoAccusa,
  opzioniDelVoto,
  premi,
  preparaPartita,
  schedePerId,
  stessaParola,
  vivi,
} from './impostore.js'
import { votiPerPartita } from './giriImpostore.js'
import { faiScattareLegge } from './punti.js'

// Tetti delle due letture dello storico (verifica bloccante n.4). Venti
// partite fanno una sessantina di voti: centocinquanta sono larghi, e
// sessanta confini coprono anche le partite annullate in mezzo.
const VOTI_DA_LEGGERE = 150
const CONFINI_DA_LEGGERE = 60

// Le partite dell'Impostore sul database. Il mazziere vero — chi e'
// impostore, che parola gli tocca, chi parla adesso — sta in
// impostore.js, che non sa cosa sia Supabase e si puo' provare.

const CAMPI =
  'id, parola_gruppo, parola_impostore, impostori, giocatori, assegnazioni, ordine, turno, giro, giri_totali, vote_id, stato, rivela_chiesta, setup_vote_id, fuori, tentativo, tentato_da, turno_da, created_at'

export function daRiga(riga) {
  if (!riga) return null
  return {
    id: riga.id,
    parolaGruppo: riga.parola_gruppo,
    parolaImpostore: riga.parola_impostore,
    impostori: riga.impostori ?? [],
    giocatori: riga.giocatori ?? [],
    assegnazioni: riga.assegnazioni ?? {},
    ordine: riga.ordine ?? [],
    turno: riga.turno,
    giro: riga.giro,
    giriTotali: riga.giri_totali,
    votoId: riga.vote_id,
    rivelaChiesta: riga.rivela_chiesta ?? [],
    fuori: riga.fuori ?? [],
    votoAperturaId: riga.setup_vote_id ?? null,
    tentativo: riga.tentativo ?? null,
    tentatoDa: riga.tentato_da ?? null,
    stato: riga.stato,
    // Quando e' cominciato il turno in corso: da qui il testimone.
    // Le partite aperte prima della colonna non ce l'hanno, e in quel
    // caso il testimone non blocca nessuno.
    turnoDa: riga.turno_da ?? null,
    creataIl: riga.created_at,
  }
}

// Una partita per volta: quella aperta piu' recente. Verifica bloccante
// n.4, il limit c'e' anche qui.
export async function leggiPartita() {
  const { data, error } = await supabase
    .from('impostore_games')
    .select(CAMPI)
    .eq('trip_id', VIAGGIO.id)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw error
  return daRiga(data[0])
}

// Le partite finite, dalla piu' recente. Con le schede del voto, che
// servono a dire chi aveva indovinato: senza, lo storico direbbe solo
// chi era l'impostore, che e' meta' della storia.
export async function leggiStorico(quante = 20) {
  const { data, error } = await supabase
    .from('impostore_games')
    .select(CAMPI)
    .eq('trip_id', VIAGGIO.id)
    .eq('stato', 'finita')
    .order('created_at', { ascending: false })
    .limit(quante)

  if (error) throw error
  const partite = data.map(daRiga)
  if (partite.length === 0) return []

  const daQuando = partite[partite.length - 1].creataIl

  // Tutte le partite da lì in poi, non solo le finite: servono i CONFINI.
  // Con le sole finite, i voti di una abbandonata a metà finirebbero nel
  // conto della finita che la precede — e lì dentro ci sono accuse vere,
  // con id di persone vere, che diventerebbero indovini di una partita che
  // non hanno giocato.
  const { data: tutte, error: erroreTutte } = await supabase
    .from('impostore_games')
    .select('id, created_at')
    .eq('trip_id', VIAGGIO.id)
    .gte('created_at', daQuando)
    .order('created_at', { ascending: false })
    .limit(CONFINI_DA_LEGGERE)

  if (erroreTutte) throw erroreTutte

  // ⚠️ Anche `options`, non solo `ballots`. Le schede sono numeri di
  // posizione dentro le opzioni DI QUEL voto, e dal secondo giro d'accusa
  // in poi le opzioni sono solo i superstiti piu' "un altro giro":
  // tradurle con l'elenco intero dei giocatori sposta ogni numero di un
  // posto e lo storico racconta la partita di qualcun altro.
  //
  // E' la terza volta che questo progetto inciampa sulle posizioni.
  //
  // Dalla piu' recente e non dalla piu' vecchia: se il tetto taglia, a
  // restare senza giri sono le partite in fondo all'elenco, quelle che
  // nessuno riapre. E chi resta senza non racconta una bugia — `giriTuttiNoti`
  // se ne accorge e il finale dice che non lo sa.
  const { data: righe, error: erroreVoti } = await supabase
    .from('votes')
    .select('id, ballots, options, created_at')
    .eq('trip_id', VIAGGIO.id)
    .eq('category', 'impostore')
    .gte('created_at', daQuando)
    .order('created_at', { ascending: false })
    .limit(VOTI_DA_LEGGERE)

  if (erroreVoti) throw erroreVoti

  const perId = Object.fromEntries((righe ?? []).map((r) => [r.id, r]))

  // I voti d'apertura fuori da tutti i conti: le loro opzioni sono numeri
  // ("1", "2") e non persone.
  const aperture = new Set(partite.map((p) => p.votoAperturaId).filter(Boolean))
  const raggruppati = votiPerPartita(
    (tutte ?? []).map((r) => ({ id: r.id, creataIl: r.created_at })),
    (righe ?? []).filter((v) => !aperture.has(v.id))
  )

  return partite.map((p) => ({
    ...p,
    schede: perId[p.votoId]?.ballots ?? {},
    opzioniVoto: perId[p.votoId]?.options ?? [],
    // Tutti i giri d'accusa di questa partita, cosi' lo storico racconta
    // la stessa cosa che ha raccontato la rivelazione e che ha pagato
    // `paga`. Prima ne conosceva uno solo, e su una partita finita in piu'
    // giri diceva "Nessuno ha indovinato" mentre in classifica il +2 c'era.
    schedeDeiGiri: (raggruppati[p.id] ?? []).map((v) => schedePerId(v.ballots, v.options)),
  }))
}

// La partita nasce in preparazione: le parole si pescano subito — non
// dicono niente a nessuno finche' non si distribuiscono — ma chi e'
// impostore lo si sa solo dopo che il gruppo ha votato quanti ne vuole.
export async function creaPartita({ giocatori, variante = 'parola-simile', casuale }) {
  const preparata = preparaPartita({ giocatori, variante, casuale })
  const scade = new Date(Date.now() + IMPOSTORE.minutiVoto * 60000).toISOString()

  const { data: voto, error: erroreVoto } = await supabase
    .from('votes')
    .insert({
      trip_id: VIAGGIO.id,
      category: 'impostore',
      question: 'Quanti impostori?',
      // Le scelte dipendono da quanti sono: in quattro, due impostori
      // vorrebbe dire far partire una partita gia' vinta da loro.
      options: IMPOSTORE.sceltePerImpostori(giocatori.length).map(String),
      anonymous: false,
      tally: IMPOSTORE.sceltePerImpostori(giocatori.length).map(() => 0),
      expires_at: scade,
    })
    .select('id')
    .single()

  if (erroreVoto) throw erroreVoto

  const { data, error } = await supabase
    .from('impostore_games')
    .insert({
      trip_id: VIAGGIO.id,
      parola_gruppo: preparata.parolaGruppo,
      parola_impostore: preparata.parolaImpostore,
      // Ancora nessuno: si decide col voto.
      impostori: [],
      giocatori,
      assegnazioni: {},
      ordine: preparata.ordine,
      giri_totali: IMPOSTORE.giriTotali,
      stato: 'preparazione',
      setup_vote_id: voto.id,
    })
    .select(CAMPI)
    .single()

  if (error) throw error
  return daRiga(data)
}

// Finito il voto d'apertura si sorteggia chi e' impostore e si parte.
// Passa da una funzione: due telefoni che assegnano insieme darebbero
// due partite diverse alla stessa gente.
export async function avviaPartita(partita, quantiImpostori, casuale) {
  // Regge anche la forma { impostori } della versione che votava pure i
  // giri: una partita aperta con quella non deve esplodere a meta'
  // serata.
  const quanti =
    typeof quantiImpostori === 'number' ? quantiImpostori : quantiImpostori?.impostori
  // I giri non si votano piu' all'inizio: si parte da uno e il gruppo
  // decide a ogni fine giro se ne serve un altro.
  const giri = 1

  const preparata = preparaPartita({
    giocatori: partita.giocatori,
    coppia: [partita.parolaGruppo, partita.parolaImpostore],
    quantiImpostori: quanti,
    casuale,
  })

  const { data, error } = await supabase.rpc('avvia_impostore', {
    p_partita: partita.id,
    p_impostori: preparata.impostori,
    p_assegnazioni: preparata.assegnazioni,
    p_ordine: preparata.ordine,
    p_giri: giri,
  })

  if (error) throw error
  return daRiga(data)
}

// Passa da una funzione del database e non da un update: due persone che
// premono "fatto" insieme salterebbero un turno.
export async function avanzaTurno(partita) {
  const prossimo = avanza(partita)

  const { data, error } = await supabase.rpc('avanza_impostore', {
    p_partita: partita.id,
    p_turno_atteso: partita.turno,
    p_ordine: prossimo.ordine,
    p_turno: prossimo.turno,
    p_giro: prossimo.giro,
    p_stato: prossimo.stato,
  })

  if (error) throw error
  return daRiga(data)
}

// Il voto d'accusa. Si apre a ogni giro, e le opzioni sono solo chi e'
// ancora in gioco: dal secondo giro in poi votare chi e' gia' uscito non
// avrebbe senso, e lascerebbe accusare un fantasma.
export async function apriVoto(partita) {
  // Chi e' ancora in gioco, piu' "un altro giro": e' la stessa
  // decisione, o ne sappiamo abbastanza per accusare o si ascolta
  // ancora, quindi sta nello stesso voto e non in un bottone a parte.
  const inGioco = opzioniDelVoto(partita)
  const scade = new Date(Date.now() + IMPOSTORE.minutiVoto * 60000).toISOString()

  // ⚠️ Una funzione sola, non insert-e-poi-update. Prima il voto veniva
  // scritto PRIMA dell'update protetto: sei telefoni che vedevano lo stato
  // passare a 'voto' nello stesso istante scrivevano sei righe in `votes`,
  // e la protezione salvava solo l'aggancio — cinque sondaggi orfani per
  // ogni giro d'accusa. Invisibili nell'interfaccia, ma cadono dentro la
  // finestra temporale con cui si ritrovano i giri di una partita, e li'
  // vengono contati.
  const { data, error } = await supabase.rpc('apri_voto_impostore', {
    p_partita: partita.id,
    p_viaggio: VIAGGIO.id,
    p_opzioni: inGioco,
    p_scade: scade,
  })

  if (error) throw error
  // Chi arriva secondo riceve la partita com'e': il voto l'ha aperto un
  // altro, e va bene cosi'.
  return data ? daRiga(data) : leggiPartita()
}

// Quanti giri d'accusa si va a ripescare. Un tetto ci vuole (verifica
// bloccante n.4) e trenta e' molto piu' di quanti giri regge un gruppo
// prima di stufarsi.
const GIRI_DA_RIPESCARE = 30

// Le schede di TUTTI i giri d'accusa di questa partita, non solo
// dell'ultimo.
//
// I giri passati non sono raggiungibili dalla riga della partita:
// `vote_id` e' una colonna sola, e ripartendo `chiudi_accusa` la azzera.
// Si ritrovano per finestra temporale — i voti di categoria `impostore`
// nati dopo questa partita — e regge perche' di partita aperta ce n'e'
// sempre una sola: finche' non e' finita o annullata, l'app non fa
// cominciare la successiva.
//
// ⚠️ E' un legame per tempo e non per chiave esterna, quindi vale quanto
// vale quell'invariante. La stessa su cui poggia gia' `leggiPartita`, che
// di partite ne restituisce una: se un giorno se ne potessero aprire due
// insieme, questa non sarebbe la prima cosa a rompersi.
//
// ⚠️⚠️ E LA FINESTRA HA DUE ESTREMI, non uno. Con il solo pavimento,
// "i voti di questa partita" diventava "i voti di questa piu' quelli di
// ogni partita giocata dopo": l'invariante "una per volta" garantisce
// che nessun altro voto nasca PRIMA, non che non ne nascano DOPO.
//
// E succede davvero. Un telefono che perde il messaggio del realtime
// resta sulla schermata d'accusa col tasto "Rivela" acceso — non c'e'
// nessun risincronizzo al ritorno in primo piano — mentre il gruppo ne
// gioca un'altra. Venti minuti dopo quello tocca "Rivela": `chiudi_accusa`
// non solleva niente quando la guardia non passa, restituisce la riga
// gia' 'finita', e da li' `paga` gira su una partita chiusa leggendo i
// giri di quella nuova. Le schede sono tradotte con le opzioni giuste,
// quindi sono id di persone veri: chi in B ha votato uno che in A era
// impostore si prende +2 su una partita che magari non ha giocato, con
// una dedupeKey mai usata — quindi il punto passa — e i punti non si
// revocano.
//
// Il soffitto e' la partita successiva, cioe' la stessa invariante presa
// dall'altro capo. Prima di questa lettura `paga` era una funzione della
// riga piu' il voto in mano: rigiocata dieci minuti dopo dava la stessa
// risposta. Il soffitto le restituisce quella proprieta'.
//
// Il voto d'apertura resta fuori due volte: nasce prima della riga della
// partita, quindi il pavimento non lo prende, e comunque lo si esclude
// per id. Le sue opzioni sono numeri ("1", "2") e non persone.
export async function leggiSchedeDeiGiri(partita) {
  const { data: successive, error: erroreSuccessiva } = await supabase
    .from('impostore_games')
    .select('created_at')
    .eq('trip_id', VIAGGIO.id)
    .gt('created_at', partita.creataIl)
    .order('created_at', { ascending: true })
    .limit(1)

  if (erroreSuccessiva) throw erroreSuccessiva

  let richiesta = supabase
    .from('votes')
    .select('id, ballots, options, created_at')
    .eq('trip_id', VIAGGIO.id)
    .eq('category', 'impostore')
    .gte('created_at', partita.creataIl)

  const dopo = successive?.[0]?.created_at
  if (dopo) richiesta = richiesta.lt('created_at', dopo)

  const { data, error } = await richiesta
    .order('created_at', { ascending: true })
    .limit(GIRI_DA_RIPESCARE)

  if (error) throw error

  return (data ?? [])
    .filter((v) => v.id !== partita.votoAperturaId)
    .map((v) => schedePerId(v.ballots, v.options))
}

// La rivelazione paga: gli impostori che l'hanno fatta franca e chi ha
// indovinato. La dedupeKey e' obbligatoria perche' la rivelazione la puo'
// far scattare chiunque, e otto telefoni che rivelano insieme
// accrediterebbero gli stessi punti otto volte.
//
// Le schede si leggono con le opzioni di QUEL voto e non con l'elenco dei
// giocatori: dal secondo giro d'accusa in poi si vota solo fra i
// superstiti, e usare l'elenco intero sposterebbe ogni numero di un posto
// — cioe' darebbe i punti alle persone sbagliate, in silenzio.
// ⚠️ `schedeDeiGiri` si passa da fuori e non si legge qui dentro. Sono
// tutti i giri d'accusa, non solo l'ultimo: la Legge XXIV paga chi ha
// votato l'impostore giusto, e con due impostori beccarli in giri diversi
// e' il modo normale in cui il gruppo vince — chi lo aveva riconosciuto al
// primo giro non prendeva niente, perche' quel voto non compare piu' da
// nessuna parte nell'ultimo.
//
// Che a leggerli sia il chiamante non e' un dettaglio di stile: la lettura
// deve stare PRIMA di qualunque cosa cambi lo stato della partita. Dentro
// `chiudiAccusa` la RPC gira per prima, quindi una lettura che fallisce
// qui lascerebbe una partita gia' 'finita' e mai pagata, senza nessuno che
// riprova. Leggendo prima, un guasto ferma tutto quando fermarsi non costa
// niente.
export async function paga(partita, voto, schedeDeiGiri = []) {
  // ⚠️ Senza il voto in mano non si paga: ci si ferma. Prima ripiegava su
  // `partita.giocatori`, e con le schede vuote gli indovini risultavano
  // ZERO — chi aveva riconosciuto l'impostore non prendeva niente. E la
  // dedupeKey rende quella mancanza definitiva: nessuno ripassa a
  // rimediare, perche' la chiave dice che quel punto e' gia' stato
  // trattato.
  //
  // Succedeva davvero: chi ricaricava l'app durante il colpo di coda
  // arrivava qui con `voto` non ancora caricato. Meglio fermarsi e far
  // riprovare al tocco dopo — la partita resta da rivelare, che e' una
  // cosa che si vede — che pagare meta' delle persone e dichiararlo fatto.
  if (!voto?.opzioni) {
    throw new Error('paga vuole il voto del giro, con le sue opzioni.')
  }

  const opzioni = voto.opzioni
  // ⚠️ `fuori` e' obbligatorio. Senza, un impostore beccato in un giro
  // precedente non compare nelle schede dell'ultimo voto — non e'
  // nemmeno fra le opzioni — quindi risultava "impunito" e si prendeva i
  // cinque punti di chi l'ha fatta franca. Con due impostori beccarli in
  // due giri diversi e' il modo normale in cui il gruppo vince, quindi
  // non era un caso limite: era il caso.
  const { assegnazioni } = premi({
    impostori: partita.impostori,
    giocatori: partita.giocatori,
    schede: schedePerId(voto?.schede, opzioni),
    schedeDeiGiri,
    fuori: partita.fuori ?? [],
    colpoRiuscito: stessaParola(partita.tentativo, partita.parolaGruppo),
  })

  for (const { membroId, leggeId } of assegnazioni) {
    await faiScattareLegge(leggeId, membroId, `impostore:${partita.id}:${leggeId}:${membroId}`)
  }

  return assegnazioni
}
// Fine di un giro d'accusa. Chi e' stato accusato esce: se era un
// impostore e' scoperto, se era innocente e' eliminato e il gruppo ha
// perso un voto. Poi la partita fa una di tre cose — si va al colpo di
// coda, finisce perche' gli impostori non sono piu' in minoranza, oppure
// si riparte con un altro giro fra i superstiti.
export async function chiudiAccusa(partita, voto, casuale) {
  // ⚠️ Vuole il VOTO, non l'esito del giro. Chiamandola con l'oggetto
  // sbagliato, `opzioni` e `schede` restavano vuote e il giro si chiudeva
  // senza accusare nessuno — in silenzio, senza errori: la partita
  // ripartiva da capo e l'impostore beccato tornava in gioco. Meglio
  // fermarsi che raccontare una partita che non e' successa.
  if (!voto?.opzioni) {
    throw new Error('chiudiAccusa vuole il voto del giro, con le sue opzioni.')
  }

  const esitoGiro = dopoAccusa(partita, schedePerId(voto.schede, voto.opzioni), casuale)

  // ⚠️ Prima della RPC. Se la partita finisce qui, i punti si assegnano
  // subito dopo: leggendo i giri dopo aver chiuso, un guasto di rete
  // lascerebbe una partita 'finita' che non paga nessuno — impostori
  // impuniti compresi — e nessuno riproverebbe, perche' `chiudi_accusa`
  // dalla seconda volta in poi non fa piu' niente. Qui invece un guasto
  // ferma tutto prima che sia cambiato qualcosa, e il tocco dopo rifa'
  // tutto da capo.
  const schedeDeiGiri = await leggiSchedeDeiGiri(partita)

  const { data, error } = await supabase.rpc('chiudi_accusa', {
    p_partita: partita.id,
    p_fuori: esitoGiro.fuori,
    p_stato: esitoGiro.stato,
    p_ordine: esitoGiro.ordine ?? null,
    p_giri: esitoGiro.giriTotali ?? null,
    // Il numero del giro lo decide il motore. Prima il database lo
    // forzava a 1 ogni volta che si ripartiva, e il contatore a schermo
    // restava inchiodato: dopo tre giri d'accusa diceva ancora "Giro 1".
    p_giro: esitoGiro.giro ?? null,
    // Ripartendo, il voto vecchio non serve piu': il prossimo giro ne
    // apre uno suo, sui superstiti di allora.
    p_voto: esitoGiro.stato === 'in-corso' ? null : (partita.votoId ?? null),
  })

  if (error) throw error
  const dopo = daRiga(data)

  // Se e' gia' finita — hanno vinto gli impostori per numeri — i punti si
  // assegnano adesso. Se si va al colpo, si aspetta quello.
  if (dopo.stato === 'finita') await paga(dopo, voto, schedeDeiGiri)

  return dopo
}

// L'impostore beccato scrive la parola del gruppo. Una volta sola: due
// che tentano insieme non possono avere due finali diversi per la stessa
// partita, quindi la prima che arriva vale.
export async function tentaColpo(partita, membroId, parola) {
  const { data, error } = await supabase.rpc('tenta_colpo', {
    p_partita: partita.id,
    p_membro: membroId,
    p_parola: parola,
  })
  if (error) throw error
  return daRiga(data)
}

// L'uscita di sicurezza. Una partita che si pianta blocca tutti, perche'
// finche' ce n'e' una aperta non se ne puo' cominciare un'altra: deve
// esserci sempre un modo di chiuderla.
//
// Non serve il consenso del gruppo, e non e' una svista: se serve
// abbandonare e' perche' qualcuno se n'e' andato o ha il telefono morto,
// e chiedere una maggioranza ricrerebbe esattamente il blocco che si sta
// cercando di togliere. La conferma sta nell'interfaccia, che chiede due
// volte e dice che vale per tutti.
export async function abbandonaPartita(partita) {
  const { data, error } = await supabase
    .from('impostore_games')
    .update({ stato: 'annullata' })
    .eq('id', partita.id)
    .neq('stato', 'finita')
    .neq('stato', 'annullata')
    .select(CAMPI)
    .maybeSingle()

  if (error) throw error
  return data ? daRiga(data) : leggiPartita()
}

// Chiedere di rivelare prima che abbiano votato tutti. Passa da una
// funzione: due che la chiedono nello stesso istante si sovrascriverebbero
// a vicenda, e uno dei due voti sparirebbe.
export async function chiediRivelazione(partita, membroId) {
  const { data, error } = await supabase.rpc('chiedi_rivelazione', {
    p_partita: partita.id,
    p_membro: membroId,
  })
  if (error) throw error
  return daRiga(data)
}

export async function chiudiPartita(partita, schede) {
  // Prima i punti, poi la chiusura: se paga fallisce a meta', la partita
  // resta da rivelare e il prossimo tocco riprova. Le chiavi doppie
  // vengono rifiutate, quindi ripetere non raddoppia niente. Vale anche
  // per la lettura dei giri, che sta dentro lo stesso "prima".
  await paga(partita, schede, await leggiSchedeDeiGiri(partita))

  const { data, error } = await supabase
    .from('impostore_games')
    .update({ stato: 'finita' })
    .eq('id', partita.id)
    .neq('stato', 'finita')
    .select(CAMPI)
    .maybeSingle()

  if (error) throw error
  return data ? daRiga(data) : leggiPartita()
}

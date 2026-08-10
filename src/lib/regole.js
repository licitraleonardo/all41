import { supabase } from './supabase.js'
import { VIAGGIO } from '../config/viaggio.js'
import { dataDiOggi } from './giorni.js'
import { faiScattareLegge } from './punti.js'
import { azzeraInsistenza, registraRifiuto } from './insistenza.js'
import { parolaProibitaIn } from '../config/paroleProibite.js'
import { ABUSO_SUONO, LIMITI } from '../config/limiti.js'

// Rilevamento delle Leggi che scattano da sole. Ogni chiamata ha una
// chiave deterministica: senza server è il client di chi sta usando l'app
// a rilevare l'evento, e se due lo rilevano insieme la chiave impedisce il
// doppio accredito.
//
// Le Leggi qui sono solo quelle rilevabili dai dati che l'app già scrive.
// Le altre si accendono man mano che nascono le sezioni che le alimentano.

const SOGLIA_FOTO_AL_GIORNO = 30

// Legge XXX. Si parte tutti sopra lo zero grazie al selfie di gruppo,
// quindi finirci sotto è una cosa che ti sei guadagnato.
//
// Scatta una volta per persona e per viaggio: la chiave non ha la data,
// altrimenti chi resta in negativo pagherebbe un punto ogni giorno e non
// ne uscirebbe più — che è la spirale che la Maglia Nera evita apposta.
//
// Si valuta all'apertura, come le altre cose senza server: chi apre
// l'app guarda i punteggi di tutti e chiude i conti in sospeso.
export async function forseSottoZero(membri) {
  const caduti = membri.filter((m) => m.punteggio < 0)

  for (const m of caduti) {
    await faiScattareLegge('sotto-zero', m.id, `sotto-zero_${m.id}`).catch(() => {})
  }

  return caduti.map((m) => m.id)
}

function inizioGiornata() {
  const m = new Date()
  m.setHours(0, 0, 0, 0)
  return m.toISOString()
}

async function conta(tabella, filtra) {
  let query = supabase
    .from(tabella)
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', VIAGGIO.id)
    .gte('created_at', inizioGiornata())
  query = filtra(query)
  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

// Legge IV (prima foto della giornata) e Legge XVI (più di 30 foto in un
// giorno). Da chiamare dopo un caricamento riuscito.
export async function dopoFoto(memberId) {
  const oggi = dataDiOggi()
  const scattate = []

  const delGruppo = await conta('photos', (q) => q.is('deleted_at', null))
  if (delGruppo === 1) {
    const esito = await faiScattareLegge('first-photo-day', memberId, `first-photo-day_${oggi}`)
    scattate.push({ leggeId: 'first-photo-day', ...esito })

    // La primissima del viaggio, non solo della giornata: si prende una
    // volta sola e la prende una persona sola, in tutti e cinque i
    // giorni. La chiave non ha la data apposta.
    const diSempre = await tutteLeFoto().catch(() => null)
    if (diSempre === 1) {
      const esito = await faiScattareLegge('prima-luce', memberId, 'prima-luce').catch(() => null)
      if (esito) scattate.push({ leggeId: 'prima-luce', ...esito })
    }
  }

  const mie = await conta('photos', (q) =>
    q.is('deleted_at', null).eq('author_id', memberId)
  )

  // Rullino finito: hai usato tutte le foto della giornata. È il premio
  // per aver documentato davvero, e sta esattamente sul tetto che l'app
  // impone — non un passo oltre, perché oltre non si può andare.
  if (mie === LIMITI.photo.giorno) {
    const esito = await faiScattareLegge(
      'paparazzo',
      memberId,
      `paparazzo_${memberId}_${oggi}`
    ).catch(() => null)
    if (esito) scattate.push({ leggeId: 'paparazzo', ...esito })
  }

  if (mie > SOGLIA_FOTO_AL_GIORNO) {
    const esito = await faiScattareLegge('photo-spam', memberId, `photo-spam_${memberId}_${oggi}`)
    scattate.push({ leggeId: 'photo-spam', ...esito })
  }

  return scattate
}

// Tutte le foto del viaggio, senza filtro sulla data: serve solo alla
// prima luce, quindi si conta e basta.
async function tutteLeFoto() {
  const { count, error } = await supabase
    .from('photos')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', VIAGGIO.id)
    .is('deleted_at', null)
  if (error) throw error
  return count ?? 0
}

// Legge XXVI: parola proibita in un messaggio. Scatta dopo l'invio, non
// prima: il messaggio resta lì come prova.
//
// Qui passano anche le due Leggi dell'orologio: il primo messaggio della
// giornata premia, quello delle quattro di notte no. Sono la coppia che
// dà ritmo alle giornate senza chiedere niente a nessuno — si inciampa
// scrivendo, che è quello che si fa comunque.
export async function dopoTesto(memberId, testo, azioneId, adesso = new Date()) {
  const scattate = []
  const oggi = dataDiOggi(adesso)
  const ora = adesso.getHours()

  // Il primo messaggio della giornata di tutto il gruppo. Si guarda il
  // conteggio del gruppo, non il proprio: "il primo sveglio" è uno solo.
  const delGruppo = await conta('quick_actions', (q) =>
    q.eq('kind', 'free_text').is('deleted_at', null)
  ).catch(() => null)
  if (delGruppo === 1) {
    const esito = await faiScattareLegge(
      'primo-sveglio',
      memberId,
      `primo-sveglio_${oggi}`
    ).catch(() => null)
    if (esito) scattate.push({ leggeId: 'primo-sveglio', ...esito })
  }

  // Fra le 3 e le 6 non si scrive al gruppo. Una volta per notte: la
  // Legge punisce l'ora, non quanti messaggi hai mandato.
  if (ora >= 3 && ora < 6) {
    const esito = await faiScattareLegge(
      'sveglia-il-gruppo',
      memberId,
      `sveglia-il-gruppo_${memberId}_${oggi}`
    ).catch(() => null)
    if (esito) scattate.push({ leggeId: 'sveglia-il-gruppo', ...esito })
  }

  const parola = parolaProibitaIn(testo)
  if (!parola) return { scattata: false, scattate }

  const esito = await faiScattareLegge(
    'parola-proibita',
    memberId,
    `parola-proibita_${azioneId}`
  )
  // ⚠️ Come sopra: se la Legge non e' scattata non si annuncia. Prima del
  // viaggio comparirebbe «Quella parola ti costa -2» senza che a nessuno
  // sia stato tolto niente.
  if (!esito) return { scattata: false, scattate }
  return { scattata: true, parola, scattate, ...esito }
}

// Le due Leggi dei vocali: il messaggio da due secondi e quello da un
// minuto. Una volta a testa per tutto il viaggio, senza data nella
// chiave: sono due modi di essere insopportabili, e la seconda volta non
// fa più ridere.
export async function dopoVocale(memberId, durata) {
  if (durata < 2) {
    const esito = await faiScattareLegge(
      'telegrafico',
      memberId,
      `telegrafico_${memberId}`
    ).catch(() => null)
    return esito ? [{ leggeId: 'telegrafico', ...esito }] : []
  }

  // "Quasi un minuto" è il tetto meno cinque secondi: chi ci arriva ha
  // parlato fino a farsi interrompere dal limite.
  if (durata >= LIMITI.voice.durataMax - 5) {
    const esito = await faiScattareLegge(
      'il-podcast',
      memberId,
      `il-podcast_${memberId}`
    ).catch(() => null)
    return esito ? [{ leggeId: 'il-podcast', ...esito }] : []
  }

  return []
}

// Legge dell'insonne: app aperta fra le 4 e le 6. Si valuta all'avvio,
// una volta per persona e per notte. Non è punire l'uso dell'app — a
// quell'ora non la si apre per caso.
export async function allApertura(memberId, adesso = new Date()) {
  const ora = adesso.getHours()
  if (ora < 4 || ora >= 6) return []

  const esito = await faiScattareLegge(
    'insonne',
    memberId,
    `insonne_${memberId}_${dataDiOggi(adesso)}`
  ).catch(() => null)
  return esito ? [{ leggeId: 'insonne', ...esito }] : []
}

// Aprire la Guida è ammettere di non aver ascoltato il tutorial. Chiude
// il cerchio con la nuvoletta di Allan, e vale un punto: è l'unico
// Trofeo che si prende leggendo le istruzioni.
export async function dopoGuida(memberId) {
  const esito = await faiScattareLegge(
    'non-hai-ascoltato',
    memberId,
    `non-hai-ascoltato_${memberId}`
  ).catch(() => null)
  return esito ? [{ leggeId: 'non-hai-ascoltato', ...esito }] : []
}

// Legge XIX: hai insistito su un bottone già bloccato dal limite. Da
// chiamare a ogni tentativo rifiutato; decide da sola se costa qualcosa.
export async function dopoRifiuto(memberId, tipo) {
  const { tentativi, penalita, quante } = registraRifiuto(memberId, tipo)
  if (penalita === 0) return { tentativi, scattata: false }

  const esito = await faiScattareLegge(
    'spam-insistente',
    memberId,
    `spam_${memberId}_${tipo}_${dataDiOggi()}_${quante}`,
    penalita
  )
  // ⚠️ `scattata` dice se e' successo davvero, non se ci abbiamo provato.
  //
  // Prima era `true` fisso, e finche' le Leggi scattavano sempre andava
  // bene per caso. Con le Leggi congelate prima del viaggio comparirebbe
  // «E ti costa -1» mentre non viene tolto niente: l'app direbbe una
  // bugia su una cosa che nessuno puo' controllare.
  if (!esito) return { tentativi, scattata: false }
  return { tentativi, scattata: true, penalita, ...esito }
}

export function dopoInvioRiuscito(memberId, tipo) {
  azzeraInsistenza(memberId, tipo)
}

// Legge XXVII: abuso di un suono. Cinque pressioni dello stesso bottone
// entro un minuto e quel bottone si spegne per un'ora — solo quello, e
// solo per chi ha esagerato.
//
// Il blocco non si salva da nessuna parte: si deduce dall'esistenza della
// penalità. Se c'è un evento di abuso per quel suono nell'ultima ora, il
// bottone è spento. Così sopravvive a un ricaricamento e a un cambio di
// telefono, senza una tabella in più.
// La raffica si conta su tutta la soundboard, non su un suono per volta:
// cinque suoni diversi in un minuto sono la stessa raffica di cinque
// volte lo stesso, e chi la sente non ringrazia per la varieta'.
//
// Il primo blocco dura un quarto d'ora. Se nella stessa giornata ci
// ricaschi, tre ore: la prima volta puo' essere entusiasmo, la seconda
// l'hai gia' visto succedere.
export async function dopoSuonoPremuto(memberId) {
  const da = new Date(Date.now() - ABUSO_SUONO.entroSecondi * 1000).toISOString()

  const { count, error } = await supabase
    .from('quick_actions')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', memberId)
    .eq('kind', 'soundboard')
    .gte('created_at', da)
  if (error) throw error

  if ((count ?? 0) < ABUSO_SUONO.pressioni) return { abuso: false }

  const oggi = dataDiOggi()
  const gia = await quantiBlocchiOggi(memberId, oggi)
  const recidiva = gia >= 1

  // Chiave sul numero del blocco della giornata: la stessa raffica non
  // paga due volte, ma il blocco di stasera e' diverso da quello di
  // stamattina.
  const esito = await faiScattareLegge(
    recidiva ? 'sound-abuse-ancora' : 'sound-abuse',
    memberId,
    `sound-abuse_${memberId}_${oggi}_${gia}`
  )

  return {
    abuso: true,
    recidiva,
    minuti: recidiva ? ABUSO_SUONO.bloccoRipetutoMinuti : ABUSO_SUONO.bloccoMinuti,
    ...esito,
  }
}

// Quante volte la soundboard e' gia' stata spenta oggi a questa persona.
async function quantiBlocchiOggi(memberId, oggi) {
  const { data, error } = await supabase
    .from('point_events')
    .select('dedupe_key')
    .eq('member_id', memberId)
    .in('rule_id', ['sound-abuse', 'sound-abuse-ancora'])
    .like('dedupe_key', `sound-abuse_${memberId}_${oggi}_%`)
    .limit(10)
  if (error) throw error
  return data.length
}

// La soundboard e' spenta adesso per questa persona? Restituisce fino a
// quando, o null se si puo' suonare.
//
// Prima tornava l'elenco dei suoni spenti uno per uno; adesso o e'
// spenta tutta o non lo e'.
export async function soundboardSpenta(memberId) {
  const piuLungo = Math.max(ABUSO_SUONO.bloccoMinuti, ABUSO_SUONO.bloccoRipetutoMinuti)
  const da = new Date(Date.now() - piuLungo * 60000).toISOString()

  const { data, error } = await supabase
    .from('point_events')
    .select('rule_id, created_at')
    .eq('member_id', memberId)
    .in('rule_id', ['sound-abuse', 'sound-abuse-ancora'])
    .gte('created_at', da)
    .order('created_at', { ascending: false })
    .limit(5)
  if (error) throw error

  for (const riga of data) {
    const minuti =
      riga.rule_id === 'sound-abuse-ancora'
        ? ABUSO_SUONO.bloccoRipetutoMinuti
        : ABUSO_SUONO.bloccoMinuti
    const fine = Date.parse(riga.created_at) + minuti * 60000
    if (fine > Date.now()) return new Date(fine)
  }

  return null
}
// Legge VIII: soundboard lanciato tra l'01:00 e le 07:00. Una volta per
// persona al giorno, non a ogni suono: la Legge punisce l'ora, non il
// numero di volte.
export async function dopoSuono(memberId, adesso = new Date()) {
  const ora = adesso.getHours()
  if (ora < 1 || ora >= 7) return []

  const oggi = dataDiOggi(adesso)
  const esito = await faiScattareLegge(
    'night-owl-sound',
    memberId,
    `night-owl-sound_${memberId}_${oggi}`
  )
  return [{ leggeId: 'night-owl-sound', ...esito }]
}

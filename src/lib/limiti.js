import { supabase } from './supabase.js'
import { LIMITI } from '../config/limiti.js'
import { valuta } from './regoleLimiti.js'

// Quante righe recenti bastano a decidere. La raffica più larga è 20
// (foto), quindi trenta danno margine senza scaricare mezza tabella.
const RIGHE_MAX = 30

// I contatori si derivano dal database e non da localStorage: un contatore
// locale si azzera cambiando dispositivo o svuotando la cache, cioè
// diventa inutile proprio quando servirebbe.
// Le foto non stanno in quick_actions ma nella tabella loro: contarle
// nella prima voleva dire contare zero, e il limite sulle foto non ha
// mai fermato niente da quando esiste.
function daContare(kind, memberId) {
  if (kind === 'photo') {
    return supabase.from('photos').select('created_at').eq('author_id', memberId)
  }
  if (kind === 'voice') {
    return supabase.from('voice_messages').select('created_at').eq('author_id', memberId)
  }
  // ⚠️ Le righe che l'app scrive per conto tuo non contano contro di te.
  //
  // Le ricevute degli SOS e gli annunci delle proposte sono righe
  // `free_text` con il tuo nome sopra, scritte a mano per saltare questo
  // limite — un anti-spam non deve poter stare in mezzo a «ho visto il
  // tuo SOS». Ma saltarlo in **scrittura** non bastava: restavano contate
  // in **lettura**, e mangiavano la tua quota di messaggi veri.
  //
  // Lo scenario, che è il peggiore possibile: durante un SOS si scrive
  // fitto. Premi «Ricevuto», poi scrivi «arrivo, dove sei?» e ti senti
  // rispondere «Aspetta 3s» per colpa di una riga che non hai scritto.
  // E i rifiuti non sono gratis: al terzo scatta la Legge XIX e ti toglie
  // punti — mentre qualcuno è perso.
  //
  // Si escludono dal conto, non dalla chat: restano visibili, non
  // pesano.
  return supabase
    .from('quick_actions')
    .select('created_at')
    .eq('author_id', memberId)
    .eq('kind', kind)
    .is('payload->>ricevutaSos', null)
    .is('payload->>propostaVoto', null)
}

export async function verificaLimite(kind, memberId) {
  const regola = LIMITI[kind]
  if (!regola) return { consentito: true }

  const finestra = Math.max(regola.cooldown ?? 0, regola.finestra ?? 0)
  const da = new Date(Date.now() - finestra * 1000).toISOString()

  const { data, error } = await daContare(kind, memberId)
    .gte('created_at', da)
    .order('created_at', { ascending: false })
    .limit(RIGHE_MAX)

  if (error) throw error

  return valuta(
    regola,
    data.map((r) => Date.parse(r.created_at)),
    { oggi: regola.giorno ? await contaOggi(kind, memberId) : 0 }
  )
}

async function contaOggi(kind, memberId) {
  const mezzanotte = new Date()
  mezzanotte.setHours(0, 0, 0, 0)

  if (kind === 'photo') {
    // Il tetto giornaliero vale per l'album, non per la caccia al
    // tesoro: mandare una foto a una sfida non deve consumare le cinque
    // della giornata. E una foto eliminata libera il posto — è il senso
    // di poterla eliminare.
    const { count, error } = await supabase
      .from('photos')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', memberId)
      .is('challenge_id', null)
      .is('deleted_at', null)
      .gte('created_at', mezzanotte.toISOString())

    if (error) throw error
    return count ?? 0
  }

  if (kind === 'voice') {
    const { count, error } = await supabase
      .from('voice_messages')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', memberId)
      .is('deleted_at', null)
      .gte('created_at', mezzanotte.toISOString())

    if (error) throw error
    return count ?? 0
  }

  const { count, error } = await supabase
    .from('quick_actions')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', memberId)
    .eq('kind', kind)
    .gte('created_at', mezzanotte.toISOString())

  if (error) throw error
  return count ?? 0
}

// L'aggancio del telefono al profilo: dice al database «questa sessione
// è quel membro lì».
//
// Non si vede e non chiede niente a nessuno. Serve a rendere scrivibile
// la frase «solo gli otto possono leggere», che oggi il database non sa
// esprimere perché non sa chi sei — vedi `supabase/account.sql` per la
// misura di quanto è aperto adesso.

import { supabase } from './supabase.js'
import { memberIdSalvato } from './sessione.js'
import { deveAgganciare, segno } from './aggancioRegole.js'

const CHIAVE = 'all41.dispositivoAgganciato'

function leggiSegno() {
  try {
    return localStorage.getItem(CHIAVE)
  } catch {
    // Safari in navigazione privata rifiuta: si riaggancia a ogni
    // apertura. È una richiesta in più, non un guasto.
    return null
  }
}

function scriviSegno(valore) {
  try {
    localStorage.setItem(CHIAVE, valore)
  } catch {
    // vedi sopra
  }
}

// ⚠️ Non solleva mai, qualunque cosa succeda. Gira all'avvio, che è
// l'unico punto dell'app senza una rete sotto: se questa funzione
// rompesse l'avvio, l'app non si aprirebbe più — per tutti e otto,
// mentre sono in giro.
//
// E il segno si scrive **solo se il database ha risposto di sì**. Segnare
// prima vorrebbe dire che un aggancio fallito diventa definitivo: quel
// telefono non ci riproverebbe mai più, e resterebbe fuori il giorno
// della chiusura senza che nessuno lo sappia.
export async function agganciaDispositivo() {
  try {
    const membroId = memberIdSalvato()
    const { data } = await supabase.auth.getSession()
    const uid = data?.session?.user?.id ?? null

    if (!deveAgganciare({ uid, membroId, segnato: leggiSegno() })) return 'gia'

    const { data: esito, error } = await supabase.rpc('aggancia_dispositivo', {
      p_membro: membroId,
    })
    if (error || !esito) return 'niente'

    scriviSegno(segno(uid, membroId))
    return 'fatto'
  } catch {
    return 'niente'
  }
}

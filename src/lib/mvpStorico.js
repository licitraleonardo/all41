import { supabase } from './supabase.js'
import { VIAGGIO } from '../config/viaggio.js'
import { giorniDaChiudere, mvpDelGiorno, saldiDelGiorno } from './classifica.js'
import { faiScattareLegge } from './punti.js'
import { dataDiOggi, estremiDelGiorno } from './giorni.js'
import { PER_ID } from '../config/leggi.js'

// Chi e' stato MVP e quante volte. Le giornate finite si chiudono alla
// prima apertura dopo mezzanotte, come i sondaggi scaduti: il primo
// telefono che se ne accorge lo fa, e la chiave primaria della tabella
// impedisce che due ne scrivano due diversi.

export async function leggiStorico() {
  const { data, error } = await supabase
    .from('mvp_days')
    .select('giorno, member_id, saldo')
    .eq('trip_id', VIAGGIO.id)
    .order('giorno', { ascending: false })
    .limit(40)

  if (error) throw error
  return data.map((r) => ({ giorno: r.giorno, membroId: r.member_id, saldo: r.saldo }))
}

// Gli eventi di una giornata sola. Non si riusa la finestra della
// classifica: quella tiene gli ultimi quaranta eventi, e dopo una
// giornata movimentata ieri e' gia' fuori.
// ⚠️ Gli estremi passano da `estremiDelGiorno`, che li calcola a
// mezzanotte DEL TELEFONO. Prima erano due stringhe senza fuso, che
// Postgres legge come UTC: in Italia d'estate due ore di scarto, e cadevano
// proprio fra mezzanotte e le due — le partite dopo cena. Quei punti non
// finivano in nessun MVP: troppo tardi per ieri, non abbastanza per oggi.
//
// ⚠️ Ed è esportata apposta. La classifica calcolava l'MVP di oggi sugli
// ultimi 40 eventi del VIAGGIO, non della giornata: dopo una serata piena,
// chi aveva preso i punti in mattinata usciva dalla finestra e spariva, e
// la corona andava a chi aveva fatto qualcosa nell'ultima ora. Due
// schermate della stessa app che incoronavano due persone diverse.
export async function eventiDelGiorno(giorno) {
  const { da, a } = estremiDelGiorno(giorno)
  const { data, error } = await supabase
    .from('point_events')
    // `rule_id` serve alla classifica, che da qui capisce anche se una
    // Legge una-volta-sola è già scattata per qualcuno oggi.
    .select('member_id, points, status, created_at, rule_id')
    .eq('trip_id', VIAGGIO.id)
    .gte('created_at', da)
    .lt('created_at', a)
    .limit(500)

  if (error) throw error
  return data.map((r) => ({
    membroId: r.member_id,
    punti: r.points,
    stato: r.status,
    creatoIl: r.created_at,
    leggeId: r.rule_id,
  }))
}

// Legge XXI: essere stato MVP due volte. Prima non la faceva scattare
// nessuno, perche' senza uno storico non si puo' sapere quante volte.
async function forseDoppioMvp(membroId) {
  const { count, error } = await supabase
    .from('mvp_days')
    .select('giorno', { count: 'exact', head: true })
    .eq('trip_id', VIAGGIO.id)
    .eq('member_id', membroId)

  if (error) throw error
  if ((count ?? 0) < 2) return null

  return faiScattareLegge('double-mvp', membroId, `double-mvp_${membroId}`)
}

// Chiude tutte le giornate finite e non ancora chiuse. Restituisce quelle
// scritte davvero da questo telefono.
export async function chiudiGiornate(oggi = dataDiOggi()) {
  const storico = await leggiStorico()
  const daFare = giorniDaChiudere(oggi, storico.map((r) => r.giorno), VIAGGIO.dataInizio)
  const chiuse = []

  for (const giorno of daFare) {
    const mvp = mvpDelGiorno(saldiDelGiorno(await eventiDelGiorno(giorno), giorno))

    // La riga si scrive anche quando non c'e' nessun MVP: serve a
    // ricordare che quel giorno e' gia' stato guardato, altrimenti si
    // riproverebbe a ogni apertura per tutto il viaggio.
    const { data, error } = await supabase
      .from('mvp_days')
      .insert({
        trip_id: VIAGGIO.id,
        giorno,
        member_id: mvp?.membroId ?? null,
        saldo: mvp?.saldo ?? null,
      })
      .select('giorno, member_id, saldo')
      // Se un altro telefono ha chiuso la stessa giornata un istante
      // prima, la chiave primaria rifiuta: non e' un errore, e' il
      // sistema che funziona.
      .maybeSingle()

    if (error) {
      if (error.code === '23505') continue
      throw error
    }
    if (!data) continue

    chiuse.push({ giorno, membroId: data.member_id, saldo: data.saldo })
    if (data.member_id) await forseDoppioMvp(data.member_id).catch(() => {})
  }

  return chiuse
}

// Quante volte a testa, per la classifica.
export function conteggioPerMembro(storico) {
  const conta = {}
  for (const r of storico) {
    if (!r.membroId) continue
    conta[r.membroId] = (conta[r.membroId] ?? 0) + 1
  }
  return conta
}

export const LEGGE_DOPPIO_MVP = PER_ID['double-mvp']

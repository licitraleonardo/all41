import { supabase } from './supabase.js'
import { VIAGGIO } from '../config/viaggio.js'
import { conCache } from './cache.js'
import { TETTO_ELENCO } from '../config/spese.js'

const CAMPI_SPESA =
  'id, description, amount_cents, paid_by, split_among, deleted_at, created_at'
const CAMPI_RIMBORSO =
  'id, from_member, to_member, amount_cents, deleted_at, created_at'

function daRigaSpesa(riga) {
  return {
    id: riga.id,
    descrizione: riga.description,
    centesimi: riga.amount_cents,
    pagataDa: riga.paid_by,
    divisaFra: riga.split_among ?? [],
    eliminata: Boolean(riga.deleted_at),
    creataIl: riga.created_at,
  }
}

function daRigaRimborso(riga) {
  return {
    id: riga.id,
    da: riga.from_member,
    a: riga.to_member,
    centesimi: riga.amount_cents,
    eliminato: Boolean(riga.deleted_at),
    creatoIl: riga.created_at,
  }
}

export const leggiSpese = conCache('spese', async function leggiSpese() {
  const { data, error } = await supabase
    .from('expenses')
    .select(CAMPI_SPESA)
    .eq('trip_id', VIAGGIO.id)
    .order('created_at', { ascending: false })
    .limit(TETTO_ELENCO)

  if (error) throw error
  return data.map(daRigaSpesa)
})

export const leggiRimborsi = conCache('rimborsi', async function leggiRimborsi() {
  const { data, error } = await supabase
    .from('payments')
    .select(CAMPI_RIMBORSO)
    .eq('trip_id', VIAGGIO.id)
    .order('created_at', { ascending: false })
    .limit(TETTO_ELENCO)

  if (error) throw error
  return data.map(daRigaRimborso)
})

export async function aggiungiSpesa({ descrizione, centesimi, pagataDa, divisaFra }) {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      trip_id: VIAGGIO.id,
      description: descrizione,
      amount_cents: centesimi,
      paid_by: pagataDa,
      split_among: divisaFra,
    })
    .select(CAMPI_SPESA)
    .single()

  if (error) throw error
  return daRigaSpesa(data)
}

export async function aggiungiRimborso({ da, a, centesimi }) {
  const { data, error } = await supabase
    .from('payments')
    .insert({
      trip_id: VIAGGIO.id,
      from_member: da,
      to_member: a,
      amount_cents: centesimi,
    })
    .select(CAMPI_RIMBORSO)
    .single()

  if (error) throw error
  return daRigaRimborso(data)
}

// Morbida come nel resto dell'app: la riga resta, sparisce dai conti.
export async function eliminaSpesa(id) {
  const { error } = await supabase
    .from('expenses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function eliminaRimborso(id) {
  const { error } = await supabase
    .from('payments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

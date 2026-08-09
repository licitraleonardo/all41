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
    // Prima dell'adeguamento dello schema paid_by era un uuid solo: se
    // l'app si apre su un database non ancora aggiornato, la spesa si
    // legge lo stesso invece di rompere la schermata.
    paganti: Array.isArray(riga.paid_by) ? riga.paid_by : [riga.paid_by].filter(Boolean),
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

// ⚠️ Le eliminate non si leggono. `calcolaSaldi` le saltava da sé e a
// schermo erano già filtrate, quindi non servivano a nessuno — ma
// occupavano un posto del tetto ciascuna. Una riga sbagliata e ricorretta
// tre volte ne mangiava quattro, e a spingere fuori dal tetto sono sempre
// le più vecchie: le spese del primo giorno.
export const leggiSpese = conCache('spese', async function leggiSpese() {
  const { data, error } = await supabase
    .from('expenses')
    .select(CAMPI_SPESA)
    .eq('trip_id', VIAGGIO.id)
    .is('deleted_at', null)
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
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(TETTO_ELENCO)

  if (error) throw error
  return data.map(daRigaRimborso)
})

export async function aggiungiSpesa({ descrizione, centesimi, paganti, divisaFra }) {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      trip_id: VIAGGIO.id,
      description: descrizione,
      amount_cents: centesimi,
      paid_by: paganti,
      split_among: divisaFra,
    })
    .select(CAMPI_SPESA)
    .single()

  if (error) throw error
  return daRigaSpesa(data)
}

// ⚠️ Da una funzione e non da un insert. Il tasto «Salda» ce l'hanno in
// mano tutti e due — chi paga e chi incassa — quindi lo stesso passaggio di
// soldi può essere registrato due volte nel giro di pochi secondi, una per
// telefono. Trenta euro saldati due volte spostano il saldo di sessanta
// nella direzione sbagliata, e non se ne accorge nessuno fino alla sera dei
// conti. La finestra dei due minuti e il perché della scelta stanno scritti
// in `supabase/rimborso-unico.sql`.
export async function aggiungiRimborso({ da, a, centesimi }) {
  const { data, error } = await supabase.rpc('registra_rimborso', {
    p_viaggio: VIAGGIO.id,
    p_da: da,
    p_a: a,
    p_centesimi: centesimi,
  })

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

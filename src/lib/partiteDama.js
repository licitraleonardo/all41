import { supabase } from './supabase.js'
import { VIAGGIO } from '../config/viaggio.js'
import { DAMA } from '../config/dama.js'

// Le partite di Dama sul database. Le regole — cosa si può muovere, chi
// ha vinto — stanno in dama.js, che non sa cosa sia Supabase e si prova
// da riga di comando. Qui c'è solo la lista delle mosse e chi gioca.

const CAMPI = 'id, bianco, nero, mosse, stato, abbandonata_da, created_at, updated_at'

export function daRiga(riga) {
  if (!riga) return null
  return {
    id: riga.id,
    bianco: riga.bianco,
    nero: riga.nero,
    mosse: riga.mosse ?? [],
    stato: riga.stato,
    abbandonataDa: riga.abbandonata_da ?? null,
    creataIl: riga.created_at,
    mossaIl: riga.updated_at,
  }
}

// Le partite recenti del viaggio, aperte e chiuse insieme: è il telefono
// a decidere quali mostrare. Verifica bloccante n.4: il limit c'è.
export async function leggiPartite() {
  const { data, error } = await supabase
    .from('dama_games')
    .select(CAMPI)
    .eq('trip_id', VIAGGIO.id)
    .order('created_at', { ascending: false })
    .limit(DAMA.inElenco)
  if (error) throw error
  return data.map(daRiga)
}

// Chi sfida è il bianco e muove per primo. Nella rivincita si passa
// l'avversario come bianco, e il vantaggio della prima mossa gira.
export async function creaPartita(biancoId, neroId) {
  const { data, error } = await supabase
    .from('dama_games')
    .insert({ trip_id: VIAGGIO.id, bianco: biancoId, nero: neroId })
    .select(CAMPI)
    .single()
  if (error) throw error
  return daRiga(data)
}

// La mossa passa dalla funzione del database, mai da un update: due
// telefoni che muovono insieme non devono scrivere due volte. p_indice è
// quante mosse avevamo visto: se non tornano, la mossa viene rifiutata
// e il telefono ricarica invece di sovrascrivere.
export async function giocaMossa(partitaId, membroId, testoMossa, indice) {
  const { data, error } = await supabase.rpc('gioca_dama', {
    p_partita: partitaId,
    p_membro: membroId,
    p_mossa: testoMossa,
    p_indice: indice,
  })
  if (error) throw error
  return daRiga(data)
}

export async function abbandonaPartita(partitaId, membroId) {
  const { data, error } = await supabase.rpc('abbandona_dama', {
    p_partita: partitaId,
    p_membro: membroId,
  })
  if (error) throw error
  return daRiga(data)
}

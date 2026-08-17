// La classifica è chiusa? Lo dice il database, non un file.
//
// ⚠️ La verità sta in `trips.punti_chiusi`, e questo file la legge — non
// la duplica. Scrivere «chiusa» anche in una costante qui dentro
// sembrerebbe più semplice e sarebbe la solita seconda risposta alla
// stessa domanda: il giorno che le due non coincidono, l'app mostra un
// gioco aperto sopra un database che rifiuta ogni punto, e nessuno
// riceve un errore.
//
// La chiusura vera vive dentro `assegna_punti`, che non scrive più
// niente. Questo serve solo a **non far premere tasti che non fanno
// niente**.

import { supabase } from './supabase.js'
import { conCache } from './cache.js'
import { VIAGGIO } from '../config/viaggio.js'

export const classificaChiusa = conCache('viaggio.chiuso', async function classificaChiusa() {
  const { data, error } = await supabase
    .from('trips')
    .select('punti_chiusi')
    .eq('id', VIAGGIO.id)
    .limit(1)
    .maybeSingle()

  if (error) throw error

  // ⚠️ Nessuna riga = non lo so, e allora si risponde «aperta».
  //
  // È il verso giusto in cui sbagliare: sbagliando qui si mostra un tasto
  // in più, e chi lo preme si sente dire di no dal database. Sbagliando al
  // contrario si direbbe a tutti che il gioco è finito perché una lettura
  // è andata storta.
  return data?.punti_chiusi === true
})

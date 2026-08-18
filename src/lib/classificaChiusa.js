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

  // ⚠️ Nessuna riga = **non lo so**, e non lo so non è «aperta»: si
  // solleva.
  //
  // Rispondere `false` sembrava prudente e ha prodotto il difetto peggiore
  // della serata. A porte chiuse questa lettura torna vuota per chi non è
  // ancora riconosciuto — e siccome `conCache` mette da parte ogni
  // risposta riuscita, quel «non è chiusa» finiva **in cache**: da lì in
  // poi chiunque chiedesse «è chiusa?» si sentiva rispondere di no, con
  // sicurezza, da una copia nata da una lettura che non aveva letto
  // niente. Il podio non è mai partito sui telefoni veri per questo.
  //
  // Sollevando invece non si mette via niente, e ogni chiamante decide da
  // sé — e tutti scelgono «aperta», che resta il verso giusto in cui
  // sbagliare: si mostra un tasto in più e il database risponde di no con
  // la sua frase.
  if (!data) throw new Error('Non riesco a leggere il viaggio.')
  return data.punti_chiusi === true
})

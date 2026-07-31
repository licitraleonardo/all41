import { PENALITA } from '../config/limiti.js'

// La scala delle penalità della Legge XIX.
//
// Va distinta l'impazienza dall'accanimento: un doppio tap o un po' di
// fretta non sono spam, e penalizzarli punirebbe il comportamento umano
// normale. Quindi i primi due rifiuti non costano niente, il terzo -1, e
// poi ogni tre ancora -1 fino a un tetto per blocco.
//
// Il contatore vive in memoria e non nel database di proposito: conta i
// tentativi *rifiutati*, che non lasciano nessuna riga. Si azzera al primo
// invio riuscito.
const rifiuti = new Map()

function chiave(memberId, tipo) {
  return `${memberId}:${tipo}`
}

export function azzeraInsistenza(memberId, tipo) {
  rifiuti.delete(chiave(memberId, tipo))
}

// Restituisce { tentativi, penalita } dove penalita è 0 oppure -1.
export function registraRifiuto(memberId, tipo) {
  const k = chiave(memberId, tipo)
  const tentativi = (rifiuti.get(k) ?? 0) + 1
  rifiuti.set(k, tentativi)

  const { primaPenalita, ogniQuanti, massimoPerBlocco } = PENALITA

  if (tentativi < primaPenalita) return { tentativi, penalita: 0 }
  if ((tentativi - primaPenalita) % ogniQuanti !== 0) return { tentativi, penalita: 0 }

  // Tetto: restare a martellare non può costare più di così.
  const giaDate = Math.floor((tentativi - primaPenalita) / ogniQuanti) + 1
  if (giaDate > massimoPerBlocco) return { tentativi, penalita: 0 }

  return { tentativi, penalita: -1, quante: giaDate }
}

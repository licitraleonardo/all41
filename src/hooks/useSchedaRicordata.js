import { useEffect, useState } from 'react'

// Ricaricare non deve buttarti fuori dalla sotto-scheda che stavi
// guardando: vale per il tab principale (App.jsx) e vale uguale per le
// schede dentro Gruppo, Gioco e Altro. Chi tira giù per aggiornare la
// classifica vuole la classifica, non "Oggi".
//
// sessionStorage e non localStorage, per la stessa ragione del tab
// principale: dura il tempo della scheda del browser. Domani si riparte
// dalla prima sotto-scheda, che è quella giusta a inizio giornata — e
// così ripristinare "testamento" non può spegnere pallini di non letto
// a freddo: se il valore è ancora vivo, il Testamento lo stavi
// guardando un attimo fa.
//
// Il valore letto si valida contro l'elenco degli id ammessi: se una
// sotto-scheda cambia nome fra un deploy e l'altro, il valore vecchio
// ricade sul predefinito invece di lasciare una schermata vuota.
export function useSchedaRicordata(chiave, predefinita, valide) {
  const [scheda, setScheda] = useState(() => {
    try {
      const salvata = sessionStorage.getItem(chiave)
      return valide.includes(salvata) ? salvata : predefinita
    } catch {
      return predefinita
    }
  })

  useEffect(() => {
    try {
      sessionStorage.setItem(chiave, scheda)
    } catch {
      // Safari in navigazione privata può rifiutare: pazienza.
    }
  }, [chiave, scheda])

  return [scheda, setScheda]
}

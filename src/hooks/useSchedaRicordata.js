import { useCallback, useSyncExternalStore } from 'react'
import { iscrivi, leggiStato, registraScheda, vaiA } from '../lib/navigazione.js'

// Ricaricare non deve buttarti fuori dalla sotto-scheda che stavi
// guardando: vale per il tab principale e vale uguale per le schede
// dentro Gruppo, Gioco, Altro e Testamento. Chi tira giù per aggiornare
// la classifica vuole la classifica, non "Oggi".
//
// ⚠️ Dal 9 agosto lo stato non vive più dentro ogni componente: sta in
// `lib/navigazione.js`, e ogni cambio lascia una voce nella cronologia
// del telefono. Serve al tasto indietro — che prima, da un tab, usciva
// dall'app invece di rifare la strada.
//
// **La firma è rimasta `[valore, setValore]`**, quindi chi lo usa non si
// è accorto di niente: è tutto il motivo per cui si è potuto fare in un
// punto solo invece che in cinque schermate.
//
// Il `sessionStorage` è rimasto dov'era, e non è un doppione: serve alla
// ricaricata, la cronologia serve al tasto indietro, e le due cose non si
// pestano. Dura il tempo della scheda del browser, così domani si riparte
// dalla prima sotto-scheda — che è quella giusta a inizio giornata, e
// così ripristinare "testamento" non può spegnere pallini di non letto a
// freddo.
//
// Il valore letto si valida contro l'elenco degli id ammessi: se una
// sotto-scheda cambia nome fra un deploy e l'altro, il valore vecchio
// ricade sul predefinito invece di lasciare una schermata vuota.
export function useSchedaRicordata(chiave, predefinita, valide) {
  // Prima di leggere: si dice al controllore che questa scheda esiste, e
  // quali valori accetta. Senza, la fotografia non saprebbe validarla al
  // ritorno dal tasto indietro.
  registraScheda(chiave, predefinita, valide)

  const stato = useSyncExternalStore(iscrivi, leggiStato, leggiStato)
  const scheda = stato.schede[chiave] ?? predefinita

  const cambia = useCallback((valore) => vaiA(chiave, valore), [chiave])

  return [scheda, cambia]
}

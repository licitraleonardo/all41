import { useCallback, useEffect, useState } from 'react'

// Quali Leggi e Trofei hai già letto, uno per uno.
//
// È un secondo meccanismo accanto a useNonLetto, non un'estensione:
// quello tiene una data per sezione e risponde a "c'è qualcosa di nuovo
// in Testamento?", questo tiene un insieme di id e risponde a "quale?".
// Il primo spegne il pallino sulla barra dei tab, il secondo quello
// sulla singola riga.
//
// ⚠️ La chiave è l'id della Legge, mai il numero romano né la posizione
// nell'elenco: l'etichetta si calcola dalla posizione, quindi bastava
// aggiungere un Trofeo in mezzo — ed è successo, quindici volte in un
// giorno — perché tutti i pallini si riaccendessero sulle voci
// sbagliate.
//
// Sta sul dispositivo e non sul database: "l'ho letto" è un fatto tuo e
// di questo telefono, e metterlo online vorrebbe dire una scrittura a
// ogni riga aperta, per otto persone, per una cosa che non deve essere
// d'accordo con nessuno.
function chiave(membroId) {
  return `all41.testamento.lette.${membroId}`
}

function leggi(membroId) {
  try {
    const grezzo = JSON.parse(localStorage.getItem(chiave(membroId)) ?? '[]')
    return new Set(Array.isArray(grezzo) ? grezzo : [])
  } catch {
    return new Set()
  }
}

export function useLetteTestamento(membroId) {
  const [lette, setLette] = useState(() => new Set())

  useEffect(() => {
    if (!membroId) return
    setLette(leggi(membroId))
  }, [membroId])

  const segnaLetta = useCallback(
    (leggeId) => {
      if (!membroId) return
      setLette((precedenti) => {
        if (precedenti.has(leggeId)) return precedenti
        const nuovo = new Set(precedenti).add(leggeId)
        try {
          localStorage.setItem(chiave(membroId), JSON.stringify([...nuovo]))
        } catch {
          // Navigazione privata: i pallini torneranno. Pazienza.
        }
        return nuovo
      })
    },
    [membroId]
  )

  return { lette, segnaLetta }
}

// Il trucco per spegnere il pallino guardando invece che toccando:
// IntersectionObserver. Dice quando una riga entra davvero nello
// schermo, e da lì si aspetta un attimo prima di darla per letta.
//
// L'attimo non è un vezzo: senza, scorrere veloce fino in fondo
// spegnerebbe tutti i pallini di volata, comprese le righe passate
// davanti agli occhi per un fotogramma. Mezzo secondo di permanenza è
// la differenza fra "l'ho vista" e "c'è passata davanti".
//
// ⚠️ Nel pannello di anteprima non scatta, come ResizeObserver: la
// scheda non compone fotogrammi. Non è un difetto del codice.
export function useSpegniGuardando(riferimento, attiva, quando) {
  useEffect(() => {
    const nodo = riferimento.current
    if (!nodo || !attiva) return undefined
    if (typeof IntersectionObserver !== 'function') {
      // Browser che non ce l'ha: si dà per letta e basta, meglio di un
      // pallino che non si spegne mai.
      quando()
      return undefined
    }

    let attesa = null
    const osserva = new IntersectionObserver(
      ([voce]) => {
        if (voce.isIntersecting) {
          attesa = setTimeout(quando, 500)
        } else if (attesa) {
          clearTimeout(attesa)
          attesa = null
        }
      },
      // Mezza riga dentro lo schermo basta: aspettare che entri tutta
      // vorrebbe dire non spegnere mai l'ultima quando è tagliata.
      { threshold: 0.5 }
    )

    osserva.observe(nodo)
    return () => {
      if (attesa) clearTimeout(attesa)
      osserva.disconnect()
    }
  }, [riferimento, attiva, quando])
}

// Quante ne hai scoperte senza averle ancora aperte. Le non scoperte NON
// contano: prese alla lettera resterebbero una ventina di pallini accesi
// per sempre sulle voci oscurate, che è il contrario di una notifica.
export function daLeggere(elenco, scoperte, lette) {
  return elenco.filter((l) => scoperte[l.id] && !lette.has(l.id)).length
}

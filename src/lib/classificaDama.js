import { BIANCO, esito, ricostruisci } from './dama.js'

// Com'è finita una partita, e chi ha battuto chi. Niente database: si
// rigioca la lista delle mosse, come per la scacchiera. Il vincitore non
// è salvato da nessuna parte — si ricava, come i saldi delle Spese.
//
// L'unica cosa che non si ricava è la resa, che infatti ha la sua
// colonna: una partita abbandonata può essere in qualunque posizione, e
// dalle mosse non si vede che qualcuno se n'è andato.
//
// ⚠️ **Uscire non registra la partita.** Non è finita, non l'ha vinta
// nessuno, non conta per niente.
//
// Fino al 10 agosto era il contrario: una abbandonata valeva come una
// vinta dall'altro. Da lì l'altro si prendeva la vittoria nel rank, e
// poteva prendersi anche il Trofeo della prima vittoria a dama e
// concorrere al campione di giornata — due Trofei veri, presi senza
// giocare. A chi era uscito restava il contatore delle mollate.
//
// ⚠️ Il buco, dichiarato: adesso chi sta perdendo può uscire e la
// partita non è mai esistita. Era quello che le mollate tenevano a bada.
// Se in viaggio diventa la mossa standard, si rimette il contatore — e
// il rank torna a dire la verità.
export function comeEFinita(partita) {
  if (partita.stato === 'abbandonata') {
    return { finita: false, vincitore: null, perdente: null, motivo: 'abbandono' }
  }

  const fine = esito(ricostruisci(partita.mosse))
  if (!fine.finita) return { finita: false, vincitore: null, perdente: null, motivo: null }
  if (fine.vincitore === null) {
    return { finita: true, vincitore: null, perdente: null, motivo: 'patta' }
  }

  const vincitore = fine.vincitore === BIANCO ? partita.bianco : partita.nero
  const perdente = vincitore === partita.bianco ? partita.nero : partita.bianco
  return { finita: true, vincitore, perdente, motivo: 'scacchiera' }
}

// La classifica della Dama: vinte, perse e patte per persona. Ordinata
// per vittorie, poi — a parità — per id più basso. L'ultimo criterio non
// è giusto, è deterministico: due telefoni devono stampare la stessa
// fila.
//
// ⚠️ Le abbandonate non entrano: `comeEFinita` le dà per non finite, e
// il ciclo qui sotto le salta come salta una partita ancora in corso.
export function classificaDama(partite, membriIds) {
  const conti = Object.fromEntries(
    membriIds.map((id) => [id, { id, vinte: 0, perse: 0, patte: 0 }])
  )

  for (const p of partite) {
    const fine = comeEFinita(p)
    if (!fine.finita) continue

    if (fine.motivo === 'patta') {
      if (conti[p.bianco]) conti[p.bianco].patte += 1
      if (conti[p.nero]) conti[p.nero].patte += 1
      continue
    }

    if (conti[fine.vincitore]) conti[fine.vincitore].vinte += 1
    if (conti[fine.perdente]) conti[fine.perdente].perse += 1
  }

  return Object.values(conti).sort(
    (a, b) => b.vinte - a.vinte || a.id.localeCompare(b.id)
  )
}

// Chi ha vinto più partite in una giornata. Restituisce null se non ha
// vinto nessuno o se sono in parità in cima: come per le sfide, in
// pareggio non vince nessuno — un titolo diviso in due non è un titolo.
export function campioneDelGiorno(partite, membriIds, giorno) {
  const diQuelGiorno = partite.filter((p) => (p.creataIl ?? '').slice(0, 10) === giorno)
  const classifica = classificaDama(diQuelGiorno, membriIds)
  const primo = classifica[0]
  if (!primo || primo.vinte === 0) return null
  const secondo = classifica[1]
  if (secondo && secondo.vinte === primo.vinte) return null
  return primo.id
}

// Le partite ancora aperte fra quelle che ti riguardano, con l'avviso di
// chi deve muovere. Serve a mettere in evidenza quello che ti aspetta.
// ⚠️ «Non finita» e «ancora da giocare» hanno smesso di essere la stessa
// cosa, e la differenza va detta.
//
// Da quando uscire non registra la partita, un'abbandonata risulta non
// finita — ed e' giusto, non l'ha vinta nessuno. Ma non e' nemmeno
// giocabile: chi e' uscito e' uscito. Senza questa distinzione le
// abbandonate tornavano nell'elenco delle partite aperte, con la
// scacchiera e il turno, come se non fosse successo niente. L'ha preso
// `prove/dama-classifica.mjs` appena cambiata la regola.
export function ancoraDaGiocare(partita) {
  if (partita.stato === 'abbandonata') return false
  return !comeEFinita(partita).finita
}

export function inCorsoPerMe(partite, ioId) {
  return partite
    .filter((p) => p.bianco === ioId || p.nero === ioId)
    .filter(ancoraDaGiocare)
    .map((p) => {
      const stato = ricostruisci(p.mosse)
      const toccaId = stato.turno === BIANCO ? p.bianco : p.nero
      return { ...p, toccaA: toccaId, tuaMossa: toccaId === ioId }
    })
}

// Una sfida ancora da accettare: sei il nero — cioè non l'hai aperta tu
// — e TU non hai ancora mosso. Da lì in poi è una partita come le altre.
//
// ⚠️ Il conto è sulle mosse tue, non su quelle della partita. Chi sfida è
// il bianco e muove per primo: contando "nessuno ha ancora mosso"
// l'invito spariva nell'istante in cui l'altro apriva il gioco, che è la
// cosa più naturale del mondo da fare dopo aver lanciato una sfida — e
// chi era stato sfidato non riceveva più niente. Sotto le due mosse il
// nero non ha ancora toccato la scacchiera.
export function sfideDaAccettare(partite, ioId) {
  return partite.filter(
    (p) => p.stato === 'in-corso' && p.nero === ioId && (p.mosse?.length ?? 0) < 2
  )
}

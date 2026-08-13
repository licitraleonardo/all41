// La caccia al tesoro si decide dopo il viaggio.
//
// Durante i cinque giorni si raccolgono foto e basta: nessun vincitore,
// nessun punto. Il telefono in vacanza si guarda tre volte al giorno, e
// una gara che si chiude a mezzanotte la vince chi era sveglio, non chi
// ha fatto la foto migliore.
//
// Il 17 si aprono le votazioni su tutto quello che ha almeno due foto in
// gara. Il 20 si chiude: chi ha vinto più sfide prende il premio, uno
// solo. Niente Supabase qui dentro — da queste funzioni escono dei
// punti, quindi si provano da riga di comando.

import { CACCIA, SFIDE, SFIDE_PER_ID } from '../config/sfide.js'

const competitive = () => SFIDE.filter((s) => s.tipo === 'competitiva')

// ⚠️ Si vota dal primo giorno, non dal 17.
//
// La regola di prima -- si raccoglie e basta, si vota a rientro fatto --
// nasceva da un timore giusto: «una gara che si chiude a mezzanotte la
// vince chi era sveglio, non chi ha fatto la foto migliore». Ma alla
// prova dei fatti il costo era più alto del rischio: mandi la foto per
// una sfida e per cinque giorni non succede niente, quindi la sfida non
// sembra un gioco, sembra un modulo.
//
// Il timore resta vero e si risolve altrove: il voto adesso **si può
// cambiare** finché la sfida è aperta (`supabase/voto-che-si-cambia.sql`),
// quindi chi vota il primo giorno non resta incastrato sull'unica foto
// che c'era.
export function votiAperti() {
  return true
}

// ⚠️ `>` e non `>=`: `CACCIA.chiude` è **l'ultimo giorno in cui si vota**,
// non il primo in cui non si vota più.
//
// Con `>=` il 20 la caccia risultava chiusa già a mezzanotte, mentre i
// bottoni per votare restavano accesi tutto il giorno: chi votava il 20
// vedeva il numero salire e non cambiava niente. Le sfide venivano
// assegnate coi conteggi di ventiquattr'ore prima, e il premio finale da
// dieci punti — chiave `caccia-finale`, senza data, uno per viaggio —
// andava a chi era in testa a mezzanotte. L'ultimo dei tre giorni di voto
// non contava niente.
export function cacciaChiusa(oggi) {
  return oggi > CACCIA.chiude
}

// Le sfide che hanno una gara vera e aspettano solo che si apra il voto.
export function sfideDaMettereAiVoti(partecipazioni, vinte, voti, oggi) {
  if (!votiAperti(oggi)) return []

  return competitive()
    .filter((s) => !vinte[s.id] && !voti[s.id])
    // ⚠️ Una foto basta, non due.
    //
    // Con due, una sfida a cui aveva risposto una persona sola restava
    // invisibile fino a che non ne arrivava un'altra -- e spesso non
    // arrivava. Con una, il voto si apre subito e le foto che vengono
    // dopo si aggiungono alle opzioni: `assicura_voto_sfida` lo fa già.
    .filter((s) => (partecipazioni[s.id] ?? []).length >= 1)
    .map((s) => s.id)
}

// Il vincitore di un voto: la foto più votata. In pareggio, o senza
// nemmeno un voto, non vince nessuno — assegnare a caso è peggio che non
// assegnare, e a fine viaggio ci si ricorda dell'errore.
export function vincitoreDelVoto(voto, foto) {
  if (!voto || !voto.conteggi || voto.conteggi.length === 0) return null

  const massimo = Math.max(...voto.conteggi)
  if (massimo <= 0) return null
  if (voto.conteggi.filter((n) => n === massimo).length !== 1) return null

  const fotoId = voto.fotoIds[voto.conteggi.indexOf(massimo)]
  const scattata = foto.find((f) => f.id === fotoId)
  return scattata ? { fotoId, membroId: scattata.autoreId } : null
}

// Cosa c'è da chiudere quando la caccia finisce.
//
// `motivo` distingue i due casi perché pagano in modo diverso: chi vince
// una gara non prende niente di suo (conta solo per il premio finale),
// chi è rimasto solo scopre una Legge e prende i suoi punti.
export function chiusureDaFare(partecipazioni, vinte, voti, oggi) {
  if (!cacciaChiusa(oggi)) return []

  const chiusure = []

  for (const sfida of competitive()) {
    if (vinte[sfida.id]) continue

    const foto = partecipazioni[sfida.id] ?? []
    if (foto.length === 0) continue

    if (foto.length === 1) {
      chiusure.push({
        sfidaId: sfida.id,
        fotoId: foto[0].id,
        membroId: foto[0].autoreId,
        motivo: 'solitario',
      })
      continue
    }

    const vincitore = vincitoreDelVoto(voti[sfida.id], foto)
    if (vincitore) chiusure.push({ sfidaId: sfida.id, ...vincitore, motivo: 'voto' })
  }

  return chiusure
}

// Quante sfide ha vinto ognuno. La collettiva resta fuori: l'hanno
// vinta tutti insieme, contarla darebbe un punto a chi l'ha chiusa per
// caso.
export function sfideVintePerPersona(vinte) {
  const conto = {}

  for (const [sfidaId, esito] of Object.entries(vinte)) {
    if (SFIDE_PER_ID[sfidaId]?.tipo !== 'competitiva') continue
    if (!esito?.membroId) continue
    conto[esito.membroId] = (conto[esito.membroId] ?? 0) + 1
  }

  return conto
}

// Il premio, uno solo. In pareggio non lo prende nessuno.
export function vincitoreDellaCaccia(vinte) {
  const conto = sfideVintePerPersona(vinte)
  const quanti = Object.values(conto)
  if (quanti.length === 0) return null

  const massimo = Math.max(...quanti)
  const primi = Object.keys(conto).filter((id) => conto[id] === massimo)
  if (primi.length !== 1) return null

  return { membroId: primi[0], sfide: massimo }
}

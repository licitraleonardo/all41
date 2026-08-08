import { faiScattareLegge } from './punti.js'
import { campioneDelGiorno, comeEFinita } from './classificaDama.js'
import { dataDiOggi } from './giorni.js'

// I punti della Dama. La decisione di chi ha vinto sta in
// classificaDama.js, pura e provata: qui si traduce in scritture.
//
// Quasi tutto il punteggio passa dal titolo di giornata e non dalla
// singola vittoria. Con le partite a raffica dopo cena, pagare ogni
// vittoria vorrebbe dire che il viaggio lo vince chi gioca di più — è
// lo stesso difetto che l'Impostore ha già e che non va ripetuto.

// La prima vittoria in assoluto: una volta per persona, per tutto il
// viaggio. La chiave non ha la data apposta.
export async function dopoUnaVittoria(vincitoreId) {
  return faiScattareLegge(
    'dama-prima-vittoria',
    vincitoreId,
    `dama-prima-vittoria_${vincitoreId}`
  ).catch(() => null)
}

// Chi molla lascia l'altro davanti a una scacchiera ferma. Una volta al
// giorno: una serataccia non deve diventare una voragine.
export async function dopoUnAbbandono(membroId, adesso = new Date()) {
  return faiScattareLegge(
    'dama-abbandonata',
    membroId,
    `dama-abbandonata_${membroId}_${dataDiOggi(adesso)}`
  ).catch(() => null)
}

// Il titolo di giornata, assegnato alla prima apertura del giorno dopo —
// stesso schema del record della Pecora e dell'MVP. Nessuno è sveglio a
// mezzanotte a chiudere la giornata: la chiude chi apre l'app.
//
// Si guardano solo i giorni già finiti: quello in corso può ancora
// cambiare, e un titolo assegnato alle 21:00 sarebbe sbagliato alle 23.
export async function risolviDama(partite, membriIds, adesso = new Date()) {
  const oggi = dataDiOggi(adesso)
  const giorni = [
    ...new Set(partite.map((p) => (p.creataIl ?? '').slice(0, 10)).filter(Boolean)),
  ].filter((g) => g < oggi)

  const assegnati = []
  for (const giorno of giorni) {
    const campione = campioneDelGiorno(partite, membriIds, giorno)
    if (!campione) continue
    const esito = await faiScattareLegge(
      'dama-campione',
      campione,
      `dama-campione_${giorno}`
    ).catch(() => null)
    if (esito) assegnati.push({ giorno, membroId: campione })
  }
  return assegnati
}

// Quante partite finite ci sono già per questa persona: serve a sapere
// se quella appena vinta è la prima. Si guarda dalle partite in mano al
// telefono, senza chiedere niente in più al database.
export function eLaPrimaVittoria(partite, membroId, partitaAppenaFinita) {
  const altre = partite.filter((p) => p.id !== partitaAppenaFinita?.id)
  return !altre.some((p) => comeEFinita(p).vincitore === membroId)
}

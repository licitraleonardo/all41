import { METEO } from '../config/meteo.js'

const CHIAVE = 'all41.meteo'

// Open-Meteo: gratuita, senza chiave, senza registrazione. Si chiedono
// solo i tre dati che servono a decidere qualcosa — massima, vento e
// condizione — e non un bollettino intero.
function indirizzo(lat, lng, giorni) {
  const p = new URLSearchParams({
    latitude: lat,
    longitude: lng,
    daily: 'weather_code,temperature_2m_max,wind_speed_10m_max',
    timezone: 'Europe/Rome',
    forecast_days: String(giorni),
  })
  return `https://api.open-meteo.com/v1/forecast?${p}`
}

function daCache() {
  try {
    const grezzo = JSON.parse(localStorage.getItem(CHIAVE) ?? 'null')
    if (!grezzo) return null
    if (Date.now() - grezzo.quando > METEO.oreDiCache * 3600000) return null
    return grezzo.dati
  } catch {
    return null
  }
}

function inCache(dati) {
  try {
    localStorage.setItem(CHIAVE, JSON.stringify({ quando: Date.now(), dati }))
  } catch {
    // Se non si può salvare pazienza: si richiederà.
  }
}

// Restituisce { '2026-08-14': { gradi, vento, codice } }.
//
// Una chiamata per coordinata, e le coordinate sono al massimo due:
// quella di oggi e quella di domani. Sotto l'ombrellone con una tacca
// ogni richiesta in meno conta.
export async function leggiMeteo(tappe, giorni = 16) {
  const salvato = daCache()
  if (salvato) return salvato

  const perCoordinata = new Map()
  for (const t of tappe) {
    const chiave = `${t.coordinate.lat},${t.coordinate.lng}`
    if (!perCoordinata.has(chiave)) perCoordinata.set(chiave, { ...t.coordinate, date: [] })
    perCoordinata.get(chiave).date.push(t.data)
  }

  const risposte = await Promise.all(
    [...perCoordinata.values()].map(async (c) => {
      const r = await fetch(indirizzo(c.lat, c.lng, giorni))
      if (!r.ok) throw new Error(`meteo: HTTP ${r.status}`)
      return { c, dati: await r.json() }
    })
  )

  const per = {}
  for (const { c, dati } of risposte) {
    for (const data of c.date) {
      const i = dati.daily?.time?.indexOf(data)
      if (i === undefined || i < 0) continue
      per[data] = {
        gradi: Math.round(dati.daily.temperature_2m_max[i]),
        vento: Math.round(dati.daily.wind_speed_10m_max[i]),
        codice: dati.daily.weather_code[i],
      }
    }
  }

  inCache(per)
  return per
}

import { supabase } from './supabase.js'
import { conCache } from './cache.js'
import { VIAGGIO } from '../config/viaggio.js'

// La posizione si condivide con un gesto esplicito e non si aggiorna mai
// da sola: quello che finisce qui dentro è "l'ultima volta che ho detto
// dov'ero", non un tracciamento. È la differenza fra una comodità e una
// cosa che nessuno vuole addosso.

export const leggiPosizioni = conCache('posizioni', async function leggiPosizioni() {
  const { data, error } = await supabase
    .from('members')
    .select('id, name, avatar_seed, avatar_style, last_known_location')
    .eq('trip_id', VIAGGIO.id)
    .limit(50)

  if (error) throw error

  return data
    .filter((r) => r.last_known_location?.lat != null)
    .map((r) => ({
      id: r.id,
      nome: r.name,
      avatarSeed: r.avatar_seed,
      avatarStyle: r.avatar_style,
      lat: r.last_known_location.lat,
      lng: r.last_known_location.lng,
      quando: r.last_known_location.updatedAt ?? null,
    }))
})

export async function condividiPosizione(membroId, { lat, lng }) {
  const posizione = {
    // Cinque decimali sono circa un metro: più di così è precisione che
    // non serve a nessuno e dice più di quanto si voglia dire.
    lat: Number(lat.toFixed(5)),
    lng: Number(lng.toFixed(5)),
    updatedAt: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('members')
    .update({ last_known_location: posizione })
    .eq('id', membroId)

  if (error) throw error
  return posizione
}

export async function smettiDiCondividere(membroId) {
  const { error } = await supabase
    .from('members')
    .update({ last_known_location: null })
    .eq('id', membroId)

  if (error) throw error
}

// Il permesso lo chiede il browser, e su iOS solo in contesto sicuro.
// I messaggi dicono cosa fare, non il codice dell'errore.
export function chiediPosizione() {
  return new Promise((risolvi, rifiuta) => {
    if (!navigator.geolocation) {
      rifiuta(new Error('Questo telefono non sa dire dov’è.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (p) => risolvi({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => {
        if (e.code === 1) {
          rifiuta(
            new Error('Hai detto di no al permesso. Si cambia nelle impostazioni del browser.')
          )
        } else if (e.code === 3) {
          rifiuta(new Error('Ci ha messo troppo. Riprova all’aperto.'))
        } else {
          rifiuta(new Error('Non riesce a capire dove sei.'))
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    )
  })
}

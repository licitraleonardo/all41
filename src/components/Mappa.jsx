import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './Mappa.css'
import { urlAvatar } from '../config/avatar.js'

// Un solo componente mappa, come chiede lo spec: prende dei punti e li
// disegna, senza sapere se sono le persone del gruppo o le tappe
// dell'itinerario. Due implementazioni separate sarebbero due cose da
// tenere allineate per sempre.
//
// Le mattonelle arrivano da OpenStreetMap, quindi senza rete la mappa
// resta grigia: è l'unica parte dell'app che offline non ha niente da
// mostrare, e la schermata lo dice invece di lasciare un buco.
export default function Mappa({ punti = [], centro, zoom = 13, altezza = 340 }) {
  const contenitore = useRef(null)
  const mappa = useRef(null)
  const marcatori = useRef(new Map())

  // La mappa si crea una volta sola: ricrearla a ogni aggiornamento dei
  // punti perderebbe lo zoom e la posizione appena scelti a dito.
  useEffect(() => {
    if (!contenitore.current || mappa.current) return undefined

    const creata = L.map(contenitore.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([centro?.lat ?? 39.2257, centro?.lng ?? 9.2049], zoom)

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(creata)

    mappa.current = creata
    // I riferimenti si copiano qui: alla pulizia `.current` potrebbe già
    // puntare altrove, e si finirebbe a smontare la mappa sbagliata.
    const elenco = marcatori.current

    return () => {
      creata.remove()
      mappa.current = null
      elenco.clear()
    }
  }, [centro?.lat, centro?.lng, zoom])

  // I marcatori si aggiornano al volo invece di essere ridisegnati: chi
  // sta guardando la mappa non deve vederla sfarfallare ogni volta che
  // qualcuno condivide la sua posizione.
  useEffect(() => {
    const m = mappa.current
    if (!m) return

    const vivi = new Set(punti.map((p) => p.id))

    for (const [id, marcatore] of marcatori.current) {
      if (!vivi.has(id)) {
        marcatore.remove()
        marcatori.current.delete(id)
      }
    }

    for (const p of punti) {
      const esistente = marcatori.current.get(p.id)
      if (esistente) {
        esistente.setLatLng([p.lat, p.lng])
        continue
      }

      const icona = L.divIcon({
        className: 'marcatore',
        html: `<img src="${urlAvatar(p.avatarStyle, p.avatarSeed || p.nome)}" alt="" /><span>${escapa(p.nome)}</span>`,
        iconSize: [44, 56],
        iconAnchor: [22, 50],
      })

      marcatori.current.set(p.id, L.marker([p.lat, p.lng], { icon: icona }).addTo(m))
    }

    // Si inquadra tutto quello che c'è, ma solo la prima volta che
    // arrivano dei punti: dopo comanda il dito.
    if (punti.length > 0 && !m._inquadrata) {
      m._inquadrata = true
      const bordi = L.latLngBounds(punti.map((p) => [p.lat, p.lng]))
      m.fitBounds(bordi, { padding: [40, 40], maxZoom: 15 })
    }
  }, [punti])

  return <div className="mappa" style={{ height: `${altezza}px` }} ref={contenitore} />
}

// Il nome finisce dentro dell'HTML costruito a mano: senza questo, uno
// che si chiama <b> romperebbe il marcatore.
function escapa(testo) {
  return String(testo ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

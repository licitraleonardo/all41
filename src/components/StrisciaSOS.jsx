import { useEffect, useState } from 'react'
import './StrisciaSOS.css'
import { eliminaAzione, leggiSosAperti } from '../lib/azioni.js'
import { supabase } from '../lib/supabase.js'

// Gli SOS aperti, inchiodati in cima alla chat finché qualcuno non dice
// che è rientrato.
//
// Prima l'SOS era una riga del feed come le altre, e il feed tiene
// trenta righe: quello delle 18 cadeva fuori entro un'ora di messaggi
// sulla cena, e chi apriva l'app alle 19 non lo vedeva proprio.
//
// "Rientrato" lo può premere chiunque, non solo chi l'ha mandato: chi si
// è perso ha il telefono in mano per orientarsi, non per chiudere
// cartelli, e spesso è un altro ad averlo trovato. Stesso principio del
// turno dell'Impostore, che può far avanzare chiunque.
export default function StrisciaSOS({ nome }) {
  const [aperti, setAperti] = useState([])
  const [inCorso, setInCorso] = useState(null)

  useEffect(() => {
    let vivo = true
    const carica = () =>
      leggiSosAperti()
        .then((elenco) => vivo && setAperti(elenco))
        .catch(() => {})

    carica()

    // Un SOS mandato da un altro telefono deve comparire qui subito: è
    // il caso in cui il ritardo pesa di più.
    const canale = supabase
      .channel('sos-aperti')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quick_actions' }, () =>
        carica()
      )
      .subscribe()

    return () => {
      vivo = false
      supabase.removeChannel(canale)
    }
  }, [])

  if (aperti.length === 0) return null

  async function rientrato(id) {
    setInCorso(id)
    try {
      await eliminaAzione(id)
      setAperti((precedenti) => precedenti.filter((a) => a.id !== id))
    } catch {
      // Resta lì: meglio un cartello di troppo che uno di meno.
    } finally {
      setInCorso(null)
    }
  }

  return (
    <div className="sos-aperti">
      {aperti.map((a) => (
        <div key={a.id} className="sos-aperto" role="alert">
          <div className="sos-aperto-testo">
            <strong>{nome(a.autoreId)}</strong> ha chiesto aiuto
            <span>{a.payload?.motivo ?? 'Serve una mano'}</span>
          </div>
          <button
            type="button"
            className="sos-rientrato"
            onClick={() => rientrato(a.id)}
            disabled={inCorso === a.id}
          >
            {inCorso === a.id ? '…' : 'Rientrato'}
          </button>
        </div>
      ))}
    </div>
  )
}

import { useEffect, useState } from 'react'
import './Altro.css'
import { useSchedaRicordata } from '../hooks/useSchedaRicordata.js'
import NuvolettaAllan, { nuvolettaGiaVista } from './NuvolettaAllan.jsx'
import Spese from './Spese.jsx'
import Documenti from './Documenti.jsx'
import Posizioni from './Posizioni.jsx'
import Guida from './Guida.jsx'
import Statistiche from './Statistiche.jsx'
import Info from './Info.jsx'

// Il quinto tab dello spec. Ci vive il materiale di consultazione: roba
// che serve in un momento preciso e poi non si guarda più, e che in
// "Oggi" occuperebbe spazio nella schermata più usata della giornata.
//
// Il tab si chiamava "Spese" finché conteneva solo quelle: un tab
// chiamato "Altro" con dentro una cosa sola non dice niente a nessuno.
// Adesso ne contiene due, quindi ha il nome dello spec. Mappa e Info
// entreranno qui.
const SCHEDE = [
  ['spese', 'Spese'],
  ['documenti', 'Documenti'],
  ['mappa', 'Mappa'],
  ['stat', 'Stat.'],
  // La guida vive qui perche' e' consultazione: si guarda una volta, poi
  // solo quando qualcuno chiede "ma come si fa a...".
  ['guida', 'Guida'],
  ['info', 'Info'],
]

export default function Altro({ membro }) {
  const [vista, setVista] = useSchedaRicordata(
    'scheda.altro',
    'spese',
    SCHEDE.map(([id]) => id)
  )

  // Le sotto-voci parlano solo dopo che si è chiuso il messaggio del
  // tab: al primo ingresso si atterra su Spese, e due fumetti
  // sovrapposti sono un muro invece che una guida.
  const [altroGiaVisto, setAltroGiaVisto] = useState(false)
  useEffect(() => {
    if (!membro?.id) return undefined
    const guarda = () => setAltroGiaVisto(nuvolettaGiaVista(membro.id, 'altro'))
    guarda()
    // Il messaggio del tab si chiude con un tocco dentro la nuvoletta, e
    // da fuori non arriva nessun evento: si ricontrolla a intervalli
    // finché non è chiuso. Costa una lettura di localStorage.
    const battito = setInterval(guarda, 400)
    return () => clearInterval(battito)
  }, [membro?.id])

  return (
    <div className="altro-schermo">
      {/* Il messaggio del tab, e poi una voce per sotto-sezione come in
          Gruppo, Foto e Gioco. Erano in fila automatica come chiedeva lo
          spec, ma alla prova sono cinque cartelli uno dietro l'altro
          appena entri, e si leggono come un muro. */}
      <NuvolettaAllan membroId={membro?.id} passo="altro" />
      {altroGiaVisto && <NuvolettaAllan membroId={membro?.id} passo={`altro.${vista}`} />}

      <div className="segmenti" role="tablist">
        {SCHEDE.map(([id, etichetta]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={vista === id}
            className={vista === id ? 'segmento attivo' : 'segmento'}
            onClick={() => setVista(id)}
          >
            {etichetta}
          </button>
        ))}
      </div>

      {vista === 'spese' && <Spese membro={membro} senzaCornice />}
      {vista === 'documenti' && <Documenti membro={membro} />}
      {vista === 'mappa' && <Posizioni membro={membro} />}
      {vista === 'stat' && <Statistiche membro={membro} />}
      {vista === 'guida' && <Guida membroId={membro?.id} />}
      {vista === 'info' && <Info />}
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import './App.css'
import { supabaseConfigurato, assicuraSessione } from './lib/supabase.js'
import {
  aggiornaMembro,
  creaMembro,
  segnaVisita,
  trovaPerCodice,
  trovaPerId,
} from './lib/membri.js'
import { dimenticaMemberId, memberIdSalvato, salvaMemberId } from './lib/sessione.js'
import { descriviErrore } from './lib/errori.js'
import Onboarding from './components/Onboarding.jsx'
import Recupero from './components/Recupero.jsx'
import CodiceNuovo from './components/CodiceNuovo.jsx'
import Profilo from './components/Profilo.jsx'
import ModificaProfilo from './components/ModificaProfilo.jsx'
import Itinerario from './components/Itinerario.jsx'
import ChatRapida from './components/ChatRapida.jsx'
import BarraTab from './components/BarraTab.jsx'

// Iniettati a build time da vite.config.js — servono a capire quale deploy
// si sta guardando.
const commit = __COMMIT__
const buildTime = __BUILD_TIME__

export default function App() {
  const [vista, setVista] = useState('avvio')
  const [tab, setTab] = useState('oggi')
  const [membro, setMembro] = useState(null)
  const [errore, setErrore] = useState(null)
  const [inCorso, setInCorso] = useState(false)

  useEffect(() => {
    if (!supabaseConfigurato) {
      setVista('nonConfigurato')
      return
    }

    let annullato = false

    async function avvia() {
      try {
        await assicuraSessione()

        const id = memberIdSalvato()
        if (!id) {
          if (!annullato) setVista('onboarding')
          return
        }

        const trovato = await trovaPerId(id)
        if (annullato) return

        if (!trovato) {
          // Profilo cancellato dal database: si riparte da capo.
          dimenticaMemberId()
          setVista('onboarding')
          return
        }

        setMembro(trovato)
        setVista('dentro')
        segnaVisita(trovato.id).catch(() => {})
      } catch (e) {
        if (annullato) return
        setErrore(descriviErrore(e))
        setVista('guasto')
      }
    }

    avvia()
    return () => {
      annullato = true
    }
  }, [])

  const entra = useCallback(async ({ nome, avatarStyle }) => {
    setInCorso(true)
    setErrore(null)
    try {
      const nuovo = await creaMembro({ nome, avatarStyle })
      salvaMemberId(nuovo.id)
      setMembro(nuovo)
      setVista('codice')
    } catch (e) {
      setErrore(descriviErrore(e))
    } finally {
      setInCorso(false)
    }
  }, [])

  const recupera = useCallback(async (codice) => {
    setInCorso(true)
    setErrore(null)
    try {
      const trovato = await trovaPerCodice(codice)
      if (!trovato) {
        setErrore('Non ti trovo. Controlla il codice.')
        return
      }
      salvaMemberId(trovato.id)
      setMembro(trovato)
      setVista('dentro')
      segnaVisita(trovato.id).catch(() => {})
    } catch (e) {
      setErrore(descriviErrore(e))
    } finally {
      setInCorso(false)
    }
  }, [])

  const salvaModifiche = useCallback(
    async ({ nome, avatarStyle }) => {
      setInCorso(true)
      setErrore(null)
      try {
        const aggiornato = await aggiornaMembro(membro.id, { nome, avatarStyle })
        setMembro(aggiornato)
        setVista('profilo')
      } catch (e) {
        setErrore(descriviErrore(e))
      } finally {
        setInCorso(false)
      }
    },
    [membro]
  )

  const esci = useCallback(() => {
    dimenticaMemberId()
    setMembro(null)
    setErrore(null)
    setVista('onboarding')
  }, [])

  function vaiA(prossima) {
    setErrore(null)
    setVista(prossima)
  }

  // L'app vera è a tutta pagina e su fondo chiaro: sta fuori dal
  // contenitore centrato e scuro delle schermate d'ingresso.
  if (vista === 'dentro') {
    return (
      <>
        {tab === 'oggi' ? (
          <Itinerario membro={membro} onProfilo={() => vaiA('profilo')} />
        ) : (
          <ChatRapida membro={membro} />
        )}
        <BarraTab attivo={tab} onCambia={setTab} />
      </>
    )
  }

  return (
    <main className="schermata">
      {vista === 'avvio' && <p className="allan">Un attimo.</p>}

      {vista === 'nonConfigurato' && <NonConfigurato />}

      {vista === 'guasto' && (
        <div className="pannello">
          <h1 className="titolo">Non funziona</h1>
          <p className="errore">{errore}</p>
          <button
            type="button"
            className="primario"
            onClick={() => window.location.reload()}
          >
            Riprova
          </button>
        </div>
      )}

      {vista === 'onboarding' && (
        <Onboarding
          onEntra={entra}
          onRecupera={() => vaiA('recupero')}
          inCorso={inCorso}
          errore={errore}
        />
      )}

      {vista === 'recupero' && (
        <Recupero
          onRecupera={recupera}
          onIndietro={() => vaiA('onboarding')}
          inCorso={inCorso}
          errore={errore}
        />
      )}

      {vista === 'codice' && (
        <CodiceNuovo membro={membro} onAvanti={() => vaiA('dentro')} />
      )}

      {vista === 'profilo' && (
        <Profilo
          membro={membro}
          onModifica={() => vaiA('modifica')}
          onEsci={esci}
          onIndietro={() => vaiA('dentro')}
        />
      )}

      {vista === 'modifica' && (
        <ModificaProfilo
          membro={membro}
          onSalva={salvaModifiche}
          onAnnulla={() => vaiA('profilo')}
          inCorso={inCorso}
          errore={errore}
        />
      )}

      <footer className="targhetta">
        {commit} · {buildTime}
      </footer>
    </main>
  )
}

function NonConfigurato() {
  return (
    <div className="pannello">
      <h1 className="titolo">Manca la configurazione</h1>
      <p className="allan">
        Non ho le chiavi di Supabase, quindi non posso fare niente.
      </p>
      <p className="istruzioni">
        Servono <code>VITE_SUPABASE_URL</code> e{' '}
        <code>VITE_SUPABASE_ANON_KEY</code>: in locale nel file{' '}
        <code>.env.local</code>, sul deploy nelle Environment Variables di
        Vercel.
      </p>
    </div>
  )
}


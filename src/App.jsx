import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { supabaseConfigurato, assicuraSessione } from './lib/supabase.js'
import {
  aggiornaMembro,
  creaMembro,
  segnaVisita,
  trovaPerCodice,
  trovaPerId,
  leggiMembri,
} from './lib/membri.js'
import { dimenticaMemberId, memberIdSalvato, salvaMemberId } from './lib/sessione.js'
import { descriviErrore } from './lib/errori.js'
import { chiudiScaduti } from './lib/voti.js'
import { risolviProposte } from './lib/proposte.js'
import { forseSottoZero } from './lib/regole.js'
import { leggiRecordPecora, risolviRecordPecora } from './lib/recordPecora.js'
import Onboarding from './components/Onboarding.jsx'
import Recupero from './components/Recupero.jsx'
import CodiceNuovo from './components/CodiceNuovo.jsx'
import Profilo from './components/Profilo.jsx'
import ModificaProfilo from './components/ModificaProfilo.jsx'
import Itinerario from './components/Itinerario.jsx'
import ChatRapida from './components/ChatRapida.jsx'
import Album from './components/Album.jsx'
import Gioco from './components/Gioco.jsx'
import Spese from './components/Spese.jsx'
import BarraTab from './components/BarraTab.jsx'
import { useSoundboard } from './hooks/useSoundboard.js'
import { useScoperte } from './hooks/useScoperte.js'
import { useProposteAperte } from './hooks/useProposteAperte.js'
import { useConnessione } from './hooks/useConnessione.js'
import Celebrazione from './components/Celebrazione.jsx'
import BannerProposta from './components/BannerProposta.jsx'
import StrisciaOffline from './components/StrisciaOffline.jsx'
import Pecora from './components/Pecora.jsx'

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

  // Sta qui e non nella Chat Rapida: il suono lanciato da un altro deve
  // sentirsi qualunque tab sia aperta.
  const { disponibili: suoniDisponibili } = useSoundboard(membro?.id)

  // Una Legge scoperta si celebra su tutti i telefoni, qualunque tab sia
  // aperta: è il momento di paga di tutto il sistema di punti.
  const { celebrazione, chiudi: chiudiCelebrazione } = useScoperte(vista === 'dentro')

  // Quando torna il segnale si riprova da soli: chi era offline non deve
  // accorgersi del momento giusto per premere un bottone.
  const inLinea = useConnessione()
  const eraOffline = useRef(false)

  useEffect(() => {
    if (!inLinea) {
      eraOffline.current = true
      return
    }
    if (eraOffline.current && vista === 'guasto') {
      eraOffline.current = false
      window.location.reload()
    }
  }, [inLinea, vista])

  // Le proposte aperte vivono qui e non dentro una scheda: il banner deve
  // raggiungerti su qualunque tab, come la celebrazione delle Leggi.
  const proposte = useProposteAperte(vista === 'dentro' ? membro?.id : null)
  const [membriPerId, setMembriPerId] = useState({})

  useEffect(() => {
    if (vista !== 'dentro') return
    leggiMembri()
      .then((elenco) => setMembriPerId(Object.fromEntries(elenco.map((m) => [m.id, m]))))
      .catch(() => {})
  }, [vista])

  useEffect(() => {
    if (!supabaseConfigurato) {
      setVista('nonConfigurato')
      return
    }

    let annullato = false

    async function avvia() {
      try {
        // Senza rete la sessione anonima non si può creare, e non è un
        // motivo per restare fuori: se il profilo è già stato letto una
        // volta, da qui in poi si va avanti con le copie locali.
        try {
          await assicuraSessione()
        } catch (e) {
          if (navigator.onLine !== false) throw e
        }

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

        // Senza un server, un sondaggio scaduto alle 23:59 mentre tutti
        // dormono resterebbe appeso per sempre: lo chiude chi apre l'app.
        chiudiScaduti().catch(() => {})

        // Le proposte scadute vanno anche applicate, non solo chiuse: i
        // punti in attesa entrano in classifica o vengono respinti.
        leggiMembri()
          .then(async (elenco) => {
            await risolviProposte(elenco.map((m) => m.id))
            // I punteggi si muovono risolvendo le proposte: chi è finito
            // sotto zero si guarda dopo, non prima.
            await forseSottoZero(await leggiMembri())
          })
          .catch(() => {})

        // Il record della pecora di ieri vale +3 (Legge XX), e quello di
        // fine viaggio +5 (XXV). Nessuno è sveglio a mezzanotte a
        // chiudere la giornata: la chiude il primo che apre l'app.
        leggiRecordPecora()
          .then((righe) => risolviRecordPecora(righe))
          .catch(() => {})
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
        {tab === 'oggi' && (
          <Itinerario membro={membro} onProfilo={() => vaiA('profilo')} />
        )}
        {tab === 'gruppo' && (
          <ChatRapida membro={membro} suoniDisponibili={suoniDisponibili} />
        )}
        {tab === 'foto' && <Album membro={membro} />}
        {tab === 'gioco' && (
          <Gioco
            membro={membro}
            proposteAperte={proposte.aperte}
            onVotaProposta={proposte.vota}
          />
        )}
        {tab === 'spese' && <Spese membro={membro} />}
        <BarraTab attivo={tab} onCambia={setTab} />
        <StrisciaOffline attiva={!inLinea} />
        {/* Senza rete il voto non partirebbe: il banner si toglie invece
            di restare lì con due bottoni che falliscono. Torna da solo
            col segnale, e intanto quel posto lo occupa la striscia. */}
        <BannerProposta
          proposte={inLinea ? proposte.daDecidere : []}
          membri={membriPerId}
          onVota={proposte.vota}
          onRimanda={proposte.rimanda}
        />
        <Celebrazione celebrazione={celebrazione} onChiudi={chiudiCelebrazione} />
      </>
    )
  }

  return (
    <main className="schermata">
      {vista === 'avvio' && <p className="allan">Un attimo.</p>}

      {vista === 'nonConfigurato' && <NonConfigurato />}

      {/* Senza rete non è un guasto, ed è inutile dare la colpa a
          Supabase: l'app si è aperta lo stesso. Qui non ci si arriva
          quasi più — con una copia dei dati si entra nell'app vera — ma
          chi apre senza rete e senza aver mai scaricato niente trova
          almeno Al da far saltare. */}
      {vista === 'guasto' && !inLinea && (
        <div className="pannello">
          <h1 className="titolo">Niente rete.</h1>
          <p className="allan">Mi annoio.</p>
          <Pecora compatta />
          <p className="istruzioni">
            L&rsquo;app c&rsquo;è, i dati no. Torna il segnale e riprende da sola.
          </p>
        </div>
      )}

      {vista === 'guasto' && inLinea && (
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


import { useEffect } from 'react'
import './Toast.css'

// Il messaggio che scompare da solo, sopra tutto.
//
// Non esisteva: ogni sezione aveva il suo `avviso` con la sua classe, e
// nessuno di quelli sopravvive a un cambio di schermata. Per dire
// "codice copiato" mentre si esce dall'app — cioè mentre la schermata
// che l'avrebbe mostrato si smonta — serviva qualcosa che vivesse più in
// alto di tutte.
//
// Per questo sta in App e non dentro una schermata.
export default function Toast({ messaggio, onChiudi, secondi = 6 }) {
  useEffect(() => {
    if (!messaggio) return undefined
    const via = setTimeout(onChiudi, secondi * 1000)
    return () => clearTimeout(via)
  }, [messaggio, onChiudi, secondi])

  if (!messaggio) return null

  return (
    <div className="toast" role="status" onClick={onChiudi}>
      {messaggio}
    </div>
  )
}

// Parte pura del controllo limiti: date le ore degli invii precedenti,
// dice se si può inviare. Nessun import del database, così si prova da
// riga di comando senza toccare Supabase.

export function valuta(regola, istanti, { adesso = Date.now(), oggi = 0 } = {}) {
  if (!regola) return { consentito: true }

  const ordinati = [...istanti].sort((a, b) => b - a)

  if (regola.cooldown > 0 && ordinati.length > 0) {
    const trascorsi = (adesso - ordinati[0]) / 1000
    if (trascorsi < regola.cooldown) {
      return {
        consentito: false,
        motivo: 'cooldown',
        attesa: Math.max(1, Math.ceil(regola.cooldown - trascorsi)),
      }
    }
  }

  if (regola.raffica && regola.finestra) {
    const inizio = adesso - regola.finestra * 1000
    const dentro = ordinati.filter((t) => t >= inizio)
    if (dentro.length >= regola.raffica) {
      // Si sblocca quando il più vecchio della finestra ne esce.
      const piuVecchio = dentro[dentro.length - 1]
      return {
        consentito: false,
        motivo: 'raffica',
        attesa: Math.max(1, Math.ceil((piuVecchio + regola.finestra * 1000 - adesso) / 1000)),
      }
    }
  }

  if (regola.giorno && oggi >= regola.giorno) {
    return { consentito: false, motivo: 'giorno', attesa: null }
  }

  return { consentito: true }
}

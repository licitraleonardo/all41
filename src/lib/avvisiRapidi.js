import { AVVISI_RAPIDI } from '../config/azioni.js'

// Le regole del cartello dei messaggi rapidi. Niente Supabase e niente
// React qui dentro: sono condizioni, e si provano da riga di comando come
// il resto delle regole del progetto.

// Vale la pena interrompere chi sta guardando un altro tab?
export function vaMostrato({ azione, ioId, tab, adesso = new Date() }) {
  if (!azione) return false

  // Il proprio non si annuncia a se stessi.
  if (azione.autoreId === ioId) return false

  if (!AVVISI_RAPIDI.tipi.includes(azione.tipo)) return false

  // ⚠️ Chi è già nel Gruppo il messaggio ce l'ha davanti: un cartello che
  // ripete quello che stai leggendo è solo una cosa da chiudere.
  if (tab === 'gruppo') return false

  // Eliminato nel frattempo — succede, ci sono cinque minuti per ritirare
  // quello che si è mandato.
  if (azione.eliminato) return false

  const minuti = (adesso.getTime() - Date.parse(azione.creatoIl)) / 60000
  // NaN se la data è storta: meglio non mostrare niente che un cartello
  // che non se ne va.
  if (!Number.isFinite(minuti)) return false

  return minuti >= 0 && minuti < AVVISI_RAPIDI.minutiFreschi
}

// Cosa c'è scritto sopra. Il testo dice **cosa è successo**, non «nuovo
// messaggio»: il senso di interrompere è che uno possa decidere se
// alzarsi senza aprire niente.
export function descriviAvviso(azione, nome) {
  const chi = nome ?? 'Qualcuno'
  switch (azione.tipo) {
    case 'si_riparte':
      return {
        icona: '🚗',
        forte: `Si riparte fra ${azione.payload?.minuti ?? '?'} minuti`,
        piano: `Lo dice ${chi}`,
      }
    case 'dove_siete':
      return { icona: '📍', forte: `${chi} chiede dove siete`, piano: 'Vuole sapere dove sei' }
    case 'poll':
      return {
        icona: '📊',
        forte: `${chi} ha lanciato un sondaggio`,
        piano: azione.payload?.domanda ?? 'C’è da votare',
      }
    default:
      return { icona: '💬', forte: `${chi} ha scritto`, piano: '' }
  }
}

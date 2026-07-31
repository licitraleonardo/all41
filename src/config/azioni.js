// Contenuti dei bottoni della Chat Rapida. Testi e opzioni stanno qui,
// non nei componenti.

// SOS: testi piani e diretti, zero personaggio. È una delle tre eccezioni
// in cui Allan non parla — nessuno vuole trovare una battuta mentre chiede
// aiuto. Vedi "Dove Allan NON parla" nello spec.
export const MOTIVI_SOS = [
  'Mi sono perso/a',
  'Problema con l’auto',
  'Serve aiuto ora',
]

export const MINUTI_RIPARTENZA = [5, 10, 15, 30]

// Finestra entro cui l'autore può ritirare quello che ha mandato. Serve
// per la foto sbagliata o il messaggio partito per errore: senza, ogni
// svista resta lì per cinque giorni.
export const MINUTI_PER_ELIMINARE = 5

export const LUNGHEZZA_MAX_TESTO = 200

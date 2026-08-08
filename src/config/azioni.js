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

// Quanti secondi si aspetta una risposta prima di dire che non è
// arrivata. Un invio appeso non produce nessun errore: senza un tempo
// massimo il bottone resta su "Invio…" finché non si chiude l'app.
//
// C'è solo l'SOS perché è l'unico posto in cui aspettare senza sapere fa
// danno: se un messaggio in chat tarda si vede che non è comparso e si
// rimanda, se una richiesta d'aiuto tarda si resta fermi ad aspettare
// aiuto che nessuno ha ricevuto. Tipo assente = nessuna scadenza.
//
// Dieci secondi: sotto si scambia per guasto una rete solo lenta, sopra
// diventa troppo tempo passato a fissare lo schermo prima di decidere di
// telefonare.
export const SECONDI_ATTESA = {
  sos: 10,
}

export const MINUTI_RIPARTENZA = [5, 10, 15, 30]

// Finestra entro cui l'autore può ritirare quello che ha mandato. Serve
// per la foto sbagliata o il messaggio partito per errore: senza, ogni
// svista resta lì per cinque giorni.
export const MINUTI_PER_ELIMINARE = 5

export const LUNGHEZZA_MAX_TESTO = 200

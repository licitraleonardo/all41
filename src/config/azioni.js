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

// Quali messaggi rapidi valgono un cartello in cima **anche a chi sta
// guardando un altro tab**.
//
// Non tutti, e la selezione è il punto: `free_text` è la chat normale e
// il pallino sull'icona basta; `soundboard` fa già rumore da solo; l'SOS
// ha la sua striscia, che sta sopra a tutto e non si chiude da sola.
//
// Restano i tre che chiedono qualcosa a chi legge — un voto, una
// posizione, di muoversi — e che se arrivano mentre guardi le foto non
// li vedi finché non passi dal Gruppo. «Si riparte fra 5 minuti» letto
// venti minuti dopo è il caso peggiore: gli altri sono già in macchina.
export const AVVISI_RAPIDI = {
  tipi: ['si_riparte', 'dove_siete', 'poll'],

  // Dopo quanto smette di avere senso interrompere. Un «si riparte fra 5
  // minuti» di mezz'ora fa non è più una notizia, è rumore — e un
  // cartello che si impara a scacciare senza leggere smette di
  // funzionare anche quando conta.
  minutiFreschi: 10,
}

// Finestra entro cui l'autore può ritirare quello che ha mandato. Serve
// per la foto sbagliata o il messaggio partito per errore: senza, ogni
// svista resta lì per cinque giorni.
export const MINUTI_PER_ELIMINARE = 5

export const LUNGHEZZA_MAX_TESTO = 200

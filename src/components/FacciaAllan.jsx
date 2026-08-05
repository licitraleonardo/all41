// La faccia di Allan.
//
// Disegnata e non presa da una libreria di avatar: quelli fanno facce
// simpatiche, e Allan simpatico non e'. Il personaggio e' scritto come
// "asciutto e un po' svogliato, la comicita' sta nell'understatement" —
// quindi palpebre basse, un sopracciglio alzato e la bocca piatta. Non
// sorride mai, e guarda leggermente di lato: sta gia' prendendo nota.
//
// Nei colori dell'app, cosi' funziona ovunque: sabbia sul blu del mare.
export default function FacciaAllan({ lato = 40, className = '' }) {
  return (
    <svg
      className={`faccia-allan ${className}`.trim()}
      viewBox="0 0 48 48"
      width={lato}
      height={lato}
      role="img"
      aria-label="Allan"
    >
      <circle cx="24" cy="24" r="23" fill="var(--sea, #0b3550)" />

      {/* Un sopracciglio alzato e uno piatto: e' tutta la faccia, il
          resto e' contorno. */}
      <path
        d="M11 17 L20 14.2"
        stroke="var(--sand, #f7f4ec)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M28 15.4 L37 16.4"
        stroke="var(--sand, #f7f4ec)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Occhi a palpebra calata: mezzaluna col taglio dritto in alto. */}
      <path d="M11 21 h9 a4.5 4.5 0 0 1 -9 0 z" fill="var(--sand, #f7f4ec)" />
      <path d="M28 21 h9 a4.5 4.5 0 0 1 -9 0 z" fill="var(--sand, #f7f4ec)" />

      {/* Le pupille stanno a destra: guarda di lato, non te. */}
      <circle cx="18" cy="23.3" r="1.8" fill="var(--sea, #0b3550)" />
      <circle cx="35" cy="23.3" r="1.8" fill="var(--sea, #0b3550)" />

      <path
        d="M18 33 h12"
        stroke="var(--sand, #f7f4ec)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

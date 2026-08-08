import { urlAvatar } from '../config/avatar.js'

// Segnaposto: qui al punto 3 arriva l'itinerario e la struttura a tab.
// Modifica e uscita traslocheranno nel tab Altro quando esisterà.
export default function Profilo({ membro, onModifica, onEsci, onIndietro }) {
  return (
    <div className="pannello">
      {/* Si cambia faccia toccando la faccia. Prima era un bottone in
          fondo, in mezzo agli altri due: la cosa che uno viene a fare qui
          stava sotto quella che non vuole fare mai. */}
      <button
        type="button"
        className="avatar-modifica"
        onClick={onModifica}
        aria-label="Cambia nome e avatar"
      >
        <img
          className="avatar-grande"
          src={urlAvatar(membro.avatarStyle, membro.avatarSeed)}
          alt=""
          width="96"
          height="96"
        />
        <span className="avatar-matita" aria-hidden="true">
          ✏️
        </span>
      </button>

      <h1 className="titolo">{membro.nome}</h1>
      <p className="sottotitolo">Tocca la faccia per cambiare nome e avatar</p>

      <dl className="targa">
        <div>
          <dt>Codice</dt>
          <dd>{membro.codice}</dd>
        </div>
        <div>
          <dt>Punti</dt>
          <dd>{membro.punteggio}</dd>
        </div>
      </dl>

      <button type="button" className="primario" onClick={onIndietro}>
        Torna al viaggio
      </button>

      {/* In rosso perché è l'unica cosa in questa schermata che si può
          rimpiangere: senza il codice non si rientra.
          La schermata di conferma non c'è più: uscendo il codice si
          copia da solo e resta scritto nel messaggio che compare. È lì
          la rete di sicurezza adesso, non in un passaggio in più. */}
      <button type="button" className="pericolo" onClick={onEsci}>
        Esci da questo dispositivo
      </button>
    </div>
  )
}

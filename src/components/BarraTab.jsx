// I cinque tab dello spec. Sono cresciuti man mano invece di nascere
// tutti spenti: il quinto si è chiamato "Spese" finché conteneva solo
// quelle, e ha preso il nome dello spec quando ci sono entrati anche i
// Documenti. Mappa e Info arriveranno lì.
const TAB = [
  { id: 'oggi', etichetta: 'Oggi', icona: '📅' },
  { id: 'gruppo', etichetta: 'Gruppo', icona: '💬' },
  { id: 'foto', etichetta: 'Foto', icona: '📷' },
  { id: 'gioco', etichetta: 'Gioco', icona: '🏆' },
  { id: 'altro', etichetta: 'Altro', icona: '📎' },
]

export default function BarraTab({ attivo, onCambia, novita }) {
  return (
    <nav className="barra-tab" aria-label="Sezioni">
      {TAB.map((t) => (
        <button
          key={t.id}
          type="button"
          className={t.id === attivo ? 'tab attivo' : 'tab'}
          onClick={() => onCambia(t.id)}
          aria-current={t.id === attivo ? 'page' : undefined}
        >
          <span className="tab-icona" aria-hidden="true">
            {t.icona}
            {novita?.[t.id] && <span className="tab-punto" />}
          </span>
          <span className="tab-etichetta">{t.etichetta}</span>
        </button>
      ))}
    </nav>
  )
}

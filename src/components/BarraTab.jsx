// Lo spec prevede cinque tab. Per ora ce ne sono due, perché due sono le
// sezioni che esistono: mettere "Foto" e "Gioco" spenti sarebbe interfaccia
// morta. Crescono man mano che le feature nascono.
const TAB = [
  { id: 'oggi', etichetta: 'Oggi', icona: '📅' },
  { id: 'gruppo', etichetta: 'Gruppo', icona: '💬' },
  { id: 'foto', etichetta: 'Foto', icona: '📷' },
  { id: 'gioco', etichetta: 'Gioco', icona: '🏆' },
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

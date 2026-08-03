// Lo spec prevede cinque tab, e il quinto si chiama "Altro": dentro ci
// vanno Spese, Documenti, Mappa e Info. Per ora c'è solo Spese, e un tab
// chiamato "Altro" con dentro una cosa sola non dice niente a nessuno.
// Si chiama come quello che contiene, e diventerà "Altro" quando ne
// conterrà davvero altre — stesso criterio per cui i tab sono cresciuti
// da due a cinque invece di nascere tutti spenti.
const TAB = [
  { id: 'oggi', etichetta: 'Oggi', icona: '📅' },
  { id: 'gruppo', etichetta: 'Gruppo', icona: '💬' },
  { id: 'foto', etichetta: 'Foto', icona: '📷' },
  { id: 'gioco', etichetta: 'Gioco', icona: '🏆' },
  { id: 'spese', etichetta: 'Spese', icona: '💶' },
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

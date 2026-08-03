// Meteo della tappa. Non un widget generico — quello ce l'hanno tutti sul
// telefono — ma le condizioni del posto dove si sta oggi e domani.

export const METEO = {
  // Sopra questa soglia il vento va evidenziato. Per la giornata in barca
  // del 14 è l'unica informazione che può far cambiare i piani.
  ventoForte: 20,
  // Il meteo non serve in tempo reale: si chiede una volta e si tiene.
  oreDiCache: 3,
}

// Codici WMO, raggruppati: la differenza fra pioggia debole e moderata non
// cambia la giornata di nessuno.
const CONDIZIONI = [
  { fino: 0, testo: 'Sereno', icona: '☀️' },
  { fino: 2, testo: 'Poco nuvoloso', icona: '🌤️' },
  { fino: 3, testo: 'Nuvoloso', icona: '☁️' },
  { fino: 48, testo: 'Nebbia', icona: '🌫️' },
  { fino: 57, testo: 'Pioviggine', icona: '🌦️' },
  { fino: 67, testo: 'Pioggia', icona: '🌧️' },
  { fino: 77, testo: 'Neve', icona: '🌨️' },
  { fino: 82, testo: 'Rovesci', icona: '🌧️' },
  { fino: 86, testo: 'Rovesci di neve', icona: '🌨️' },
  { fino: 99, testo: 'Temporale', icona: '⛈️' },
]

export function condizione(codice) {
  return CONDIZIONI.find((c) => codice <= c.fino) ?? CONDIZIONI[CONDIZIONI.length - 1]
}

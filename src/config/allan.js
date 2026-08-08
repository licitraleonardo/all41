// Le uscite di Allan nella chat.
//
// Registro: asciutto e un po' svogliato. Frasi corte, punto fermo,
// nessun entusiasmo forzato, niente emoji sorridenti. La comicità sta
// nell'understatement. Allan non si scusa, non dà consigli non richiesti
// e non parla mai di sé come di un'app.
//
// Sono locali ed effimere: le vede solo chi le innesca, non finiscono nel
// database e spariscono ricaricando. Così nessuno deve decidere quale
// telefono le scrive, e restano imprevedibili.

export const BATTUTE_ALLAN = [
  'Preso nota.',
  'Interessante. Non molto, ma interessante.',
  'Lo dirò a nessuno.',
  'Sto contando tutto, comunque.',
  'Va bene. Continuate pure.',
  'Ho visto di peggio. Oggi, anche.',
  'Il Testamento non commenta.',
  'Bene. Io resto qui.',
  'Uno di voi doveva dirlo.',
  'Segnato, come sempre.',
]

// Parla raramente: se commenta un messaggio su tre diventa rumore, e il
// personaggio si consuma nel primo pomeriggio del 12 agosto.
export const ALLAN = {
  probabilita: 0.12,
  pausaMinuti: 8,
}

// ---------------------------------------------------------- le facce
//
// Ritagliate dallo character sheet.
//
// Non e' un avatar generato: e' un personaggio disegnato, con otto
// espressioni definite. Averle tutte vuol dire che puo' usare quella
// giusta al momento giusto invece di guardare sempre allo stesso modo —
// ed e' la differenza fra un personaggio e una figurina.
//
// I file stanno in public/allan/, uno per espressione, gia' allineati fra
// loro: stessa tela, teste alla stessa altezza, drago centrato. Cambiarli
// vuol dire sostituire il file, non toccare il codice.

export const ESPRESSIONI = [
  'sbuffa',
  'giudica',
  'esausto',
  'contento',
  'scocciato',
  'sarcastico',
  'incredulo',
  'rassegnato',
]

export const ESPRESSIONE_PREDEFINITA = 'giudica'

export function urlAllan(espressione) {
  const e = ESPRESSIONI.includes(espressione) ? espressione : ESPRESSIONE_PREDEFINITA
  return `/allan/${e}.png`
}

// Le facce per tab non ci sono piu': nel tutorial Allan ne usa una sola,
// perche' cambiargliela a ogni sezione faceva sembrare che ce ne fossero
// cinque diversi invece di uno che ti segue in giro. Le otto espressioni
// restano tutte in public/allan/ e le sceglie chi le mette in pagina —
// l'Impostore usa la sarcastica sul retro della carta.

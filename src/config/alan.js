// Le facce di Alan, ritagliate dallo character sheet.
//
// Non e' un avatar generato: e' un personaggio disegnato, con otto
// espressioni definite. Averle tutte vuol dire che puo' usare quella
// giusta al momento giusto invece di guardare sempre allo stesso modo —
// ed e' la differenza fra un personaggio e una figurina.
//
// I file stanno in public/alan/, uno per espressione, gia' allineati fra
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

export function urlAlan(espressione) {
  const e = ESPRESSIONI.includes(espressione) ? espressione : ESPRESSIONE_PREDEFINITA
  return `/alan/${e}.png`
}

// Che faccia fa entrando in ogni tab. Non e' decorazione: dice come la
// pensa su quella sezione prima ancora di aprire bocca.
export const FACCIA_PER_TAB = {
  oggi: 'rassegnato',
  gruppo: 'scocciato',
  foto: 'sarcastico',
  gioco: 'giudica',
  altro: 'esausto',
}

// L'Impostore: l'app fa solo il mazziere. Distribuisce le parole in
// privato, tiene il conto dei turni, raccoglie i voti e rivela. Il gioco
// vero — dire la propria parola, accusarsi, difendersi — succede a voce
// nella stanza, e l'app deve starne fuori.

export const IMPOSTORE = {
  // Due giri prima del voto. Con un giro solo si finisce quasi sempre in
  // un'accusa a caso: non c'e' abbastanza in tavola per ragionare.
  giriTotali: 2,

  // Sotto i quattro non e' un gioco, e' un interrogatorio.
  minimoGiocatori: 4,

  // Uno fino a sei, due da sette in su: con otto persone e un impostore
  // solo, gli innocenti vincono quasi sempre per forza di numeri.
  quantiImpostori: (quanti) => (quanti >= 7 ? 2 : 1),

  // Il voto non ha un timer visibile: serve solo a non lasciare un voto
  // appeso per sempre se la partita finisce in una birra.
  minutiVoto: 30,
}

// La variante consigliata e' quella con la parola simile: chi non ha
// nessuna parola si blocca al primo giro e si smaschera da solo, che e'
// il difetto del gioco classico. Quella classica resta per chi la vuole.
export const VARIANTI = [
  {
    id: 'parola-simile',
    nome: 'Parola simile',
    spiega: 'L’impostore riceve una parola diversa ma vicina. Si puo’ bluffare.',
  },
  {
    id: 'senza-parola',
    nome: 'Senza parola',
    spiega: 'L’impostore non riceve niente e deve inventare al volo.',
  },
]

// Quello che vede l'impostore nella variante classica.
export const NESSUNA_PAROLA = '—'

// Coppie [parola del gruppo, parola dell'impostore]. Dato puro: vicine
// abbastanza da poter bluffare, diverse abbastanza da poter sbagliare.
export const COPPIE = [
  ['Mare', 'Lago'],
  ['Spiaggia', 'Deserto'],
  ['Sabbia', 'Ghiaia'],
  ['Onda', 'Corrente'],
  ['Scoglio', 'Masso'],
  ['Faro', 'Torre'],
  ['Barca', 'Zattera'],
  ['Vela', 'Remo'],
  ['Ancora', 'Catena'],
  ['Porto', 'Stazione'],
  ['Pesce', 'Uccello'],
  ['Polpo', 'Ragno'],
  ['Gabbiano', 'Piccione'],
  ['Delfino', 'Squalo'],
  ['Granchio', 'Scorpione'],
  ['Conchiglia', 'Guscio'],
  ['Corallo', 'Cactus'],
  ['Alga', 'Muschio'],
  ['Maschera', 'Occhiali'],
  ['Pinne', 'Ciabatte'],
  ['Ombrellone', 'Tenda'],
  ['Asciugamano', 'Coperta'],
  ['Crema solare', 'Dopobarba'],
  ['Scottatura', 'Livido'],
  ['Abbronzatura', 'Ruggine'],
  ['Costume', 'Pigiama'],
  ['Infradito', 'Pantofole'],
  ['Cappello', 'Casco'],

  ['Sardegna', 'Sicilia'],
  ['Cagliari', 'Palermo'],
  ['Nuraghe', 'Castello'],
  ['Pecora', 'Capra'],
  ['Pastore', 'Contadino'],
  ['Mirto', 'Limoncello'],
  ['Pane carasau', 'Piadina'],
  ['Porceddu', 'Arrosto'],
  ['Fregola', 'Cous cous'],
  ['Bottarga', 'Caviale'],
  ['Seadas', 'Cannolo'],
  ['Malloreddus', 'Gnocchi'],
  ['Vermentino', 'Prosecco'],
  ['Flamingo', 'Cicogna'],
  ['Maestrale', 'Scirocco'],

  ['Traghetto', 'Aereo'],
  ['Valigia', 'Zaino'],
  ['Passaporto', 'Patente'],
  ['Aeroporto', 'Autogrill'],
  ['Ritardo', 'Anticipo'],
  ['Autostrada', 'Sentiero'],
  ['Benzina', 'Acqua'],
  ['Navigatore', 'Mappa'],
  ['Rotonda', 'Semaforo'],
  ['Parcheggio', 'Garage'],
  ['Furgone', 'Camper'],
  ['Bagagliaio', 'Armadio'],
  ['Casello', 'Cancello'],
  ['Souvenir', 'Regalo'],
  ['Cartolina', 'Lettera'],

  ['Colazione', 'Merenda'],
  ['Caffe’', 'Te’'],
  ['Cornetto', 'Ciambella'],
  ['Pizza', 'Focaccia'],
  ['Gelato', 'Granita'],
  ['Birra', 'Sidro'],
  ['Vino', 'Aceto'],
  ['Ghiaccio', 'Neve'],
  ['Cocktail', 'Sciroppo'],
  ['Aperitivo', 'Digestivo'],
  ['Ristorante', 'Mensa'],
  ['Conto', 'Multa'],
  ['Mancia', 'Elemosina'],
  ['Forchetta', 'Rastrello'],
  ['Padella', 'Racchetta'],
  ['Frigorifero', 'Cassaforte'],
  ['Barbecue', 'Falo’'],
  ['Spesa', 'Bottino'],

  ['Sveglia', 'Allarme'],
  ['Cuscino', 'Sacco a pelo'],
  ['Doccia', 'Pioggia'],
  ['Asciugacapelli', 'Ventilatore'],
  ['Specchio', 'Finestra'],
  ['Chiave', 'Password'],
  ['Divano', 'Amaca'],
  ['Terrazza', 'Balcone'],
  ['Piscina', 'Vasca'],
  ['Aria condizionata', 'Ventaglio'],
  ['Zanzara', 'Mosca'],
  ['Russare', 'Fischiare'],
  ['Coinquilino', 'Vicino'],

  ['Telefono', 'Telecomando'],
  ['Batteria', 'Benzina'],
  ['Wi-Fi', 'Ossigeno'],
  ['Selfie', 'Ritratto'],
  ['Foto di gruppo', 'Foto segnaletica'],
  ['Storia', 'Diario'],
  ['Gruppo WhatsApp', 'Assemblea'],
  ['Vocale', 'Monologo'],
  ['Notifica', 'Campanello'],
  ['Playlist', 'Concerto'],
  ['Cuffie', 'Tappi'],
  ['Karaoke', 'Coro'],
  ['Ballo', 'Rissa'],

  ['Tramonto', 'Alba'],
  ['Luna', 'Lampione'],
  ['Stella', 'Scintilla'],
  ['Falo’', 'Incendio'],
  ['Temporale', 'Litigata'],
  ['Vento', 'Sospiro'],
  ['Ombra', 'Fantasma'],
  ['Silenzio', 'Vuoto'],

  ['Amicizia', 'Alleanza'],
  ['Bugia', 'Sorpresa'],
  ['Segreto', 'Password'],
  ['Scommessa', 'Promessa'],
  ['Vendetta', 'Scherzo'],
  ['Gelosia', 'Invidia'],
  ['Ritardatario', 'Fantasma'],
  ['Sfigato', 'Sfortunato'],
  ['Capobranco', 'Allenatore'],
  ['Testamento', 'Contratto'],
  ['Processo', 'Interrogatorio'],
  ['Giudice', 'Arbitro'],
  ['Alibi', 'Scusa'],
  ['Sospetto', 'Dubbio'],
  ['Impostore', 'Sosia'],
]

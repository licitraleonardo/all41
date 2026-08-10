// L'Impostore: l'app fa solo il mazziere. Distribuisce le parole in
// privato, tiene il conto dei turni, raccoglie i voti e rivela. Il gioco
// vero — dire la propria parola, accusarsi, difendersi — succede a voce
// nella stanza, e l'app deve starne fuori.

export const IMPOSTORE = {
  // Quanti giri si fanno non lo decide piu' un numero: dopo ogni giro il
  // gruppo vota se ne serve un altro, insieme all'accusa. "Ne sappiamo
  // abbastanza?" e' una domanda che ha senso dopo aver sentito, non
  // prima — a partita non ancora cominciata nessuno puo' saperlo.
  //
  // Resta come valore di partenza della colonna sul database, che non
  // ammette nulli.
  giriTotali: 1,

  // Sotto i quattro non e' un gioco, e' un interrogatorio.
  minimoGiocatori: 4,

  // Quanti impostori lo decide il gruppo a voto, all'inizio di ogni
  // partita. Questa resta come proposta: e' l'opzione gia' evidenziata,
  // perche' con otto persone e un impostore solo gli innocenti vincono
  // quasi sempre per forza di numeri, ma il gruppo puo' pensarla
  // diversamente e sono affari suoi.
  quantiImpostori: (quanti) => (quanti >= 7 ? 2 : 1),

  // L'unica cosa che si vota prima di cominciare.
  //
  // ⚠️ Dipende da quanti sono, e non e' pignoleria. Era fisso a [1, 2], e
  // in quattro — il minimo — un gruppo che sceglieva 2 faceva partire una
  // partita GIA' PERSA: due impostori contro due innocenti vuol dire che
  // gli impostori non sono in minoranza, cioe' la condizione con cui
  // vincono. Il controllo pero' gira solo dentro `dopoAccusa`, quindi il
  // gruppo giocava un giro intero e un voto prima di scoprirlo.
  //
  // La soglia e' cinque perche' e' la prima in cui due impostori restano
  // in minoranza (2 contro 3). Sotto, si vota solo fra un'opzione: il
  // voto compare lo stesso, perche' il gruppo deve vedere che la scelta
  // esiste e che stasera non c'e'.
  sceltePerImpostori: (quanti) => (quanti >= 5 ? [1, 2] : [1]),

  // Il voto non ha un timer visibile: serve solo a non lasciare un voto
  // appeso per sempre se la partita finisce in una birra.
  minutiVoto: 30,

  // Il testimone. Chiunque puo' far avanzare il turno — se a qualcuno si
  // scarica il telefono la partita non si blocca — ma per i primi trenta
  // secondi puo' farlo solo chi sta parlando.
  //
  // ⚠️ Non e' il countdown che lo spec vieta, ed e' bene tenere ferma la
  // differenza: un countdown mette fretta a chi parla, questo protegge
  // chi parla da chi ha il dito veloce. Alla scadenza non succede niente
  // — nessun turno saltato, nessun suono — si sblocca soltanto il tasto
  // per gli altri. Chi sta parlando puo' passare quando vuole, anche
  // subito.
  secondiDelTestimone: 30,
}

// La variante consigliata e' quella con la parola simile: chi non ha
// nessuna parola si blocca al primo giro e si smaschera da solo, che e'
// il difetto del gioco classico. Quella classica resta per chi la vuole.
export const VARIANTI = [
  // ⚠️ Solo il nome: la riga che spiegava cosa cambia fra le due e' andata
  // via il 10 agosto, e con lei il campo `spiega`. Un dato che non legge
  // piu' nessuno resta li' e mente al primo ritocco.
  { id: 'parola-simile', nome: 'Parola simile' },
  { id: 'senza-parola', nome: 'Senza parola' },
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
  ['Caffè', 'Tè'],
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
  ['Barbecue', 'Falò'],
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
  ['Falò', 'Incendio'],
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

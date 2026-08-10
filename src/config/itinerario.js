// Itinerario del viaggio. Dato puro: i componenti non contengono testi.
//
// Le coordinate servono al meteo della tappa e vengono da
// sardegna-itinerario.html: una per giornata, il posto dove si sta di
// più. Il 14 punta al mare di Capo Carbonara, che è dove conta il vento.
// Portato da sardegna-itinerario.html. Il giorno della settimana NON sta
// qui: si calcola dalla data, perché scritto a mano si sfasa cambiando anno.
//
// tono: gold | coral | sea | juniper — colore del pallino sulla linea
// note[].tipo: parcheggio | consiglio | nota

export const GIORNI = [
  {
    giorno: 12,
    coordinate: { lat: 39.2257079, lng: 9.2049651, dove: 'Poetto' },
    data: '2026-08-12',
    titolo: 'Arrivo & spesa lampo',
    tono: 'gold',
    tappe: [
      { ora: '07:00', cosa: "Arrivo a Quartu Sant'Elena" },
      {
        ora: '07:30',
        cosa: 'Bagnetto volante al Poetto',
        maps: 'https://maps.google.com/?cid=16257758897338050385',
        note: [
          {
            tipo: 'parcheggio',
            testo: 'Gratuito lungo il Viale Golfo di Quartu — 10 min dal villaggio',
          },
        ],
      },
      {
        ora: '13:00',
        cosa: 'Pranzo al Poetto',
        note: [
          {
            tipo: 'nota',
            testo: 'Qualcosa di semplice sul lungomare, senza spostarvi due volte',
          },
        ],
      },
      {
        ora: 'Pom.',
        cosa: 'Relax / seconda tintarella',
        note: [
          {
            tipo: 'consiglio',
            testo:
              'Il check-in è alle 17, tanto vale sfruttare ancora la spiaggia invece di girare con le valigie in macchina',
          },
        ],
      },
      {
        ora: '16:00',
        cosa: 'Spesa al Conad Superstore',
        maps: 'https://maps.google.com/?cid=7003594510383738616',
        note: [
          {
            tipo: 'nota',
            testo: 'Via Guglielmo Marconi — a ridosso del check-in, tutto va dritto in frigo',
          },
        ],
      },
      { ora: '17:00', cosa: "Check-in — Villaggio S'oru 'e Mari" },
      {
        ora: '20:30',
        cosa: 'Cena: Antica Trattoria Dar Mammozzaro',
        maps: 'https://maps.google.com/?cid=784069995673259709',
        note: [
          { tipo: 'consiglio', testo: 'Prenotare online, tavolo per 8 — molto richiesto' },
        ],
      },
    ],
    daSapere:
      "Il Poetto è una delle spiagge urbane più lunghe d'Europa, quasi 8 km. Alle sue spalle c'è lo Stagno di Molentargius, ex salina oggi zona umida protetta dove nidificano i fenicotteri rosa — guardando verso l'entroterra in tarda mattinata spesso si vedono in volo.",
    daProvare:
      'Pardulas (dolcetti con ricotta e zafferano) o pane carasau: tra i simboli gastronomici sardi più semplici da trovare anche al supermercato.',
  },

  {
    giorno: 13,
    coordinate: { lat: 39.1910114, lng: 9.5604255, dove: 'Cala Sinzias' },
    data: '2026-08-13',
    titolo: 'Van moderato: Costa Rei',
    tono: 'coral',
    tappe: [
      {
        ora: '10:00',
        cosa: 'Si parte verso Cala Sinzias',
        note: [{ tipo: 'nota', testo: 'Circa 40 min da Quartu — zona nuova, mai vista finora' }],
      },
      {
        ora: '10:45',
        cosa: 'Spiaggia di Cala Sinzias',
        maps: 'https://maps.google.com/?cid=3455627146409489665',
        note: [
          {
            tipo: 'parcheggio',
            testo:
              'A pagamento ~8–10€/giorno — niente oggetti di valore in vista in auto',
          },
          {
            tipo: 'consiglio',
            testo: 'Acqua cristallina, sabbia bianca, meno battuta di Villasimius',
          },
        ],
      },
      {
        ora: '13:30',
        cosa: 'Pranzo: Chaplin Spaghetteria',
        maps: 'https://maps.google.com/?cid=12095961795747864814',
        note: [{ tipo: 'nota', testo: 'Costa Rei, informale, giusto a fianco della spiaggia' }],
      },
      {
        ora: 'Pom.',
        cosa: 'Si resta in spiaggia, o passeggiata verso le calette vicine',
        note: [
          {
            tipo: 'consiglio',
            testo:
              'Docce a pagamento in loco (0,50–1€) per sciacquarvi prima di cena, niente bisogno di tornare al villaggio',
          },
        ],
      },
      {
        ora: '20:00',
        cosa: "Cena: L'Aragosta",
        maps: 'https://maps.google.com/?cid=2520692375762075470',
        note: [
          {
            tipo: 'consiglio',
            testo: 'Costa Rei, pesce, ottimo rapporto qualità/prezzo — prenotare',
          },
        ],
      },
    ],
    daSapere:
      "La costa è dominata dalla macchia mediterranea — ginepro, lentisco, mirto — che tiene insieme dune altrimenti fragilissime. Zona quasi disabitata fino al boom turistico degli anni '60-'70: prima era terra di pastori.",
    daProvare:
      'Il mirto, il liquore sardo per eccellenza, fatto con le bacche della pianta che vedrete lungo tutta la costa.',
  },

  {
    giorno: 14,
    coordinate: { lat: 39.12, lng: 9.53, dove: 'Capo Carbonara' },
    data: '2026-08-14',
    titolo: 'Escursione in barca',
    tono: 'sea',
    badge: 'confermata',
    tappe: [
      // ⚠️ L'unico orario del viaggio che non si puo' sbagliare: una barca
      // non aspetta. Sta come tappa sua, con l'ora davanti, invece che
      // dentro una nota di quella dopo — chi guarda il programma la
      // mattina del 14 legge le ore in colonna, non i testi.
      // Fonte: Leonardo, 10 agosto.
      {
        ora: '10:30',
        cosa: 'Partenza — porto di Villasimius',
        maps: 'https://maps.google.com/?q=Porto+di+Villasimius',
        note: [{ tipo: 'nota', testo: 'La barca non aspetta: meglio essere lì prima' }],
      },
      {
        ora: 'Tutto',
        cosa: 'Itinerario 1 — Cuccureddus, Punta Molentis, Porto Giunco, Baia di Vecchia Fortezza',
        note: [{ tipo: 'nota', testo: 'Pranzo incluso a bordo' }],
      },
      {
        ora: '20:30',
        cosa: 'Cena: Sa Tankitta',
        maps: 'https://maps.google.com/?cid=16226680899643951127',
        note: [
          {
            tipo: 'nota',
            testo:
              'Villasimius — sardo e pesce fresco, consigliato da Francesca. Senza prenotazione arrivate verso le 19',
          },
        ],
      },
      {
        ora: 'Alt.',
        cosa: 'Sa Baracca',
        maps: 'https://maps.google.com/?cid=13557855018176982206',
        note: [
          { tipo: 'consiglio', testo: 'Pesce, Quartu — se preferite rientrare verso il villaggio' },
        ],
      },
    ],
    daSapere:
      "Lungo questa costa ci sono ancora torri di avvistamento spagnole del '500-'600, costruite contro le incursioni dei pirati barbareschi: cercatele tra Punta Molentis e Porto Giunco. L'Isola dei Cavoli prende il nome dal cavolo selvatico che cresce sulle sue rocce, non dagli ortaggi.",
    daProvare:
      'La bottarga (uova di muggine essiccate), specialità tipica di questa costa — ottima anche solo come antipasto su pane carasau.',
  },

  {
    giorno: 15,
    coordinate: { lat: 39.1286706, lng: 9.5063462, dove: 'Campulongu' },
    data: '2026-08-15',
    titolo: 'Villasimius via van',
    tono: 'juniper',
    tappe: [
      {
        ora: 'Mattina',
        cosa: 'Spiaggia di Campulongu',
        maps: 'https://maps.google.com/?cid=15757347426677060669',
        note: [
          {
            tipo: 'parcheggio',
            testo: 'In parte gratuito ma limitato — arrivate entro le 10',
          },
          { tipo: 'consiglio', testo: 'Acqua bassa e cristallina, meno caotica di Notteri' },
        ],
      },
      {
        ora: 'Alt.',
        cosa: 'Spiaggia di Notteri',
        maps: 'https://maps.google.com/?cid=8007201126206639253',
        note: [
          {
            tipo: 'parcheggio',
            testo: 'Porto Giunco / Notteri: ~10€/giorno, ~5–6€ dopo le 16',
          },
        ],
      },
      {
        ora: '13:00',
        cosa: 'Pranzo: Gnocco&',
        maps: 'https://maps.google.com/?cid=5762768926424311337',
        note: [{ tipo: 'nota', testo: 'Villasimius, informale, ottimo per gruppo' }],
      },
      {
        ora: 'Pom.',
        cosa: 'Si resta in spiaggia, o sentiero verso il Faro di Capo Carbonara',
        note: [
          {
            tipo: 'consiglio',
            testo: 'Parte dalla zona Porto Giunco/Notteri, 30-40 min a/r, vista pazzesca',
          },
        ],
      },
      {
        ora: '20:30',
        cosa: 'Cena: Arke',
        maps: 'https://maps.google.com/?cid=5446753121097077314',
        note: [{ tipo: 'consiglio', testo: 'Quartu, più elegante — prenotare' }],
      },
    ],
    daSapere:
      'Queste acque nascondono diversi relitti, romani e moderni, ed è una delle mete subacquee più note dell’isola: il piccolo museo archeologico del paese espone anfore recuperate proprio da questi fondali.',
    daProvare:
      'Culurgiones (ravioli di patata, pecorino e menta, chiusi con la treccia a mano) o malloreddus alla campidanese: i due piatti più rappresentativi della cucina sarda.',
  },

  {
    giorno: 16,
    coordinate: { lat: 39.2257079, lng: 9.2049651, dove: 'Poetto' },
    data: '2026-08-16',
    titolo: 'Ultimo bagno & si parte',
    tono: 'gold',
    tappe: [
      {
        ora: 'Mattina',
        cosa: 'Poetto',
        maps: 'https://maps.google.com/?cid=16257758897338050385',
        note: [
          {
            tipo: 'parcheggio',
            testo: 'Gratuito, vicinissimo al villaggio — nessuno stress logistico',
          },
        ],
      },
      { ora: 'Pranzo', cosa: 'Pranzo veloce e si riparte' },
    ],
    daSapere: null,
    daProvare:
      'Ultima occasione per una seada (pasta fritta con formaggio fresco e miele) prima di ripartire.',
  },
]

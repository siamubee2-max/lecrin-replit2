/**
 * Italian translations for L'Écrin Virtuel
 */
import type { TranslationKeys } from "./fr";

export const it: TranslationKeys = {
  // Common
  common: {
    loading: "Caricamento...",
    error: "Errore",
    success: "Successo",
    cancel: "Annulla",
    save: "Salva",
    delete: "Elimina",
    edit: "Modifica",
    share: "Condividi",
    close: "Chiudi",
    next: "Avanti",
    previous: "Indietro",
    apply: "Applica",
    reset: "Reimposta",
    search: "Cerca",
    filter: "Filtra",
    sort: "Ordina",
    all: "Tutti",
    none: "Nessuno",
    yes: "Sì",
    no: "No",
    ok: "OK",
    retry: "Riprova",
    seeAll: "Vedi tutto",
    seeMore: "Vedi di più",
    seeLess: "Vedi meno",
  },

  // App branding
  brand: {
    name: "L'Écrin Virtuel",
    tagline: "Prova virtuale di gioielli",
    slogan: "Prova l'inaccessibile Virtualmente.",
    watermark: "L'Écrin Virtuel",
    createdWith: "Creato con L'Écrin Virtuel",
    website: "ecrin-virtuel.app",
  },

  // Home screen
  home: {
    title: "Home",
    welcome: "Benvenuto",
    virtualTryOn: "Prova Virtuale",
    tryOnDescription: "Importa un gioiello, scegli la tua foto e lascia che la magia accada. Visualizza il risultato prima di acquistare o semplicemente per sognare.",
    newTryOn: "Nuova Prova",
    photographer: "Fotografa",
    captureJewelry: "Cattura un gioiello",
    myCollection: "Il Mio Scrigno",
    myCollectionDesc: "La mia collezione",
    boutique: "Boutique",
    boutiqueDesc: "Creatori",
    premium: "Premium",
    premiumDesc: "Abbonamento",
    recentItems: "Più recenti",
  },

  // Try-on screen
  tryOn: {
    title: "Prova",
    selectJewelry: "Scegli il gioiello",
    selectModel: "Scegli il modello",
    selectStyle: "Scegli lo stile",
    adjustSize: "Regola la dimensione",
    takePhoto: "Scatta una foto",
    chooseFromGallery: "Scegli dalla galleria",
    aiPositioning: "Posizionamento IA",
    manualPositioning: "Posizionamento manuale",
    saveTryOn: "Salva la prova",
    quickSave: "Salvataggio rapido",
    editAndSave: "Modifica e Salva",
    shareResult: "Condividi il risultato",
    savedToGallery: "Salvato nella galleria",
    albumName: "Écrin Virtuel",
  },

  // Jewelry types
  jewelryTypes: {
    necklace: "Collana",
    earrings: "Orecchini",
    ring: "Anello",
    bracelet: "Bracciale",
    anklet: "Cavigliera",
    brooch: "Spilla",
    set: "Parure",
  },

  // Jewelry styles
  jewelryStyles: {
    gold: "Oro",
    silver: "Argento",
    rosegold: "Oro Rosa",
    platinum: "Platino",
    bronze: "Bronzo",
  },

  // Photo editor
  photoEditor: {
    title: "Editor foto",
    filters: "Filtri",
    retouch: "Ritocco",
    crop: "Ritaglia",
    rotate: "Ruota",
    brightness: "Luminosità",
    contrast: "Contrasto",
    saturation: "Saturazione",
    warmth: "Calore",
    vignette: "Vignettatura",
    original: "Originale",
    glamour: "Glamour",
    vintage: "Vintage",
    blackAndWhite: "B&N",
    golden: "Dorato",
    cold: "Freddo",
    rose: "Rosa",
    dramatic: "Drammatico",
    beforeAfter: "Prima/Dopo",
    aspectRatio: "Formato",
    free: "Libero",
    flipHorizontal: "Capovolgi H",
    flipVertical: "Capovolgi V",
  },

  // My collection (Mon Écrin)
  myCollection: {
    title: "Il Mio Scrigno",
    description: "Cataloga i tuoi gioielli preziosi. L'IA ti aiuterà a organizzarli e trovare abbinamenti.",
    addJewelry: "Aggiungi un gioiello",
    emptyState: "Il tuo scrigno è vuoto",
    emptyStateDesc: "Aggiungi i tuoi primi gioielli per iniziare",
    searchPlaceholder: "Cerca per nome, tag, descrizione...",
    allTypes: "Tutti i tipi",
    allMetals: "Tutti i metalli",
    allGems: "Tutte le gemme",
    allBrands: "Tutti i marchi",
    allCollections: "Tutte le collezioni",
    priceRange: "Fascia di prezzo",
  },

  // Wardrobe (Mon Dressing)
  wardrobe: {
    title: "Il Mio Guardaroba",
    description: "Gestisci i tuoi vestiti e crea look perfetti con i tuoi gioielli.",
    addClothing: "Aggiungi un capo",
    emptyState: "Il tuo guardaroba è vuoto",
    emptyStateDesc: "Aggiungi i tuoi primi capi per iniziare",
    searchPlaceholder: "Cerca (vestito rosso, camicia di seta...)",
    allCategories: "Tutte le categorie",
    allBrands: "Tutti i marchi",
    allColors: "Tutti i colori",
    priceMin: "Prezzo min",
    priceMax: "Prezzo max",
    selectItems: "Seleziona",
    deleteSelected: "Elimina selezionati",
  },

  // Clothing categories
  clothingCategories: {
    tops: "Top",
    bottoms: "Pantaloni",
    dresses: "Vestiti",
    jackets: "Giacche",
    shoes: "Scarpe",
    bags: "Borse",
    accessories: "Accessori",
  },

  // Boutique
  boutique: {
    title: "Boutique Style",
    description: "Scopri collezioni esclusive di marchi di lusso e stilisti esperti. Acquista il look con un clic.",
    exploreCollections: "Esplora le Collezioni",
    featuredPartners: "Partner in Evidenza",
    featuredLooks: "Look in Evidenza",
    allCollections: "Tutte le Collezioni",
    visitBrand: "Visita il Marchio",
    tryVirtually: "Prova virtualmente",
    addToFavorites: "Aggiungi ai preferiti",
    removeFromFavorites: "Rimuovi dai preferiti",
    premium: "Premium",
    artisanal: "Artigianale",
    handmade: "Fatto a mano",
    uniquePiece: "Pezzo unico",
    emptyState: "Nessuna collezione in evidenza al momento",
  },

  // AI Stylist
  aiStylist: {
    title: "Stilista IA",
    description: "Lascia che la nostra IA crei look perfetti per te",
    generateLooks: "Genera look",
    generating: "Generazione in corso...",
    occasion: "Occasione",
    season: "Stagione",
    confidence: "Fiducia",
    stylingTips: "Consigli di stile",
    saveLook: "Salva questo look",
    lookSaved: "Look salvato!",
    noClothes: "Aggiungi vestiti al tuo guardaroba",
    noJewelry: "Aggiungi gioielli ai tuoi preferiti",
  },

  // Occasions
  occasions: {
    casual: "Casual",
    work: "Lavoro",
    formal: "Sera",
    sport: "Sport",
    party: "Festa",
    all: "Tutte",
  },

  // Seasons
  seasons: {
    spring: "Primavera",
    summer: "Estate",
    fall: "Autunno",
    winter: "Inverno",
    all: "Tutte le stagioni",
  },

  // My Looks
  myLooks: {
    title: "I Miei Look",
    description: "I tuoi look salvati e le tue creazioni",
    emptyState: "Nessun look salvato",
    emptyStateDesc: "Usa lo Stilista IA per creare i tuoi primi look",
    sortByDate: "Data",
    sortByName: "Nome",
    sortByFavorites: "Preferiti",
    pieces: "pezzi",
    aiGenerated: "Generato da IA",
    shareLook: "Condividi questo look",
    deleteLook: "Elimina questo look",
    deleteConfirm: "Sei sicuro di voler eliminare questo look?",
  },

  // Share
  share: {
    title: "Condividi",
    shareOn: "Condividi su",
    copyLink: "Copia link",
    linkCopied: "Link copiato!",
    downloadImage: "Scarica immagine",
    instagram: "Instagram",
    whatsapp: "WhatsApp",
    twitter: "Twitter",
    facebook: "Facebook",
    pinterest: "Pinterest",
    more: "Altre opzioni",
  },

  // Profile
  profile: {
    title: "Il Mio Profilo",
    description: "Gestisci le tue informazioni personali e le preferenze di stile.",
    personalInfo: "Info Personali",
    stylePreferences: "Preferenze Stile",
    history: "Cronologia",
    myList: "La Mia Lista",
    biography: "Biografia",
    biographyPlaceholder: "Raccontaci di più sul tuo stile...",
    saveChanges: "Salva modifiche",
    anonymousUser: "Fashionista Anonimo",
    protectedIdentity: "Identità protetta",
  },

  // Settings
  settings: {
    title: "Impostazioni",
    language: "Lingua",
    theme: "Tema",
    notifications: "Notifiche",
    privacy: "Privacy",
    about: "Info",
    help: "Aiuto",
    logout: "Esci",
    deleteAccount: "Elimina account",
  },

  // Languages
  languages: {
    fr: "Français",
    en: "English",
    es: "Español",
    de: "Deutsch",
    it: "Italiano",
    pt: "Português",
  },

  // Subscription
  subscription: {
    title: "Abbonamento",
    free: "Gratuito",
    premium: "Premium",
    currentPlan: "Piano attuale",
    upgrade: "Passa a Premium",
    features: "Funzionalità incluse",
    unlimitedTryOns: "Prove illimitate",
    aiStylist: "Stilista IA",
    noWatermark: "Senza filigrana",
    prioritySupport: "Supporto prioritario",
    exclusiveCollections: "Collezioni esclusive",
  },

  // Partnership
  partnership: {
    title: "Gestione Partnership",
    description: "Informazioni di contatto per le partnership",
    becomePartner: "Diventa Partner",
    joinProgram: "Unisciti al nostro programma di partnership",
    contactInfo: "Per richieste di partnership, contattaci a:",
    responseTime: "Il nostro team ti risponderà al più presto.",
  },

  // Errors
  errors: {
    generic: "Si è verificato un errore",
    network: "Errore di connessione",
    notFound: "Non trovato",
    unauthorized: "Non autorizzato",
    serverError: "Errore del server",
    tryAgain: "Riprova",
    noInternet: "Nessuna connessione internet",
  },

  // Alerts
  alerts: {
    deleteConfirmTitle: "Conferma eliminazione",
    deleteConfirmMessage: "Questa azione non può essere annullata.",
    unsavedChanges: "Modifiche non salvate",
    unsavedChangesMessage: "Vuoi salvare le tue modifiche?",
    discardChanges: "Scarta",
    saveAndClose: "Salva e chiudi",
  },

  // Style Feed
  styleFeed: {
    title: "Il Mio Feed di Stile",
    description: "Ispirazioni quotidiane, tendenze e suggerimenti personalizzati solo per te.",
    welcomeBack: "Bentornato,",
    editStyle: "Modifica stile",
    tipOfTheDay: "Consiglio del giorno",
    forYou: "Per te",
    curatedForYou: "Selezionato in base al tuo profilo di stile",
    basedOnWishlist: "Basato sulla tua wishlist",
    recommendedJewelry: "Gioielli consigliati per te",
    trendAlert: "Avviso Tendenza",
    piecesToDiscover: "Pezzi da scoprire",
    seeDetail: "Vedi dettaglio",
  },

  // Atelier
  atelier: {
    title: "L'Atelier Creativo",
    description: "Prova gioielli e vestiti virtualmente in pochi secondi grazie all'IA.",
    step1: "Il Gioiello",
    step2: "Il Modello",
    step3: "La Magia",
    step4: "Il Risultato",
    choosePiece: "Scegli il pezzo",
    selectFromCollection: "Seleziona un articolo dalla tua collezione o importa una foto.",
    type: "Tipo",
    upload: "Carica",
    fromMyCollection: "Il Mio Scrigno",
    clickToImport: "Clicca per importare",
    supportedFormats: "JPG, PNG",
  },

  // Notifications
  notifications: {
    title: "Notifiche",
    dailySuggestions: "Suggerimenti giornalieri",
    dailySuggestionsDesc: "Ricevi suggerimenti di look basati sul meteo e la tua agenda",
    enabled: "Attivate",
    disabled: "Disattivate",
    notificationTime: "Orario notifica",
    morning: "Mattina (8:00)",
    evening: "Sera (20:00)",
    todayEvent: "Evento di oggi",
    selectEvent: "Seleziona il tipo di evento",
    testNotification: "Testa notifica",
    testSent: "Notifica di test inviata!",
    permissionRequired: "Permesso richiesto",
    permissionMessage: "Consenti le notifiche per ricevere suggerimenti di look giornalieri.",
    enableNotifications: "Attiva notifiche",
    yourLookToday: "Il tuo look di oggi",
    weatherBased: "Basato sul meteo",
    eventBased: "Basato sulla tua agenda",
    recommendedJewelry: "Gioielli consigliati",
    avoidJewelry: "Da evitare",
    recommendedMetals: "Metalli consigliati",
    stylingTips: "Consigli di stile",
    lookInspiration: "Ispirazione del giorno",
    moodKeywords: "Atmosfera",
    refreshSuggestion: "Aggiorna suggerimento",
    noSuggestionYet: "Nessun suggerimento ancora",
    generateFirst: "Genera il tuo primo suggerimento",
  },

  // Event types
  eventTypes: {
    work: "Lavoro",
    meeting: "Riunione",
    casual: "Casual",
    formal: "Evento formale",
    party: "Festa",
    date: "Appuntamento",
    wedding: "Matrimonio",
    sport: "Sport",
    travel: "Viaggio",
    interview: "Colloquio",
    presentation: "Presentazione",
    dinner: "Cena",
    brunch: "Brunch",
    shopping: "Shopping",
    none: "Giornata libera",
  },

  // Weather conditions
  weatherConditions: {
    sunny: "Soleggiato",
    cloudy: "Nuvoloso",
    rainy: "Piovoso",
    snowy: "Nevoso",
    stormy: "Tempestoso",
    foggy: "Nebbioso",
    windy: "Ventoso",
    hot: "Caldo",
    cold: "Freddo",
    mild: "Mite",
  },
};

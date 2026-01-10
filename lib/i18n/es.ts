/**
 * Spanish translations
 */
import { TranslationKeys } from "./fr";

export const es: TranslationKeys = {
  // Common
  common: {
    loading: "Cargando...",
    error: "Error",
    success: "Éxito",
    cancel: "Cancelar",
    save: "Guardar",
    delete: "Eliminar",
    edit: "Editar",
    share: "Compartir",
    close: "Cerrar",
    next: "Siguiente",
    previous: "Anterior",
    apply: "Aplicar",
    reset: "Restablecer",
    search: "Buscar",
    filter: "Filtrar",
    sort: "Ordenar",
    all: "Todos",
    none: "Ninguno",
    yes: "Sí",
    no: "No",
    ok: "OK",
    retry: "Reintentar",
    seeAll: "Ver todo",
    seeMore: "Ver más",
    seeLess: "Ver menos",
  },

  // App branding
  brand: {
    name: "Joyero Virtual",
    tagline: "Prueba virtual de joyas",
    slogan: "Prueba lo Inalcanzable Virtualmente.",
    watermark: "Joyero Virtual",
    createdWith: "Creado con Joyero Virtual",
    website: "joyerovirtual.app",
  },

  // Home screen
  home: {
    title: "Inicio",
    welcome: "Bienvenido",
    virtualTryOn: "Prueba Virtual",
    tryOnDescription: "Importa una joya, elige tu foto y deja que la magia suceda. Visualiza el resultado antes de comprar o solo para soñar.",
    newTryOn: "Nueva Prueba",
    photographer: "Fotografiar",
    captureJewelry: "Capturar una joya",
    myCollection: "Mi Colección",
    myCollectionDesc: "Mi colección",
    boutique: "Boutique",
    boutiqueDesc: "Diseñadores",
    premium: "Premium",
    premiumDesc: "Suscripción",
    recentItems: "Recientes",
  },

  // Try-on screen
  tryOn: {
    title: "Prueba",
    selectJewelry: "Seleccionar joya",
    selectModel: "Seleccionar modelo",
    selectStyle: "Seleccionar estilo",
    adjustSize: "Ajustar tamaño",
    takePhoto: "Tomar una foto",
    chooseFromGallery: "Elegir de la galería",
    aiPositioning: "Posicionamiento IA",
    manualPositioning: "Posicionamiento manual",
    saveTryOn: "Guardar prueba",
    quickSave: "Guardado rápido",
    editAndSave: "Editar y Guardar",
    shareResult: "Compartir resultado",
    savedToGallery: "Guardado en la galería",
    albumName: "Joyero Virtual",
  },

  // Jewelry types
  jewelryTypes: {
    necklace: "Collar",
    earrings: "Pendientes",
    ring: "Anillo",
    bracelet: "Pulsera",
    anklet: "Tobillera",
    brooch: "Broche",
    set: "Conjunto",
  },

  // Jewelry styles
  jewelryStyles: {
    gold: "Oro",
    silver: "Plata",
    rosegold: "Oro Rosa",
    platinum: "Platino",
    bronze: "Bronce",
  },

  // Photo editor
  photoEditor: {
    title: "Editor de fotos",
    filters: "Filtros",
    retouch: "Retoque",
    crop: "Recortar",
    rotate: "Rotar",
    brightness: "Brillo",
    contrast: "Contraste",
    saturation: "Saturación",
    warmth: "Calidez",
    vignette: "Viñeta",
    original: "Original",
    glamour: "Glamour",
    vintage: "Vintage",
    blackAndWhite: "B&N",
    golden: "Dorado",
    cold: "Frío",
    rose: "Rosa",
    dramatic: "Dramático",
    beforeAfter: "Antes/Después",
    aspectRatio: "Proporción",
    free: "Libre",
    flipHorizontal: "Voltear H",
    flipVertical: "Voltear V",
  },

  // My collection (Mon Écrin)
  myCollection: {
    title: "Mi Colección",
    description: "Cataloga tus joyas preciosas. La IA te ayudará a organizarlas y encontrar combinaciones.",
    addJewelry: "Añadir joya",
    emptyState: "Tu colección está vacía",
    emptyStateDesc: "Añade tus primeras joyas para empezar",
    searchPlaceholder: "Buscar por nombre, etiquetas, descripción...",
    allTypes: "Todos los tipos",
    allMetals: "Todos los metales",
    allGems: "Todas las gemas",
    allBrands: "Todas las marcas",
    allCollections: "Todas las colecciones",
    priceRange: "Rango de precio",
  },

  // Wardrobe (Mon Dressing)
  wardrobe: {
    title: "Mi Armario",
    description: "Gestiona tu ropa y crea looks perfectos con tus joyas.",
    addClothing: "Añadir prenda",
    emptyState: "Tu armario está vacío",
    emptyStateDesc: "Añade tu primera ropa para empezar",
    searchPlaceholder: "Buscar (vestido rojo, camisa seda...)",
    allCategories: "Todas las categorías",
    allBrands: "Todas las marcas",
    allColors: "Todos los colores",
    priceMin: "Precio mín",
    priceMax: "Precio máx",
    selectItems: "Seleccionar",
    deleteSelected: "Eliminar selección",
  },

  // Clothing categories
  clothingCategories: {
    tops: "Tops",
    bottoms: "Pantalones",
    dresses: "Vestidos",
    jackets: "Chaquetas",
    shoes: "Zapatos",
    bags: "Bolsos",
    accessories: "Accesorios",
  },

  // Boutique
  boutique: {
    title: "Boutique de Estilo Seleccionado",
    description: "Descubre colecciones exclusivas de marcas de lujo y estilistas expertos. Compra el look en un clic.",
    exploreCollections: "Explorar Colecciones",
    featuredPartners: "Socios Destacados",
    featuredLooks: "Looks Destacados",
    allCollections: "Todas las Colecciones",
    visitBrand: "Visitar Marca",
    tryVirtually: "Probar virtualmente",
    addToFavorites: "Añadir a favoritos",
    removeFromFavorites: "Quitar de favoritos",
    premium: "premium",
    artisanal: "artesanal",
    handmade: "hecho a mano",
    uniquePiece: "pieza única",
    emptyState: "No hay colecciones destacadas por el momento",
  },

  // AI Stylist
  aiStylist: {
    title: "Estilista IA",
    description: "Deja que nuestra IA cree looks perfectos para ti",
    generateLooks: "Generar looks",
    generating: "Generando...",
    occasion: "Ocasión",
    season: "Temporada",
    confidence: "Confianza",
    stylingTips: "Consejos de estilo",
    saveLook: "Guardar este look",
    lookSaved: "¡Look guardado!",
    noClothes: "Añade ropa a tu armario",
    noJewelry: "Añade joyas a tus favoritos",
  },

  // Occasions
  occasions: {
    casual: "Casual",
    work: "Trabajo",
    formal: "Formal",
    sport: "Deporte",
    party: "Fiesta",
    all: "Todas",
  },

  // Seasons
  seasons: {
    spring: "Primavera",
    summer: "Verano",
    fall: "Otoño",
    winter: "Invierno",
    all: "Todas las temporadas",
  },

  // My Looks
  myLooks: {
    title: "Mis Looks",
    description: "Tus looks guardados y creaciones",
    emptyState: "No hay looks guardados",
    emptyStateDesc: "Usa el Estilista IA para crear tus primeros looks",
    sortByDate: "Fecha",
    sortByName: "Nombre",
    sortByFavorites: "Favoritos",
    pieces: "piezas",
    aiGenerated: "Generado por IA",
    shareLook: "Compartir este look",
    deleteLook: "Eliminar este look",
    deleteConfirm: "¿Estás seguro de que quieres eliminar este look?",
  },

  // Share
  share: {
    title: "Compartir",
    shareOn: "Compartir en",
    copyLink: "Copiar enlace",
    linkCopied: "¡Enlace copiado!",
    downloadImage: "Descargar imagen",
    instagram: "Instagram",
    whatsapp: "WhatsApp",
    twitter: "Twitter",
    facebook: "Facebook",
    pinterest: "Pinterest",
    more: "Más opciones",
  },

  // Profile
  profile: {
    title: "Mi Perfil",
    description: "Gestiona tu información personal y preferencias de estilo.",
    personalInfo: "Info Personal",
    stylePreferences: "Preferencias de Estilo",
    history: "Historial",
    myList: "Mi Lista",
    biography: "Biografía",
    biographyPlaceholder: "Cuéntanos más sobre tu estilo...",
    saveChanges: "Guardar cambios",
    anonymousUser: "Fashionista Anónimo",
    protectedIdentity: "Identidad protegida",
  },

  // Settings
  settings: {
    title: "Ajustes",
    language: "Idioma",
    theme: "Tema",
    notifications: "Notificaciones",
    privacy: "Privacidad",
    about: "Acerca de",
    help: "Ayuda",
    logout: "Cerrar sesión",
    deleteAccount: "Eliminar cuenta",
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
    title: "Suscripción",
    free: "Gratis",
    premium: "Premium",
    currentPlan: "Plan actual",
    upgrade: "Actualizar a Premium",
    features: "Funciones incluidas",
    unlimitedTryOns: "Pruebas ilimitadas",
    aiStylist: "Estilista IA",
    noWatermark: "Sin marca de agua",
    prioritySupport: "Soporte prioritario",
    exclusiveCollections: "Colecciones exclusivas",
  },

  // Partnership
  partnership: {
    title: "Gestión de Asociaciones",
    description: "Información de contacto para asociaciones",
    becomePartner: "Convertirse en Socio",
    joinProgram: "Únete a nuestro programa de socios",
    contactInfo: "Para cualquier consulta de asociación, contáctanos en:",
    responseTime: "Nuestro equipo responderá lo antes posible.",
  },

  // Errors
  errors: {
    generic: "Ha ocurrido un error",
    network: "Error de conexión",
    notFound: "No encontrado",
    unauthorized: "No autorizado",
    serverError: "Error del servidor",
    tryAgain: "Por favor, inténtalo de nuevo",
    noInternet: "Sin conexión a internet",
  },

  // Alerts
  alerts: {
    deleteConfirmTitle: "Confirmar eliminación",
    deleteConfirmMessage: "Esta acción no se puede deshacer.",
    unsavedChanges: "Cambios sin guardar",
    unsavedChangesMessage: "¿Quieres guardar tus cambios?",
    discardChanges: "Descartar",
    saveAndClose: "Guardar y cerrar",
  },

  // Style Feed
  styleFeed: {
    title: "Mi Feed de Estilo",
    description: "Inspiraciones diarias, tendencias y sugerencias personalizadas solo para ti.",
    welcomeBack: "Bienvenido de nuevo,",
    editStyle: "Editar estilo",
    tipOfTheDay: "Consejo del día",
    forYou: "Para Ti",
    curatedForYou: "Seleccionado según tu perfil de estilo",
    basedOnWishlist: "Basado en tu lista de deseos",
    recommendedJewelry: "Joyas recomendadas para ti",
    trendAlert: "Alerta de Tendencia",
    piecesToDiscover: "Piezas de moda por descubrir",
    seeDetail: "Ver detalle",
  },

  // Atelier
  atelier: {
    title: "El Taller de Creación",
    description: "Prueba joyas y ropa virtualmente en segundos con IA.",
    step1: "La Joya",
    step2: "El Modelo",
    step3: "La Magia",
    step4: "El Resultado",
    choosePiece: "Elige la pieza",
    selectFromCollection: "Selecciona un artículo de tu colección o importa una foto.",
    type: "Tipo",
    upload: "Subir",
    fromMyCollection: "Mi Colección",
    clickToImport: "Haz clic para importar",
    supportedFormats: "JPG, PNG",
  },
} as const;

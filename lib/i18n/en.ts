/**
 * English translations
 */
import { TranslationKeys } from "./fr";

export const en: TranslationKeys = {
  // Common
  common: {
    loading: "Loading...",
    error: "Error",
    success: "Success",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    share: "Share",
    close: "Close",
    next: "Next",
    previous: "Previous",
    apply: "Apply",
    reset: "Reset",
    search: "Search",
    filter: "Filter",
    sort: "Sort",
    all: "All",
    none: "None",
    yes: "Yes",
    no: "No",
    ok: "OK",
    retry: "Retry",
    seeAll: "See all",
    seeMore: "See more",
    seeLess: "See less",
  },

  // App branding
  brand: {
    name: "Virtual Jewelry Box",
    tagline: "Virtual jewelry try-on",
    slogan: "Try the Unattainable Virtually.",
    watermark: "Virtual Jewelry Box",
    createdWith: "Created with Virtual Jewelry Box",
    website: "virtualjewelrybox.app",
  },

  // Home screen
  home: {
    title: "Home",
    welcome: "Welcome",
    virtualTryOn: "Virtual Try-On",
    tryOnDescription: "Import a piece of jewelry, choose your photo, and let the magic happen. See the result before buying or just to dream.",
    newTryOn: "New Try-On",
    photographer: "Photograph",
    captureJewelry: "Capture a jewelry",
    myCollection: "My Collection",
    myCollectionDesc: "My collection",
    boutique: "Boutique",
    boutiqueDesc: "Designers",
    premium: "Premium",
    premiumDesc: "Subscription",
    recentItems: "Recent",
  },

  // Try-on screen
  tryOn: {
    title: "Try-On",
    selectJewelry: "Select jewelry",
    selectModel: "Select model",
    selectStyle: "Select style",
    adjustSize: "Adjust size",
    takePhoto: "Take a photo",
    chooseFromGallery: "Choose from gallery",
    aiPositioning: "AI Positioning",
    manualPositioning: "Manual positioning",
    saveTryOn: "Save try-on",
    quickSave: "Quick save",
    editAndSave: "Edit & Save",
    shareResult: "Share result",
    savedToGallery: "Saved to gallery",
    albumName: "Virtual Jewelry Box",
  },

  // Jewelry types
  jewelryTypes: {
    necklace: "Necklace",
    earrings: "Earrings",
    ring: "Ring",
    bracelet: "Bracelet",
    anklet: "Anklet",
    brooch: "Brooch",
    set: "Set",
  },

  // Jewelry styles
  jewelryStyles: {
    gold: "Gold",
    silver: "Silver",
    rosegold: "Rose Gold",
    platinum: "Platinum",
    bronze: "Bronze",
  },

  // Photo editor
  photoEditor: {
    title: "Photo editor",
    filters: "Filters",
    retouch: "Retouch",
    crop: "Crop",
    rotate: "Rotate",
    brightness: "Brightness",
    contrast: "Contrast",
    saturation: "Saturation",
    warmth: "Warmth",
    vignette: "Vignette",
    original: "Original",
    glamour: "Glamour",
    vintage: "Vintage",
    blackAndWhite: "B&W",
    golden: "Golden",
    cold: "Cold",
    rose: "Rose",
    dramatic: "Dramatic",
    beforeAfter: "Before/After",
    aspectRatio: "Aspect ratio",
    free: "Free",
    flipHorizontal: "Flip H",
    flipVertical: "Flip V",
  },

  // My collection (Mon Écrin)
  myCollection: {
    title: "My Collection",
    description: "Catalog your precious jewelry. AI will help you organize them and find matches.",
    addJewelry: "Add jewelry",
    emptyState: "Your collection is empty",
    emptyStateDesc: "Add your first jewelry to get started",
    searchPlaceholder: "Search by name, tags, description...",
    allTypes: "All types",
    allMetals: "All metals",
    allGems: "All gems",
    allBrands: "All brands",
    allCollections: "All collections",
    priceRange: "Price range",
  },

  // Wardrobe (Mon Dressing)
  wardrobe: {
    title: "My Wardrobe",
    description: "Manage your clothes and create perfect looks with your jewelry.",
    addClothing: "Add clothing",
    emptyState: "Your wardrobe is empty",
    emptyStateDesc: "Add your first clothes to get started",
    searchPlaceholder: "Search (red dress, silk shirt...)",
    allCategories: "All categories",
    allBrands: "All brands",
    allColors: "All colors",
    priceMin: "Min price",
    priceMax: "Max price",
    selectItems: "Select",
    deleteSelected: "Delete selected",
  },

  // Clothing categories
  clothingCategories: {
    tops: "Tops",
    bottoms: "Bottoms",
    dresses: "Dresses",
    jackets: "Jackets",
    shoes: "Shoes",
    bags: "Bags",
    accessories: "Accessories",
  },

  // Boutique
  boutique: {
    title: "Curated Style Boutique",
    description: "Discover exclusive collections from luxury brands and expert stylists. Shop the look in one click.",
    exploreCollections: "Explore Collections",
    featuredPartners: "Featured Partners",
    featuredLooks: "Featured Looks",
    allCollections: "All Collections",
    visitBrand: "Visit Brand",
    tryVirtually: "Try virtually",
    addToFavorites: "Add to favorites",
    removeFromFavorites: "Remove from favorites",
    premium: "premium",
    artisanal: "artisanal",
    handmade: "handmade",
    uniquePiece: "unique piece",
    emptyState: "No featured collections at the moment",
  },

  // AI Stylist
  aiStylist: {
    title: "AI Stylist",
    description: "Let our AI create perfect looks for you",
    generateLooks: "Generate looks",
    generating: "Generating...",
    occasion: "Occasion",
    season: "Season",
    confidence: "Confidence",
    stylingTips: "Styling tips",
    saveLook: "Save this look",
    lookSaved: "Look saved!",
    noClothes: "Add clothes to your wardrobe",
    noJewelry: "Add jewelry to your favorites",
  },

  // Occasions
  occasions: {
    casual: "Casual",
    work: "Work",
    formal: "Formal",
    sport: "Sport",
    party: "Party",
    all: "All",
  },

  // Seasons
  seasons: {
    spring: "Spring",
    summer: "Summer",
    fall: "Fall",
    winter: "Winter",
    all: "All seasons",
  },

  // My Looks
  myLooks: {
    title: "My Looks",
    description: "Your saved looks and creations",
    emptyState: "No saved looks",
    emptyStateDesc: "Use AI Stylist to create your first looks",
    sortByDate: "Date",
    sortByName: "Name",
    sortByFavorites: "Favorites",
    pieces: "pieces",
    aiGenerated: "AI Generated",
    shareLook: "Share this look",
    deleteLook: "Delete this look",
    deleteConfirm: "Are you sure you want to delete this look?",
  },

  // Share
  share: {
    title: "Share",
    shareOn: "Share on",
    copyLink: "Copy link",
    linkCopied: "Link copied!",
    downloadImage: "Download image",
    instagram: "Instagram",
    whatsapp: "WhatsApp",
    twitter: "Twitter",
    facebook: "Facebook",
    pinterest: "Pinterest",
    more: "More options",
  },

  // Profile
  profile: {
    title: "My Profile",
    description: "Manage your personal information and style preferences.",
    personalInfo: "Personal Info",
    stylePreferences: "Style Preferences",
    history: "History",
    myList: "My List",
    biography: "Biography",
    biographyPlaceholder: "Tell us more about your style...",
    saveChanges: "Save changes",
    anonymousUser: "Anonymous Fashionista",
    protectedIdentity: "Protected identity",
  },

  // Settings
  settings: {
    title: "Settings",
    language: "Language",
    theme: "Theme",
    notifications: "Notifications",
    privacy: "Privacy",
    about: "About",
    help: "Help",
    logout: "Log out",
    deleteAccount: "Delete account",
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
    title: "Subscription",
    free: "Free",
    premium: "Premium",
    currentPlan: "Current plan",
    upgrade: "Upgrade to Premium",
    features: "Included features",
    unlimitedTryOns: "Unlimited try-ons",
    aiStylist: "AI Stylist",
    noWatermark: "No watermark",
    prioritySupport: "Priority support",
    exclusiveCollections: "Exclusive collections",
  },

  // Partnership
  partnership: {
    title: "Partnership Management",
    description: "Contact information for partnerships",
    becomePartner: "Become a Partner",
    joinProgram: "Join our partnership program",
    contactInfo: "For any partnership inquiry, please contact us at:",
    responseTime: "Our team will respond as soon as possible.",
  },

  // Errors
  errors: {
    generic: "An error occurred",
    network: "Connection error",
    notFound: "Not found",
    unauthorized: "Unauthorized",
    serverError: "Server error",
    tryAgain: "Please try again",
    noInternet: "No internet connection",
  },

  // Alerts
  alerts: {
    deleteConfirmTitle: "Confirm deletion",
    deleteConfirmMessage: "This action cannot be undone.",
    unsavedChanges: "Unsaved changes",
    unsavedChangesMessage: "Do you want to save your changes?",
    discardChanges: "Discard",
    saveAndClose: "Save and close",
  },

  // Style Feed
  styleFeed: {
    title: "My Style Feed",
    description: "Daily inspirations, trends and personalized suggestions just for you.",
    welcomeBack: "Welcome back,",
    editStyle: "Edit style",
    tipOfTheDay: "Tip of the day",
    forYou: "For You",
    curatedForYou: "Curated based on your style profile",
    basedOnWishlist: "Based on your wishlist",
    recommendedJewelry: "Recommended jewelry for you",
    trendAlert: "Trend Alert",
    piecesToDiscover: "Fashion pieces to discover",
    seeDetail: "See detail",
  },

  // Atelier
  atelier: {
    title: "The Creation Studio",
    description: "Try on jewelry and clothes virtually in seconds with AI.",
    step1: "The Jewelry",
    step2: "The Model",
    step3: "The Magic",
    step4: "The Result",
    choosePiece: "Choose the piece",
    selectFromCollection: "Select an item from your collection or import a photo.",
    type: "Type",
    upload: "Upload",
    fromMyCollection: "My Collection",
    clickToImport: "Click to import",
    supportedFormats: "JPG, PNG",
  },

  // Notifications
  notifications: {
    title: "Notifications",
    dailySuggestions: "Daily Suggestions",
    dailySuggestionsDesc: "Receive look suggestions based on weather and your schedule",
    enabled: "Enabled",
    disabled: "Disabled",
    notificationTime: "Notification Time",
    morning: "Morning (8:00 AM)",
    evening: "Evening (8:00 PM)",
    todayEvent: "Today's Event",
    selectEvent: "Select event type",
    testNotification: "Test Notification",
    testSent: "Test notification sent!",
    permissionRequired: "Permission Required",
    permissionMessage: "Allow notifications to receive daily look suggestions.",
    enableNotifications: "Enable Notifications",
    yourLookToday: "Your Look Today",
    weatherBased: "Based on weather",
    eventBased: "Based on your schedule",
    recommendedJewelry: "Recommended Jewelry",
    avoidJewelry: "Avoid",
    recommendedMetals: "Recommended Metals",
    stylingTips: "Styling Tips",
    lookInspiration: "Today's Inspiration",
    moodKeywords: "Mood",
    refreshSuggestion: "Refresh Suggestion",
    noSuggestionYet: "No suggestion yet",
    generateFirst: "Generate your first suggestion",
  },

  // Event types
  eventTypes: {
    work: "Work",
    meeting: "Meeting",
    casual: "Casual",
    formal: "Formal Event",
    party: "Party",
    date: "Date",
    wedding: "Wedding",
    sport: "Sport",
    travel: "Travel",
    interview: "Interview",
    presentation: "Presentation",
    dinner: "Dinner",
    brunch: "Brunch",
    shopping: "Shopping",
    none: "Free Day",
  },

  // Weather conditions
  weatherConditions: {
    sunny: "Sunny",
    cloudy: "Cloudy",
    rainy: "Rainy",
    snowy: "Snowy",
    stormy: "Stormy",
    foggy: "Foggy",
    windy: "Windy",
    hot: "Hot",
    cold: "Cold",
    mild: "Mild",
  },
} as const;

/**
 * AI Stylist — Local Algorithm
 *
 * All look generation is computed locally on the server.
 * No user data (wardrobe items, jewelry, descriptions) is sent to any
 * third-party AI provider. This complies with Apple guideline 2.1.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WardrobeItemForStyling {
  id: string;
  name: string;
  category: string;
  brand?: string | null;
  color?: string | null;
  material?: string | null;
  imageUrl?: string | null;
  season?: string | null;
  occasion?: string | null;
}

export interface JewelryItemForStyling {
  id: string;
  name: string;
  type: string;
  metal?: string | null;
  gem?: string | null;
  brand?: string | null;
  imageUrl?: string | null;
}

export interface LookSuggestion {
  name: string;
  description: string;
  occasion: "casual" | "work" | "formal" | "sport" | "party" | "all";
  season: "spring" | "summer" | "fall" | "winter" | "all";
  wardrobeItemIds: string[];
  jewelryItemIds: string[];
  stylingTips: string;
  confidence: number;
}

export interface StylistRequest {
  wardrobeItems: WardrobeItemForStyling[];
  jewelryItems: JewelryItemForStyling[];
  occasion?: string;
  season?: string;
  style?: string;
  count?: number;
}

// ─── Color Harmony ───────────────────────────────────────────────────────────

const COLOR_FAMILIES: Record<string, string[]> = {
  neutrals: ["blanc", "white", "noir", "black", "gris", "grey", "gray", "beige", "crème", "cream", "écru", "nude", "ivoire", "ivory", "taupe"],
  earth: ["marron", "brown", "camel", "caramel", "chocolat", "terre", "sable", "tan", "cognac", "miel"],
  blues: ["bleu", "blue", "marine", "navy", "cobalt", "indigo", "ciel", "turquoise", "saphir", "denim"],
  reds: ["rouge", "red", "bordeaux", "burgundy", "corail", "coral", "rose", "pink", "framboise", "cerise", "fuschia", "vermillon"],
  greens: ["vert", "green", "olive", "kaki", "khaki", "menthe", "emeraude", "sauge", "forêt", "forest", "lime"],
  yellows: ["jaune", "yellow", "or", "gold", "moutarde", "mustard", "citron", "doré"],
  purples: ["violet", "purple", "lilas", "lilac", "lavande", "lavender", "mauve", "prune", "aubergine"],
};

// Pairs of color families that work well together
const HARMONIOUS_PAIRS = [
  ["neutrals", "neutrals"],
  ["neutrals", "blues"],
  ["neutrals", "reds"],
  ["neutrals", "greens"],
  ["neutrals", "yellows"],
  ["neutrals", "purples"],
  ["neutrals", "earth"],
  ["earth", "blues"],
  ["earth", "greens"],
  ["earth", "reds"],
  ["blues", "yellows"],
  ["blues", "reds"],
  ["reds", "neutrals"],
  ["greens", "yellows"],
  ["greens", "earth"],
];

function getColorFamily(color: string | null | undefined): string {
  if (!color) return "neutrals";
  const c = color.toLowerCase();
  for (const [family, keywords] of Object.entries(COLOR_FAMILIES)) {
    if (keywords.some((k) => c.includes(k))) return family;
  }
  return "neutrals";
}

function colorsHarmonize(colorA: string | null | undefined, colorB: string | null | undefined): boolean {
  const fA = getColorFamily(colorA);
  const fB = getColorFamily(colorB);
  return HARMONIOUS_PAIRS.some(
    ([a, b]) => (a === fA && b === fB) || (a === fB && b === fA)
  );
}

function colorHarmonyScore(items: WardrobeItemForStyling[]): number {
  if (items.length <= 1) return 85;
  let hits = 0;
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      total++;
      if (colorsHarmonize(items[i].color, items[j].color)) hits++;
    }
  }
  return total === 0 ? 80 : Math.round((hits / total) * 40 + 60);
}

// ─── Occasion Matching ───────────────────────────────────────────────────────

type OccasionType = "casual" | "work" | "formal" | "sport" | "party" | "all";

const OCCASION_KEYWORDS: Record<OccasionType, string[]> = {
  casual: ["casual", "décontracté", "quotidien", "everyday", "journée", "week-end"],
  work: ["travail", "bureau", "business", "professionnel", "réunion", "meeting"],
  formal: ["soirée", "gala", "élégant", "chic", "cocktail", "formel", "formal"],
  sport: ["sport", "gym", "running", "yoga", "fitness", "entraînement"],
  party: ["fête", "party", "club", "sortie", "anniversaire", "festif"],
  all: [],
};

function matchOccasion(item: WardrobeItemForStyling, target: OccasionType): boolean {
  if (!item.occasion) return true;
  const occ = item.occasion.toLowerCase();
  if (occ === "all" || target === "all") return true;
  const keywords = OCCASION_KEYWORDS[target] ?? [];
  return keywords.some((k) => occ.includes(k)) || occ.includes(target);
}

function detectOccasionFromItems(items: WardrobeItemForStyling[]): OccasionType {
  const counts: Record<OccasionType, number> = {
    casual: 0, work: 0, formal: 0, sport: 0, party: 0, all: 0,
  };
  for (const item of items) {
    if (!item.occasion) continue;
    const occ = item.occasion.toLowerCase();
    for (const [occ_key, keywords] of Object.entries(OCCASION_KEYWORDS) as [OccasionType, string[]][]) {
      if (keywords.some((k) => occ.includes(k)) || occ.includes(occ_key)) {
        counts[occ_key]++;
      }
    }
  }
  const best = (Object.entries(counts) as [OccasionType, number][])
    .filter(([k]) => k !== "all")
    .sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : "casual";
}

// ─── Season Matching ─────────────────────────────────────────────────────────

type SeasonType = "spring" | "summer" | "fall" | "winter" | "all";

const SEASON_KEYWORDS: Record<SeasonType, string[]> = {
  spring: ["printemps", "spring", "mi-saison"],
  summer: ["été", "summer", "estival", "chaud"],
  fall: ["automne", "fall", "autumn"],
  winter: ["hiver", "winter", "hivernal", "froid"],
  all: ["all", "toutes", "toutes saisons"],
};

const MATERIAL_SEASON: Record<string, SeasonType[]> = {
  lin: ["spring", "summer"],
  linen: ["spring", "summer"],
  coton: ["spring", "summer"],
  cotton: ["spring", "summer"],
  soie: ["spring", "summer", "fall"],
  silk: ["spring", "summer", "fall"],
  laine: ["fall", "winter"],
  wool: ["fall", "winter"],
  cachemire: ["fall", "winter"],
  cashmere: ["fall", "winter"],
  velours: ["fall", "winter"],
  velvet: ["fall", "winter"],
  cuir: ["fall", "winter"],
  leather: ["fall", "winter"],
  denim: ["spring", "fall"],
};

function itemMatchesSeason(item: WardrobeItemForStyling, targetSeason: SeasonType): boolean {
  if (targetSeason === "all") return true;

  // Check declared season
  if (item.season) {
    const s = item.season.toLowerCase();
    if (s === "all" || SEASON_KEYWORDS.all.some((k) => s.includes(k))) return true;
    if (SEASON_KEYWORDS[targetSeason].some((k) => s.includes(k))) return true;
  }

  // Check material
  if (item.material) {
    const m = item.material.toLowerCase();
    for (const [mat, seasons] of Object.entries(MATERIAL_SEASON)) {
      if (m.includes(mat) && seasons.includes(targetSeason)) return true;
    }
  }

  // Default: include if no season info
  return !item.season && !item.material;
}

// ─── Look Name & Description Generator ──────────────────────────────────────

const LOOK_NAMES: Record<OccasionType, string[]> = {
  casual: ["Casual Chic", "Décontracté Élégant", "Style Quotidien", "Confort & Style", "Everyday Luxe"],
  work: ["Business Casual", "Look Bureau", "Professionnel & Chic", "Corporate Élégant", "Style Réunion"],
  formal: ["Soirée Étoilée", "Élégance Absolue", "Glamour Nocturne", "Chic & Sophistiqué", "Grand Soir"],
  sport: ["Active Chic", "Sportswear Élégant", "Athleisure", "Look Gym", "Sport & Style"],
  party: ["Nuit Festive", "Party Chic", "Éclat & Couleur", "Soirée Animée", "Look Club"],
  all: ["Look Polyvalent", "Style Intemporel", "L'Essentiel", "Classique Moderne"],
};

const LOOK_DESCRIPTIONS: Record<OccasionType, string[]> = {
  casual: [
    "Un ensemble décontracté qui allie confort et élégance pour toutes vos journées.",
    "Des pièces harmonieuses pour un look facile à porter au quotidien.",
    "La combinaison parfaite pour rester stylé(e) sans effort.",
  ],
  work: [
    "Un look professionnel qui impose le respect tout en restant accessible.",
    "L'équilibre idéal entre sérieux et personnalité pour le bureau.",
    "Des pièces bien choisies pour briller lors de vos réunions.",
  ],
  formal: [
    "Une tenue élégante qui vous hissera au niveau des plus grandes occasions.",
    "Le raffinement à son apogée pour vos soirées mémorables.",
    "Une sélection sophistiquée pour faire impression lors des événements chics.",
  ],
  sport: [
    "Des pièces fonctionnelles et stylées pour vos séances actives.",
    "Le bon équilibre entre performance et style pour vos entraînements.",
    "Un look dynamique qui ne sacrifie pas l'esthétique.",
  ],
  party: [
    "Une tenue festive pour briller lors de vos sorties.",
    "Des pièces audacieuses pour une nuit mémorable.",
    "Le bon mélange d'éclat et de style pour faire sensation.",
  ],
  all: [
    "Un ensemble versatile qui s'adapte à toutes vos activités.",
    "Des pièces intemporelles qui fonctionnent dans de nombreux contextes.",
  ],
};

const STYLING_TIPS: Record<OccasionType, string[]> = {
  casual: [
    "Roulez légèrement les manches pour une touche décontractée. Ajoutez une montre fine ou un bracelet discret pour élever le look sans l'alourdir.",
    "Optez pour des chaussures propres et simples. Une touche de bijou doré suffit pour passer de casual à casual chic.",
    "Jouez avec les textures : associez du coton doux à un denim structuré pour un contraste élégant.",
  ],
  work: [
    "Assurez-vous que les pièces sont bien repassées. Un bijou sobre (perles, or fin) renforce votre crédibilité professionnelle.",
    "Préférez des couleurs cohérentes et évitez les imprimés trop forts. Une montre élégante complète parfaitement.",
    "Vérifiez que les ourlets sont ajustés à votre morphologie — rien ne fait plus professionnel qu'un vêtement bien taillé.",
  ],
  formal: [
    "Misez sur un bijou statement : collier ou boucles d'oreilles. Évitez de tout cumuler — choisissez une pièce forte.",
    "Soignez les détails : chaussures cirées, bijoux en accord avec les tons du vêtement, sac structuré.",
    "Une touche de parfum discret complète une tenue de soirée mieux que tout autre accessoire.",
  ],
  sport: [
    "Assurez-vous que les matières respirantes dominent. Évitez les bijoux qui pourraient gêner les mouvements.",
    "Des sneakers propres et de bonne qualité élévent n'importe quel look sportswear.",
    "Limitez les accessoires à une montre de sport ou une simple bague fine.",
  ],
  party: [
    "N'ayez pas peur de porter une pièce audacieuse — les soirées sont faites pour ça.",
    "Un sac clutch et des bijoux qui captent la lumière feront toute la différence.",
    "Pensez à votre confort : vous danserez peut-être, choisissez des chaussures en conséquence.",
  ],
  all: [
    "Un accessoire bien choisi (bijou, foulard) suffit à transformer un look basique en ensemble coordonné.",
    "Misez sur les coupes classiques qui traversent les tendances et restent élégantes quelles que soient les circonstances.",
  ],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getLookName(occasion: OccasionType, index: number): string {
  const names = LOOK_NAMES[occasion] ?? LOOK_NAMES.all;
  return names[index % names.length];
}

// ─── Core Algorithm ───────────────────────────────────────────────────────────

const OUTFIT_LAYERS = ["tops", "shirts", "blouses", "hauts"] as const;
const OUTFIT_BOTTOMS = ["bottoms", "pants", "skirts", "jeans", "shorts", "bas"] as const;
const OUTFIT_DRESSES = ["dresses", "robes", "combinaisons", "jumpsuits"] as const;
const OUTFIT_OUTERWEAR = ["jackets", "coats", "vestes", "manteaux", "blazers"] as const;

function normalizeCategory(cat: string): "top" | "bottom" | "dress" | "outerwear" | "other" {
  const c = cat.toLowerCase();
  if (OUTFIT_LAYERS.some((k) => c.includes(k))) return "top";
  if (OUTFIT_BOTTOMS.some((k) => c.includes(k))) return "bottom";
  if (OUTFIT_DRESSES.some((k) => c.includes(k))) return "dress";
  if (OUTFIT_OUTERWEAR.some((k) => c.includes(k))) return "outerwear";
  return "other";
}

interface CandidateLook {
  items: WardrobeItemForStyling[];
  jewelry: JewelryItemForStyling[];
  score: number;
  occasion: OccasionType;
}

function buildCandidates(
  wardrobeItems: WardrobeItemForStyling[],
  jewelryItems: JewelryItemForStyling[],
  targetOccasion: OccasionType,
  targetSeason: SeasonType,
  count: number
): CandidateLook[] {
  const categorized = {
    tops: wardrobeItems.filter((i) => normalizeCategory(i.category) === "top"),
    bottoms: wardrobeItems.filter((i) => normalizeCategory(i.category) === "bottom"),
    dresses: wardrobeItems.filter((i) => normalizeCategory(i.category) === "dress"),
    outerwear: wardrobeItems.filter((i) => normalizeCategory(i.category) === "outerwear"),
    other: wardrobeItems.filter((i) => normalizeCategory(i.category) === "other"),
  };

  // Apply occasion + season filters
  const filter = (items: WardrobeItemForStyling[]) =>
    items.filter(
      (i) =>
        (targetOccasion === "all" || matchOccasion(i, targetOccasion)) &&
        itemMatchesSeason(i, targetSeason)
    );

  const tops = filter(categorized.tops).length > 0 ? filter(categorized.tops) : categorized.tops;
  const bottoms = filter(categorized.bottoms).length > 0 ? filter(categorized.bottoms) : categorized.bottoms;
  const dresses = filter(categorized.dresses).length > 0 ? filter(categorized.dresses) : categorized.dresses;
  const outerwear = filter(categorized.outerwear);

  const candidates: CandidateLook[] = [];
  const usedKeySet = new Set<string>();

  const tryAddLook = (items: WardrobeItemForStyling[]) => {
    if (items.length === 0) return;
    const key = items.map((i) => i.id).sort().join("|");
    if (usedKeySet.has(key)) return;
    usedKeySet.add(key);

    const score = colorHarmonyScore(items);
    const detectedOccasion =
      targetOccasion !== "all" ? targetOccasion : detectOccasionFromItems(items);

    // Find the best matching jewelry
    const matchingJewelry = jewelryItems
      .filter((j) => {
        // Match metal to color family
        const metal = (j.metal ?? "").toLowerCase();
        const hasGold = metal.includes("or") || metal.includes("gold") || metal.includes("doré");
        const hasSilver = metal.includes("argent") || metal.includes("silver") || metal.includes("acier");
        const topColors = items.map((i) => getColorFamily(i.color));
        if (hasGold && topColors.some((fam) => ["yellows", "earth", "reds"].includes(fam))) return true;
        if (hasSilver && topColors.some((fam) => ["blues", "neutrals", "purples"].includes(fam))) return true;
        return true; // include all if no clear match
      })
      .slice(0, 2);

    candidates.push({ items, jewelry: matchingJewelry, score, occasion: detectedOccasion });
  };

  // Strategy 1: dress-based looks
  for (const dress of dresses) {
    const jacket = outerwear.find((o) => colorsHarmonize(o.color, dress.color));
    const look: WardrobeItemForStyling[] = [dress];
    if (jacket) look.push(jacket);
    tryAddLook(look);
  }

  // Strategy 2: top + bottom combinations
  for (const top of tops) {
    for (const bottom of bottoms) {
      if (!colorsHarmonize(top.color, bottom.color) && candidates.length >= count) continue;
      const look: WardrobeItemForStyling[] = [top, bottom];
      const jacket = outerwear.find(
        (o) => colorsHarmonize(o.color, top.color) && colorsHarmonize(o.color, bottom.color)
      );
      if (jacket && targetSeason !== "summer") look.push(jacket);
      tryAddLook(look);
    }
  }

  // Strategy 3: fallback — single items + outerwear
  if (candidates.length < count) {
    for (const item of [...tops, ...bottoms, ...categorized.other]) {
      if (candidates.length >= count * 2) break;
      tryAddLook([item]);
    }
  }

  // Sort by score desc, return top N
  return candidates.sort((a, b) => b.score - a.score).slice(0, count);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate look suggestions using a local fashion-matching algorithm.
 * No data is sent to any external service.
 */
export async function generateLookSuggestions(
  request: StylistRequest
): Promise<LookSuggestion[]> {
  const { wardrobeItems, jewelryItems, occasion, season, count = 3 } = request;

  if (wardrobeItems.length === 0) return [];

  const targetOccasion = (occasion as OccasionType) ?? "all";
  const targetSeason = (season as SeasonType) ?? "all";

  const candidates = buildCandidates(
    wardrobeItems,
    jewelryItems,
    targetOccasion,
    targetSeason,
    count
  );

  return candidates.map((candidate, index): LookSuggestion => {
    const { items, jewelry, score, occasion: detectedOccasion } = candidate;
    const descList = LOOK_DESCRIPTIONS[detectedOccasion] ?? LOOK_DESCRIPTIONS.all;
    const tipList = STYLING_TIPS[detectedOccasion] ?? STYLING_TIPS.all;

    return {
      name: getLookName(detectedOccasion, index),
      description: descList[index % descList.length],
      occasion: detectedOccasion,
      season: targetSeason,
      wardrobeItemIds: items.map((i) => i.id),
      jewelryItemIds: jewelry.map((j) => j.id),
      stylingTips: tipList[index % tipList.length],
      confidence: Math.min(96, score),
    };
  });
}

/**
 * Generate styling tips locally without calling any external AI.
 */
export async function generateStylingTips(
  wardrobeItems: WardrobeItemForStyling[],
  jewelryItems: JewelryItemForStyling[],
  occasion?: string
): Promise<string> {
  if (wardrobeItems.length === 0) {
    return "Ajoutez des vêtements à votre dressing pour recevoir des conseils personnalisés.";
  }

  const occ = (occasion as OccasionType) ?? detectOccasionFromItems(wardrobeItems);
  const tips = STYLING_TIPS[occ] ?? STYLING_TIPS.all;
  return pickRandom(tips);
}

/**
 * Analyze color harmony between items locally.
 */
export async function analyzeColorHarmony(
  colors: string[]
): Promise<{ score: number; feedback: string }> {
  if (colors.length < 2) {
    return { score: 100, feedback: "Ajoutez plus de pièces pour analyser l'harmonie des couleurs." };
  }

  let hitsTotal = 0;
  let total = 0;
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      total++;
      if (colorsHarmonize(colors[i], colors[j])) hitsTotal++;
    }
  }

  const score = total === 0 ? 80 : Math.round((hitsTotal / total) * 40 + 60);

  const feedback =
    score >= 90
      ? "Excellente harmonie des couleurs — vos teintes se complètent parfaitement !"
      : score >= 75
        ? "Bonne combinaison colorée, l'ensemble est cohérent et élégant."
        : score >= 60
          ? "Harmonie acceptable — essayez d'ajouter un neutre pour équilibrer."
          : "Les couleurs se contrastent fortement. Ajoutez une pièce neutre pour unifier le look.";

  return { score, feedback };
}

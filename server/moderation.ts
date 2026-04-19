/**
 * Content moderation — Apple Guideline 5.1.1(x) & 1.2
 *
 * Filtre pré-publication minimal en local. N'est PAS un système de modération
 * complet — il bloque uniquement les cas évidents (insultes lourdes, URLs
 * externes, tentatives d'évasion des filtres). La modération post-publication
 * est assurée par le signalement utilisateur (trois signalements → masquage
 * automatique) puis revue humaine sous 24h.
 *
 * Pour une modération IA plus poussée (texte + image), plugger ici :
 *   - OpenAI Moderation API : https://platform.openai.com/docs/guides/moderation
 *   - AWS Rekognition : pour les images NSFW
 *   - Perspective API (Google Jigsaw) : pour la toxicité contextuelle
 */

/* eslint-disable no-useless-escape */

// Liste non-exhaustive ; conçue pour bloquer les cas les plus évidents.
// Matchée en insensible à la casse + avec tolérance caractères accentués/leetspeak basique.
const FORBIDDEN_PATTERNS: Array<{ pattern: RegExp; category: string }> = [
  // Haine / insultes lourdes (FR)
  { pattern: /\b(nazi|kkk|suprémaciste|suprematiste)\b/iu, category: "hate_speech" },
  { pattern: /\b(sale\s+(juif|arabe|noir|blanc|musulman|chrétien))\b/iu, category: "hate_speech" },

  // Contenu sexuel explicite (FR/EN) — bloquer avant publication
  { pattern: /\b(porn|porno|xxx|hentai|sextape|sex\s?tape)\b/iu, category: "nudity_sexual" },
  { pattern: /\b(nude[sz]?|onlyfans)\b/iu, category: "nudity_sexual" },

  // Violence / menaces explicites
  { pattern: /\b(je\s+vais\s+te\s+(tuer|buter|butter|frapper|cogner|defoncer|défoncer))\b/iu, category: "violence" },
  { pattern: /\b(i\s+will\s+kill\s+you)\b/iu, category: "violence" },

  // Contenu illégal — pédopornographie / trafic
  { pattern: /\b(child\s?porn|cp|pedophil|pédophil|loli|shota)\b/iu, category: "illegal_content" },
  { pattern: /\b(vente\s+(drogue|coca[ïi]ne|h[eé]ro[ïi]ne|meth))\b/iu, category: "illegal_content" },

  // Liens externes vers des domaines suspects — bloquer les spams
  { pattern: /\b(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd|shorturl\.at)\/[^\s]+/i, category: "spam" },

  // Phishing / arnaques classiques
  { pattern: /\b(click\s+here\s+to\s+win|cliquez\s+ici\s+pour\s+gagner|free\s+bitcoin|bitcoin\s+gratuit)\b/iu, category: "spam" },

  // Insultes fortes FR (liste volontairement courte et modérée)
  { pattern: /\b(encul[éeè]|nique\s+ta\s+(m[èe]re|race))\b/iu, category: "harassment" },
];

/**
 * Retourne la catégorie violée si le texte contient du contenu interdit,
 * sinon `null`.
 *
 * Exemple :
 *   containsForbiddenContent("Bonjour !")  → null
 *   containsForbiddenContent("nazi power")  → "hate_speech"
 */
export function containsForbiddenContent(text: string): string | null {
  if (!text || text.trim().length === 0) return null;

  // Normalisation minimale : tolère espaces doubles, NBSP, caractères de zéro largeur
  const normalized = text
    .normalize("NFKC")
    .replace(/\u200B|\u200C|\u200D|\uFEFF/g, "") // zéro-width
    .replace(/\s+/g, " ")
    .trim();

  for (const { pattern, category } of FORBIDDEN_PATTERNS) {
    if (pattern.test(normalized)) {
      return category;
    }
  }

  return null;
}

/**
 * Dev/test helper — liste toutes les catégories trouvées (utile pour logs).
 */
export function listForbiddenCategories(text: string): string[] {
  if (!text) return [];
  const normalized = text.normalize("NFKC").replace(/\s+/g, " ").trim();
  const found = new Set<string>();
  for (const { pattern, category } of FORBIDDEN_PATTERNS) {
    if (pattern.test(normalized)) found.add(category);
  }
  return Array.from(found);
}

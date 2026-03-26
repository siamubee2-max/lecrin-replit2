/**
 * Normalisation + fallback pour les images de la boutique.
 *
 * Problème observé (sur iPhone) : Supabase/tRPC peut renvoyer des lignes
 * `partnerJewelry` non vides, mais avec `imageUrl` absent (ou champ différent),
 * ce qui désactive le fallback démo et laisse des cartes sans photos.
 */

export type NormalizedImageSource = { uri: string };

function toStringNonEmpty(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Convertit `imageUrl` (string ou `{ uri: string }`) en source expo-image.
 * Si la valeur n'est pas utilisable, retourne `null`.
 */
export function normalizePartnerJewelryImageUrl(
  imageUrlValue: unknown,
): NormalizedImageSource | null {
  const uriFromString = toStringNonEmpty(imageUrlValue);
  if (uriFromString) return { uri: uriFromString };

  if (
    imageUrlValue &&
    typeof imageUrlValue === "object" &&
    "uri" in imageUrlValue
  ) {
    const maybeUri = (imageUrlValue as { uri?: unknown }).uri;
    const uri = toStringNonEmpty(maybeUri);
    if (uri) return { uri };
  }

  return null;
}

/**
 * Retourne `true` si la liste récupérée ne contient aucune image utilisable.
 * C'est le cas lorsqu'on désactive le fallback démo avec `data.length > 0`,
 * mais que les champs `imageUrl/image_url` sont vides.
 */
export function shouldUseDemoJewelry(
  fetchedJewelry: unknown[],
): boolean {
  return !fetchedJewelry.some((j) => {
    const any = j as any;
    const imageUrlValue = any?.imageUrl ?? any?.image_url ?? null;
    return normalizePartnerJewelryImageUrl(imageUrlValue) !== null;
  });
}


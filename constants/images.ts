/**
 * Centralized image URLs for the entire app.
 *
 * All demo/static images are served from Supabase Storage.
 * To migrate from the old CDN URLs, run the seed endpoint:
 *   POST /api/admin/seed-images
 *
 * Folder structure in the "images" bucket:
 *   jewelry/      — Moni'attitude & demo jewelry
 *   mannequins/   — Model photos for try-on
 *   shoes/        — Demo shoes
 *   clothing/     — Demo clothing
 *   accessories/  — Demo accessories (bags, belts, etc.)
 *   hats/         — Demo hats
 *   watches/      — Demo watches
 *   ecrin/        — Category example images for the Écrin tab
 */

const SUPABASE_URL = "https://amafgweelzayrjzemdtq.supabase.co";
const BUCKET = "images";
const BASE = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}`;

// ─── Helper ──────────────────────────────────────────────────────────────────
function img(path: string): string {
  return `${BASE}/${path}`;
}

// ─── Home / Featured ─────────────────────────────────────────────────────────
export const FEATURED_ITEMS = [
  { id: "1", uri: img("jewelry/AdlrDYXkOyPhDCRC.jpg"), label: "Boucles Étoile" },
  { id: "2", uri: img("jewelry/pmqnnFKjXVuQOvRn.jpg"), label: "Collier Perle" },
  { id: "3", uri: img("jewelry/stRulhTckXsGxDQi.jpg"), label: "Bracelet Or" },
];

// ─── Boutique – Moni'attitude jewelry ────────────────────────────────────────
export const BOUTIQUE_JEWELRY_IMAGES = {
  fleurDoree: img("jewelry/foIbwvIEZnQRCkLk.jpeg"),
  fleurVertes: img("jewelry/haAwgRGsClqKFANk.jpeg"),
  fleurDuo: img("jewelry/xObLlbhKgtqgQKtR.jpeg"),
  coeurTendre: img("jewelry/jxfiqAoWKZPAIFjU.jpeg"),
  artisanales: img("jewelry/CAEjpatzbSHKxJTS.jpeg"),
  resineOrange: img("jewelry/HZMcGGjuhtIOsCCh.jpeg"),
  ethnique: img("jewelry/DTttUkeYfSQGDWYX.jpeg"),
  collierChaine: img("jewelry/udutSvgNwUOYCjca.jpeg"),
  collierPerles: img("jewelry/SSbYeXEaRLVOrBMD.jpeg"),
  resineOrangeEarring: img("jewelry/rjfmUlamBZcBgUfF.jpeg"),
  braceletBleu: img("jewelry/enfnjOfHaPReDorw.jpeg"),
  braceletDoree: img("jewelry/PmXGVTpIdVrAoJbK.jpeg"),
};

// ─── Dressing demo items ─────────────────────────────────────────────────────
export const DRESSING_IMAGES = {
  // Jewelry
  bouclesFleurDoree: img("jewelry/foIbwvIEZnQRCkLk.jpeg"),
  bouclesResineOrange: img("jewelry/rjfmUlamBZcBgUfF.jpeg"),
  collierChaineDoree: img("jewelry/jGuXuEkhGyksTrjf.png"),
  // Shoes
  escarpinsNude: img("shoes/shoes_sandals_nude.png"),
  sneakersBlanches: img("shoes/shoes_sneakers_white.png"),
  bottinesNoires: img("shoes/shoes_boots_black.png"),
  // Clothing
  chemisierIvoire: img("clothing/clothing_blouse_ivory.png"),
  pantalonMarine: img("clothing/clothing_pants_navy.png"),
  robeNoire: img("clothing/clothing_dress_black.png"),
  blazerCamel: img("clothing/clothing_blazer_camel.png"),
  // Accessories
  sacNoir: img("accessories/accessory_bag_black.png"),
  ceintureDorée: img("accessories/accessory_belt_gold.png"),
};

// ─── Écrin – Category examples ───────────────────────────────────────────────
export const ECRIN_EXAMPLES = [
  { id: "necklace", label: "Collier", image: { uri: img("ecrin/necklace_example.png") } },
  { id: "earrings", label: "Boucles d'oreilles", image: { uri: img("ecrin/earrings_example.png") } },
  { id: "ring", label: "Bague", image: { uri: img("ecrin/ring_example.png") } },
  { id: "bracelet", label: "Bracelet", image: { uri: img("ecrin/bracelet_example.png") } },
  { id: "anklet", label: "Chevillière", image: { uri: img("ecrin/anklet_example.png") } },
];

// ─── Try-on Mannequins (Jewelry) ─────────────────────────────────────────────
export const MANNEQUIN_CDN = `${BASE}/mannequins`;

export const MANNEQUIN_SECTIONS = [
  {
    title: "Visages & Oreilles",
    data: [
      { id: "face-1", uri: img("mannequins/AdlrDYXkOyPhDCRC.jpg"), label: "Visage 1" },
      { id: "face-2", uri: img("mannequins/pmqnnFKjXVuQOvRn.jpg"), label: "Visage 2" },
      { id: "face-3", uri: img("mannequins/stRulhTckXsGxDQi.jpg"), label: "Visage 3" },
      { id: "face-4", uri: img("mannequins/aNpFyVQfcOhjIwdS.jpg"), label: "Visage 4" },
      { id: "rousse", uri: img("mannequins/cyJJDUWYzkgzSTbF.jpg"), label: "Modèle Rousse" },
    ],
  },
  {
    title: "Mains",
    data: [
      { id: "hand-1", uri: img("mannequins/btMXmGHNLbTjRmEE.jpg"), label: "Main 1" },
      { id: "hand-2", uri: img("mannequins/jyiRZUGrdRTgSIXJ.jpg"), label: "Main 2" },
      { id: "hand-store", uri: img("mannequins/FpgJONMhzLalyhTi.jpg"), label: "Main 3" },
    ],
  },
  {
    title: "Poignets",
    data: [
      { id: "wrist-1", uri: img("mannequins/xXJqyGvkbrFwBBHV.jpg"), label: "Poignet 1" },
      { id: "wrist-2", uri: img("mannequins/MNVdSmIpPxYSClIs.jpg"), label: "Poignet 2" },
    ],
  },
  {
    title: "Chevilles",
    data: [
      { id: "ankle-1", uri: img("mannequins/OdSiQtPIdenBVntk.jpg"), label: "Cheville 1" },
    ],
  },
  {
    title: "Corps entier",
    data: [
      { id: "femme-jeans", uri: img("mannequins/abbVLmuyWSwhhikh.jpg"), label: "Femme Jeans" },
      { id: "femme-robe", uri: img("mannequins/OxGFokpAzdVyeaCp.jpg"), label: "Femme Robe" },
      { id: "femme-rousse", uri: img("mannequins/JrHRSXiGdwkxFloI.jpg"), label: "Femme Rousse" },
      { id: "femme-short-blonde", uri: img("mannequins/WJYefCuswobmjOFn.jpg"), label: "Femme Short Blonde" },
      { id: "femme-short-brune", uri: img("mannequins/NiGpqbuSbzvVeGpE.jpg"), label: "Femme Short Brune" },
      { id: "homme-sport", uri: img("mannequins/FAAIQjDUYqvqrnSP.jpg"), label: "Homme Sport" },
      { id: "homme-casual", uri: img("mannequins/iEKDtQHwyiIzFBLs.jpg"), label: "Homme Casual" },
      { id: "homme-basket", uri: img("mannequins/uEwQwHLXMbeskowf.jpg"), label: "Homme Basket" },
    ],
  },
];

// ─── Try-on Shoes Mannequins ─────────────────────────────────────────────────
export const SHOES_MANNEQUIN_SECTIONS = [
  {
    title: "Pieds & Jambes",
    data: [
      { id: "ankle-1", uri: img("mannequins/OdSiQtPIdenBVntk.jpg"), label: "Cheville 1" },
      { id: "hand-1", uri: img("mannequins/btMXmGHNLbTjRmEE.jpg"), label: "Pied 1" },
      { id: "hand-2", uri: img("mannequins/jyiRZUGrdRTgSIXJ.jpg"), label: "Pied 2" },
    ],
  },
  {
    title: "Corps entier",
    data: [
      { id: "femme-jeans", uri: img("mannequins/abbVLmuyWSwhhikh.jpg"), label: "Femme Jeans" },
      { id: "femme-robe", uri: img("mannequins/OxGFokpAzdVyeaCp.jpg"), label: "Femme Robe" },
      { id: "homme-casual", uri: img("mannequins/iEKDtQHwyiIzFBLs.jpg"), label: "Homme Casual" },
      { id: "homme-basket", uri: img("mannequins/uEwQwHLXMbeskowf.jpg"), label: "Homme Basket" },
    ],
  },
];

// ─── Try-on Clothing Mannequins ──────────────────────────────────────────────
export const CLOTHING_MANNEQUIN_SECTIONS = [
  {
    title: "Mannequins Féminins",
    data: [
      { id: "femme-beige", uri: img("mannequins/mannequin_clothing_1.png"), label: "Femme Svelte" },
      { id: "femme-noir", uri: img("mannequins/mannequin_clothing_2.png"), label: "Femme Casual" },
      { id: "femme-ronde", uri: img("mannequins/mannequin_clothing_3.png"), label: "Femme Ronde" },
      { id: "femme-peau-foncee", uri: img("mannequins/mannequin_clothing_5.png"), label: "Femme Élancée" },
    ],
  },
  {
    title: "Mannequins Masculins",
    data: [
      { id: "homme-classique", uri: img("mannequins/mannequin_clothing_4.png"), label: "Homme Classique" },
      { id: "homme-jeune", uri: img("mannequins/mannequin_male_1.png"), label: "Homme Jeune" },
      { id: "homme-mature", uri: img("mannequins/mannequin_male_2.png"), label: "Homme Mature" },
      { id: "homme-peau-foncee", uri: img("mannequins/mannequin_male_3.png"), label: "Homme Peau Foncée" },
    ],
  },
  {
    title: "Mannequins Non-Genrés",
    data: [
      { id: "neutre-1", uri: img("mannequins/mannequin_neutral_1.png"), label: "Neutre Casual" },
      { id: "neutre-2", uri: img("mannequins/mannequin_neutral_2.png"), label: "Neutre Chic" },
      { id: "neutre-3", uri: img("mannequins/mannequin_neutral_3.png"), label: "Neutre Naturel" },
    ],
  },
];

// ─── Try-on Jewelry by type ──────────────────────────────────────────────────
export const JEWELRY_BY_TYPE: Record<string, { id: string; uri: string; label: string }[]> = {
  earrings: [
    { id: "plume-bleu", uri: img("jewelry/mUaeVRKTyNsSwydj.png"), label: "Plume Bleu" },
    { id: "lapis", uri: img("jewelry/DbsZECnmnScwGXrK.png"), label: "Lapis Lazuli" },
    { id: "rose", uri: img("jewelry/MHrMUbGtWuDsPAWp.png"), label: "Créoles Roses" },
    { id: "terracotta", uri: img("jewelry/QXWjEMeEMxnUaJWM.png"), label: "Terracotta" },
    { id: "lune", uri: img("jewelry/cWuBMzcdacdWSBif.png"), label: "Lune et Étoiles" },
    { id: "vert", uri: img("jewelry/vDUNWJgUqNeqgxuD.png"), label: "Créoles Vertes" },
    { id: "resine-vert", uri: img("jewelry/BQcYjBycBufjuRzd.png"), label: "Résine Verte" },
    { id: "etoile-rose", uri: img("jewelry/lNdRViMTySQvUjlT.png"), label: "Étoile Rose" },
    { id: "orange", uri: img("jewelry/KguAeTqThjCsvecs.png"), label: "Arches Orange" },
    { id: "violet", uri: img("jewelry/gvMlujGZrGdQxNrU.png"), label: "Pointe Violette" },
    { id: "bleu-clair", uri: img("jewelry/YIEQPKPDArbEBfgo.png"), label: "Géométrique Bleu" },
    { id: "geometrique", uri: img("jewelry/mEFFJpvLNjtkSKFp.png"), label: "Géométrique Or" },
    { id: "creole-orange", uri: img("jewelry/ksjchgAauBTgoIRP.png"), label: "Créoles Orange" },
    { id: "etoile-blanc", uri: img("jewelry/NHrMayoaxkGwRAzw.png"), label: "Étoile Blanc" },
    { id: "cuir-rose", uri: img("jewelry/iXSRVmYBQKSVkIgb.png"), label: "Cuir Rose" },
    { id: "fleur-vie", uri: img("jewelry/mKMdkYLxQkBcagIz.png"), label: "Fleur de Vie" },
    { id: "eventail", uri: img("jewelry/CSMPqWqsSMHWRAJD.png"), label: "Éventail Or" },
    { id: "rectangle", uri: img("jewelry/ywEJZiJNFCWSyekZ.png"), label: "Rectangle Cuivre" },
    { id: "noir-or", uri: img("jewelry/vqeMhpwfZUJaaVDJ.png"), label: "Noir et Or" },
    { id: "moniattitude-1", uri: img("jewelry/StedFUyGMBUqcAEe.png"), label: "Moni'Attitude" },
  ],
  necklace: [
    { id: "necklace-1", uri: img("jewelry/pIwhbFaxajqlBLDM.jpg"), label: "Collier 1" },
    { id: "moni-necklace", uri: img("jewelry/jGuXuEkhGyksTrjf.png"), label: "Moni'Attitude Collier" },
  ],
  bracelet: [
    { id: "bracelet-1", uri: img("jewelry/UpdTPopWOOkisAfZ.jpg"), label: "Bracelet 1" },
    { id: "bracelet-2", uri: img("jewelry/LRXLSFlVyKYRjWpN.jpg"), label: "Bracelet 2" },
    { id: "bracelet-3", uri: img("jewelry/cShFnzrgsYCAyoJP.jpg"), label: "Bracelet 3" },
    { id: "moni-bracelet-bleu", uri: img("jewelry/YtSJSMdauwcduZlE.png"), label: "Bracelet Bleu Étoile" },
    { id: "moni-bracelet-set", uri: img("jewelry/QFSIpqZaBEqDrjMr.png"), label: "Bracelet Moni'Attitude" },
  ],
  ring: [
    { id: "ring-luxury", uri: img("jewelry/bpNfAkbDYoWBSChW.jpg"), label: "Bague Luxe" },
  ],
  anklet: [
    { id: "anklet-silver", uri: img("jewelry/QGrKcPORwuBopwXN.jpg"), label: "Chaîne Argent" },
    { id: "anklet-gold", uri: img("jewelry/JCdnbNtrgayfIQha.jpg"), label: "Or Pierres Précieuses" },
  ],
  set: [
    { id: "jewelry-set", uri: img("jewelry/QruapqyLkIGpMclo.jpg"), label: "Parure Or" },
    { id: "moni-set", uri: img("jewelry/hjdHxGFegLggYIVj.png"), label: "Moni'Attitude Set" },
    { id: "moni-bracelet-set", uri: img("jewelry/QFSIpqZaBEqDrjMr.png"), label: "Set Bracelets" },
  ],
};

// ─── Try-on Shoes demo ───────────────────────────────────────────────────────
export const SHOES_DEMO = [
  { id: "heels-gold", uri: img("shoes/shoes_heels_gold.png"), label: "Escarpins Dorés", brand: "L'Écrin" },
  { id: "sneakers-white", uri: img("shoes/shoes_sneakers_white.png"), label: "Sneakers Blancs", brand: "L'Écrin" },
  { id: "boots-black", uri: img("shoes/shoes_boots_black.png"), label: "Bottines Noires", brand: "L'Écrin" },
  { id: "sandals-nude", uri: img("shoes/shoes_sandals_nude.png"), label: "Sandales Nude", brand: "L'Écrin" },
];

// ─── Try-on Clothing demo ────────────────────────────────────────────────────
export const CLOTHING_DEMO = [
  { id: "dress-black", uri: img("clothing/clothing_dress_black.png"), label: "Robe Noire", brand: "L'Écrin" },
  { id: "blazer-camel", uri: img("clothing/clothing_blazer_camel.png"), label: "Blazer Camel", brand: "L'Écrin" },
  { id: "blouse-ivory", uri: img("clothing/clothing_blouse_ivory.png"), label: "Chemisier Ivoire", brand: "L'Écrin" },
  { id: "pants-navy", uri: img("clothing/clothing_pants_navy.png"), label: "Pantalon Marine", brand: "L'Écrin" },
];

// ─── Try-on Accessories demo ─────────────────────────────────────────────────
export const ACCESSORIES_DEMO = [
  { id: "bag-black", uri: img("accessories/accessory_bag_black.png"), label: "Sac à Main Noir", brand: "L'Écrin" },
  { id: "belt-gold", uri: img("accessories/accessory_belt_gold.png"), label: "Ceinture Dorée", brand: "L'Écrin" },
  { id: "sunglasses-black", uri: img("accessories/accessory_sunglasses_black.png"), label: "Lunettes Cat-Eye", brand: "L'Écrin" },
  { id: "scarf-beige", uri: img("accessories/accessory_scarf_beige.png"), label: "Écharpe Beige", brand: "L'Écrin" },
];

// ─── Try-on Hats demo ────────────────────────────────────────────────────────
export const HATS_DEMO = [
  { id: "hat-bob-beige", uri: img("hats/hat_bob_beige.webp"), label: "Bob Beige", brand: "L'Écrin" },
  { id: "hat-cap-black", uri: img("hats/hat_cap_black.webp"), label: "Casquette Noire", brand: "L'Écrin" },
  { id: "hat-straw-summer", uri: img("hats/hat_straw_summer.webp"), label: "Chapeau de Paille", brand: "L'Écrin" },
];

// ─── Try-on Watches demo ─────────────────────────────────────────────────────
export const WATCHES_DEMO = [
  { id: "watch-classic-gold", uri: img("watches/watch_classic_gold.webp"), label: "Montre Classique Or", brand: "L'Écrin" },
  { id: "watch-sport-black", uri: img("watches/watch_sport_black.webp"), label: "Montre Sport Noire", brand: "L'Écrin" },
  { id: "watch-luxury-silver", uri: img("watches/watch_luxury_silver.webp"), label: "Montre Luxe Argent", brand: "L'Écrin" },
];

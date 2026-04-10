import * as Linking from "expo-linking";
import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * Deep Link Configuration
 * 
 * This module handles deep linking for the Écrin Virtuel app.
 * It supports:
 * - Custom URL scheme: ecrinvirtuel://
 * - Universal Links (iOS): https://ecrinvirtuel.app/
 * - App Links (Android): https://ecrinvirtuel.app/
 */

// Get base URLs from app config
const extra = Constants.expoConfig?.extra || {};
const DEEP_LINK_BASE_URL = extra.deepLinkBaseUrl || "https://ecrinvirtuel.app";
const APP_STORE_URL = extra.appStoreUrl || "https://apps.apple.com/app/ecrin-virtuel";
const PLAY_STORE_URL = Platform.OS === "android" ? (extra.playStoreUrl || "https://play.google.com/store/apps/details?id=com.ecrin.jewelry") : "";

// App metadata for Open Graph
export const APP_METADATA = {
  siteName: "L'Écrin Virtuel",
  defaultTitle: "Écrin Virtuel - Essayage Virtuel de Bijoux",
  defaultDescription: "Découvrez L'Écrin Virtuel, votre destination luxe pour l'essayage de bijoux en réalité augmentée. Essayez virtuellement des bijoux avant d'acheter.",
  defaultImage: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6942ff9b2efb59336aebfa58/a0c7900de_ElegantLogowithAbstractGemIcon.png",
  keywords: [
    "bijoux",
    "essayage virtuel",
    "réalité augmentée",
    "joaillerie",
    "bagues",
    "colliers",
    "boucles d'oreilles",
    "bracelets",
    "luxe",
    "mode",
  ],
  author: "L'Écrin Virtuel",
  twitterHandle: "@ecrinvirtuel",
};

/**
 * Deep link routes supported by the app
 */
export type DeepLinkRoute = 
  | "home"
  | "tryon"
  | "ecrin"
  | "boutique"
  | "profile"
  | "jewelry"
  | "creator";

/**
 * Parameters for generating a shareable deep link
 */
export interface DeepLinkParams {
  route: DeepLinkRoute;
  id?: string | number;
  title?: string;
  description?: string;
  image?: string;
}

/**
 * Generate a deep link URL for sharing
 * This creates a web URL that will redirect to the app or app store
 */
export function generateShareableLink(params: DeepLinkParams): string {
  const { route, id, title, description, image } = params;
  
  let path: string = route;
  if (id) {
    path = `${route}/${id}`;
  }
  
  const url = new URL(`${DEEP_LINK_BASE_URL}/${path}`);
  
  // Add metadata as query params for the redirect page to use
  if (title) url.searchParams.set("title", title);
  if (description) url.searchParams.set("desc", description);
  if (image) url.searchParams.set("img", image);
  
  return url.toString();
}

/**
 * Generate a custom scheme deep link (for direct app opening)
 */
export function generateAppLink(route: DeepLinkRoute, id?: string | number): string {
  const scheme = Constants.expoConfig?.scheme || "ecrinvirtuel";
  let path: string = route;
  if (id) {
    path = `${route}/${id}`;
  }
  return `${scheme}://${path}`;
}

/**
 * Get the appropriate store URL based on platform
 */
export function getStoreUrl(): string {
  return Platform.OS === "ios" ? APP_STORE_URL : PLAY_STORE_URL;
}

/**
 * Open a URL (either deep link or external)
 */
export async function openUrl(url: string): Promise<boolean> {
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
    return true;
  }
  return false;
}

/**
 * Parse an incoming deep link URL
 */
export function parseDeepLink(url: string): { route: DeepLinkRoute; id?: string; params: Record<string, string> } | null {
  try {
    const parsed = Linking.parse(url);
    const pathParts = parsed.path?.split("/").filter(Boolean) || [];
    
    if (pathParts.length === 0) {
      return { route: "home", params: parsed.queryParams as Record<string, string> || {} };
    }
    
    const route = pathParts[0] as DeepLinkRoute;
    const id = pathParts[1];
    
    return {
      route,
      id,
      params: parsed.queryParams as Record<string, string> || {},
    };
  } catch {
    return null;
  }
}

/**
 * Generate Open Graph metadata for a specific page
 * This is used by the web redirect page to show rich previews
 */
export function generateOpenGraphMeta(params: DeepLinkParams): Record<string, string> {
  const title = params.title || APP_METADATA.defaultTitle;
  const description = params.description || APP_METADATA.defaultDescription;
  const image = params.image || APP_METADATA.defaultImage;
  const url = generateShareableLink(params);
  
  return {
    "og:title": `${title} | ${APP_METADATA.siteName}`,
    "og:description": description,
    "og:image": image,
    "og:url": url,
    "og:type": "website",
    "og:site_name": APP_METADATA.siteName,
    "twitter:card": "summary_large_image",
    "twitter:title": `${title} | ${APP_METADATA.siteName}`,
    "twitter:description": description,
    "twitter:image": image,
    "twitter:site": APP_METADATA.twitterHandle,
  };
}

/**
 * Pre-defined share content for different routes
 */
export const SHARE_CONTENT = {
  tryon: (jewelryName?: string) => ({
    title: jewelryName ? `Essayage de ${jewelryName}` : "Mon essayage virtuel",
    description: "Regardez ce bijou que j'ai essayé virtuellement sur L'Écrin Virtuel !",
  }),
  jewelry: (name: string, brand?: string) => ({
    title: name,
    description: brand 
      ? `Découvrez ${name} par ${brand} sur L'Écrin Virtuel`
      : `Découvrez ${name} sur L'Écrin Virtuel`,
  }),
  creator: (name: string) => ({
    title: name,
    description: `Découvrez les créations de ${name} sur L'Écrin Virtuel`,
  }),
  collection: (name: string) => ({
    title: `Collection ${name}`,
    description: `Explorez la collection ${name} sur L'Écrin Virtuel`,
  }),
};

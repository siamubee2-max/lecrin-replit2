import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { uploadImageForAnalysis, analyzeImageForJewelry, detectFaceLandmarks } from "./face-detection";
import { supabaseStoragePut } from "./_core/supabaseStorage";
import {
  getSupabaseWardrobeItems,
  getSupabaseWardrobeItem,
  createSupabaseWardrobeItem,
  updateSupabaseWardrobeItem,
  deleteSupabaseWardrobeItem,
  getSupabaseWardrobeModels,
} from "./_core/supabaseDb";
import { generateImage } from "./_core/imageGeneration";
import { invokeLLM } from "./_core/llm";
import { generateLookSuggestions, generateStylingTips, analyzeColorHarmony } from "./ai-stylist";
import { monetizationRouter } from "./monetization";

// ─── Comptes privilégiés (accès Lifetime Premium gratuit en prod) ─────────────
// Configuré via PRIVILEGED_EMAILS dans .env (jamais exposé au client)
const PRIVILEGED_EMAILS: Set<string> = new Set(
  (process.env.PRIVILEGED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

const COMMUNITY_BLOCKED_TERMS = [
  "suicide",
  "kill yourself",
  "hate speech",
  "nazi",
  "terrorist",
];

function normalizeCommunityText(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim();
}

function containsBlockedCommunityTerm(value: string): boolean {
  const normalized = value.toLowerCase();
  return COMMUNITY_BLOCKED_TERMS.some((term) => normalized.includes(term));
}

type QualityAssessment = {
  overall: number;
  pose: number;
  placement: number;
  proportion: number;
  verdict: "pass" | "retry";
  reason: string;
};

const DEFAULT_IMAGE_MODELS = [
  "gemini-3.1-flash-image-preview",
  "gemini-2.0-flash-preview-image-generation",
];

function parseModelCandidates(raw?: string): string[] {
  const envModels = (process.env.GEMINI_IMAGE_MODELS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const list = raw
    ? raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : envModels;
  return list.length > 0 ? list : DEFAULT_IMAGE_MODELS;
}

function inferWardrobeTags(input: {
  name: string;
  category: string;
  color?: string;
  tags?: string;
  season?: "spring" | "summer" | "fall" | "winter" | "all";
  occasion?: "casual" | "work" | "formal" | "sport" | "party" | "all";
}) {
  if (input.tags && input.season && input.occasion) {
    return input;
  }
  const text = input.name.toLowerCase();
  const tags = new Set<string>(
    (input.tags ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  tags.add(input.category);
  if (input.color) tags.add(input.color);
  if (/blazer|tailleur|derby|robe|chemise/.test(text)) tags.add("elegant");
  if (/sport|running|sneaker|basket/.test(text)) tags.add("sport");
  if (/imper|deperlant|pluie|waterproof/.test(text)) tags.add("rain");
  if (/laine|manteau|parka|hiver/.test(text)) tags.add("winter");
  if (/lin|sandale|ete|leger/.test(text)) tags.add("summer");

  const season =
    input.season ??
    (tags.has("winter") ? "winter" : tags.has("summer") ? "summer" : "all");
  const occasion =
    input.occasion ??
    (tags.has("sport") ? "sport" : tags.has("elegant") ? "formal" : "casual");

  return {
    ...input,
    tags: Array.from(tags).join(","),
    season,
    occasion,
  };
}

async function assessTryOnQuality(params: {
  modelImageUrl: string;
  itemImageUrl: string;
  resultImageUrl: string;
  category: "jewelry" | "shoes" | "clothing" | "accessories" | "outfit";
  pose: "front" | "side" | "walking" | "back";
}): Promise<QualityAssessment> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Evaluate virtual try-on quality. Input image A is original model, B is item reference, C is generated result. " +
                `Category=${params.category}, requestedPose=${params.pose}. ` +
                "Score 0-100 for pose fidelity, placement accuracy, and realistic proportions. " +
                "Set verdict=retry if overall < 72 or if severe defects exist (wrong pose, oversized item, bad placement).",
            },
            { type: "image_url", image_url: { url: params.modelImageUrl } },
            { type: "image_url", image_url: { url: params.itemImageUrl } },
            { type: "image_url", image_url: { url: params.resultImageUrl } },
          ],
        },
      ],
      outputSchema: {
        name: "quality_assessment",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            overall: { type: "number" },
            pose: { type: "number" },
            placement: { type: "number" },
            proportion: { type: "number" },
            verdict: { type: "string", enum: ["pass", "retry"] },
            reason: { type: "string" },
          },
          required: ["overall", "pose", "placement", "proportion", "verdict", "reason"],
        },
      },
    });
    const content = response.choices?.[0]?.message?.content;
    const text =
      typeof content === "string"
        ? content
        : Array.isArray(content)
          ? content.map((c: any) => (c?.type === "text" ? c.text : "")).join(" ").trim()
          : "";
    const parsed = JSON.parse(text) as QualityAssessment;
    return {
      overall: Number(parsed.overall) || 0,
      pose: Number(parsed.pose) || 0,
      placement: Number(parsed.placement) || 0,
      proportion: Number(parsed.proportion) || 0,
      verdict: parsed.verdict === "pass" ? "pass" : "retry",
      reason: parsed.reason || "Quality check fallback",
    };
  } catch (err) {
    console.warn("[TryOn] quality assessment failed, using fallback score", err);
    return {
      overall: 70,
      pose: 70,
      placement: 70,
      proportion: 70,
      verdict: "retry",
      reason: "Automatic quality evaluator unavailable",
    };
  }
}

export const appRouter = router({
  system: systemRouter,
  monetization: monetizationRouter,

  // ============================================
  // AUTH ROUTES
  // ============================================
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),

    // Vérifie si l'utilisateur connecté a un accès premium gratuit permanent
    isPrivileged: protectedProcedure.query(({ ctx }) => {
      const email = ctx.user.email?.toLowerCase() ?? "";
      return { privileged: PRIVILEGED_EMAILS.has(email) };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),

    // DELETE account — Apple Guideline 5.1.1(v)
    deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
      const userId = ctx.user.id;
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error('DB non disponible');
      const { eq } = await import('drizzle-orm');
      const schema = await import('../drizzle/schema');
      // Supprimer toutes les données utilisateur en cascade
      await dbInstance.delete(schema.favorites).where(eq(schema.favorites.userId, userId));
      await dbInstance.delete(schema.userStats).where(eq(schema.userStats.userId, userId));
      await dbInstance.delete(schema.bodyParts).where(eq(schema.bodyParts.userId, userId));
      await dbInstance.delete(schema.wardrobeItems).where(eq(schema.wardrobeItems.userId, userId));
      await dbInstance.delete(schema.savedLooks).where(eq(schema.savedLooks.userId, userId));
      await dbInstance.delete(schema.jewelryCollection).where(eq(schema.jewelryCollection.userId, userId));
      await dbInstance.delete(schema.partnerJewelryFavorites).where(eq(schema.partnerJewelryFavorites.userId, userId));
      await dbInstance.delete(schema.communityPosts).where(eq(schema.communityPosts.userId, userId));
      await dbInstance.delete(schema.communityPostLikes).where(eq(schema.communityPostLikes.userId, userId));
      // Supprimer le compte utilisateur
      await dbInstance.delete(schema.users).where(eq(schema.users.id, userId));
      // Invalider la session
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      console.log(`[Auth] Account deleted for user ${userId}`);
      return { success: true } as const;
    }),

    // Sync subscription with RevenueCat — fix bug IA après achat
    syncSubscription: protectedProcedure.mutation(async ({ ctx }) => {
      const userId = ctx.user.id;
      const REVENUECAT_API_KEY = process.env.REVENUECAT_API_KEY || process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || '';
      if (!REVENUECAT_API_KEY) {
        console.warn('[SyncSubscription] No RevenueCat API key configured');
        return { success: false, tier: 'free' as const, reason: 'no_api_key' };
      }
      try {
        const rcResponse = await fetch(
          `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(String(userId))}`,
          { headers: { Authorization: `Bearer ${REVENUECAT_API_KEY}`, 'Content-Type': 'application/json' } }
        );
        if (!rcResponse.ok) {
          console.warn('[SyncSubscription] RevenueCat API error:', rcResponse.status);
          return { success: false, tier: 'free' as const, reason: 'api_error' };
        }
        const data = await rcResponse.json() as any;
        const entitlements = data?.subscriber?.entitlements ?? {};
        const now = new Date();
        let tier: 'free' | 'basic' | 'premium' | 'yearly' = 'free';
        let expiresDate: string | null = null;
        // Priorité : yearly > premium > basic (jewelry)
        if (entitlements['yearly_access']?.expires_date) {
          const exp = new Date(entitlements['yearly_access'].expires_date);
          if (exp > now) { tier = 'yearly'; expiresDate = entitlements['yearly_access'].expires_date; }
        } else if (entitlements['premium_access']?.expires_date) {
          const exp = new Date(entitlements['premium_access'].expires_date);
          if (exp > now) { tier = 'premium'; expiresDate = entitlements['premium_access'].expires_date; }
        } else if (entitlements['jewelry_access']?.expires_date) {
          const exp = new Date(entitlements['jewelry_access'].expires_date);
          if (exp > now) { tier = 'basic'; expiresDate = entitlements['jewelry_access'].expires_date; }
        }
        const dbInstance = await db.getDb();
        if (dbInstance) {
          const { eq } = await import('drizzle-orm');
          const { users } = await import('../drizzle/schema');
          await dbInstance.update(users).set({ subscriptionTier: tier }).where(eq(users.id, userId));
          console.log(`[SyncSubscription] Updated tier for user ${userId}: ${tier}`);
        }
        return { success: true, tier, expiresDate };
      } catch (err) {
        console.error('[SyncSubscription] Error:', err);
        return { success: false, tier: 'free' as const, reason: 'exception' };
      }
    }),
  }),

  // ============================================
  // FAVORITES ROUTES
  // ============================================
  favorites: router({
    // Get all user favorites
    list: protectedProcedure.query(async ({ ctx }) => {
      const favorites = await db.getUserFavorites(ctx.user.id);
      return favorites.map(f => ({ ...f, id: String(f.id) }));
    }),

    // Add a new favorite
    add: protectedProcedure
      .input(z.object({
        jewelryType: z.string().min(1).max(64),
        jewelryIcon: z.string().max(16).optional(),
        modelName: z.string().max(128).optional(),
        imageUri: z.string().optional(),
        jewelryItemId: z.string().optional(),
        creatorId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.addFavorite({
          userId: ctx.user.id,
          jewelryType: input.jewelryType,
          jewelryIcon: input.jewelryIcon,
          modelName: input.modelName,
          imageUri: input.imageUri,
          jewelryItemId: input.jewelryItemId ? Number(input.jewelryItemId) : undefined,
          creatorId: input.creatorId ? Number(input.creatorId) : undefined,
        });
        return { id };
      }),

    // Remove a favorite
    remove: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.removeFavorite(Number(input.id), ctx.user.id);
        return { success: true };
      }),

    // Sync favorites from local storage (bulk import)
    sync: protectedProcedure
      .input(z.array(z.object({
        jewelryType: z.string(),
        jewelryIcon: z.string().optional(),
        modelName: z.string().optional(),
        imageUri: z.string().optional(),
        createdAt: z.string().optional(),
      })))
      .mutation(async ({ ctx, input }) => {
        // Get existing favorites to avoid duplicates
        const existing = await db.getUserFavorites(ctx.user.id);
        const existingKeys = new Set(
          existing.map(f => `${f.jewelryType}-${f.modelName}-${f.jewelryIcon}`)
        );

        let imported = 0;
        for (const fav of input) {
          const key = `${fav.jewelryType}-${fav.modelName}-${fav.jewelryIcon}`;
          if (!existingKeys.has(key)) {
            await db.addFavorite({
              userId: ctx.user.id,
              jewelryType: fav.jewelryType,
              jewelryIcon: fav.jewelryIcon,
              modelName: fav.modelName,
              imageUri: fav.imageUri,
            });
            imported++;
          }
        }

        return { imported, total: existing.length + imported };
      }),
  }),

  // ============================================
  // USER STATS ROUTES
  // ============================================
  stats: router({
    // Get user stats
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserStats(ctx.user.id);
    }),

    // Increment try-on count
    incrementTryOn: protectedProcedure.mutation(async ({ ctx }) => {
      await db.incrementTryOnCount(ctx.user.id);
      return { success: true };
    }),

    // Sync stats from local storage
    sync: protectedProcedure
      .input(z.object({
        totalTryOns: z.number(),
        favoritesCount: z.number(),
        lastTryOnDate: z.string().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        const stats = await db.getUserStats(ctx.user.id);
        // Keep the higher value between local and server
        if (stats) {
          const newTryOns = Math.max(stats.totalTryOns || 0, input.totalTryOns);
          const newFavorites = Math.max(stats.favoritesCount || 0, input.favoritesCount);
          // Update would need to be implemented
        }
        return { success: true };
      }),
  }),

  // ============================================
  // CREATORS ROUTES
  // ============================================
  creators: router({
    // Get all active creators
    list: publicProcedure.query(async () => {
      return db.getActiveCreators();
    }),

    // Get creator by ID with their jewelry
    get: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const creator = await db.getCreatorById(Number(input.id));
        if (!creator) return null;

        const jewelry = await db.getCreatorJewelry(Number(input.id));
        return { 
          ...creator, 
          id: String(creator.id),
          jewelry: jewelry.map(j => ({ ...j, id: String(j.id), creatorId: String(j.creatorId) }))
        };
      }),

    // Get all available jewelry for try-on
    jewelry: publicProcedure.query(async () => {
      return db.getAvailableJewelry();
    }),
  }),

  // ============================================
  // BODY PARTS ROUTES (Demo Models)
  // ============================================
  bodyParts: router({
    // Get all demo body parts
    list: publicProcedure.query(async () => {
      const parts = await db.getDemoBodyParts();
      return parts.map(p => ({ ...p, id: String(p.id) }));
    }),

    // Get body parts by type (supports all types)
    byType: publicProcedure
      .input(z.object({
        type: z.enum([
          "face", "neck", "bust_with_hands",
          "left_ear_profile", "right_ear_profile",
          "left_wrist", "right_wrist",
          "left_hand", "right_hand",
          "left_ankle", "right_ankle",
          "full_body",
          "earrings", "ring", "wrist", "foot", "full"
        ])
      }))
      .query(async ({ input }) => {
        const parts = await db.getBodyPartsByType(input.type);
        return parts.map(p => ({ ...p, id: String(p.id) }));
      }),

    // Get user's custom body parts (wardrobe)
    userParts: protectedProcedure.query(async ({ ctx }) => {
      const parts = await db.getUserBodyParts(ctx.user.id);
      return parts.map(p => ({ ...p, id: String(p.id) }));
    }),

    // Add custom body part (for wardrobe)
    add: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        type: z.enum([
          "face", "neck", "bust_with_hands",
          "left_ear_profile", "right_ear_profile",
          "left_wrist", "right_wrist",
          "left_hand", "right_hand",
          "left_ankle", "right_ankle",
          "full_body",
          "earrings", "ring", "wrist", "foot", "full"
        ]),
        imageUrl: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.addBodyPart({
          name: input.name,
          type: input.type,
          imageUrl: input.imageUrl,
          userId: ctx.user.id,
          isDemo: false,
        });
        return { id };
      }),

    // Delete user's body part
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteUserBodyPart(Number(input.id), ctx.user.id);
        return { success: true };
      }),
  }),

  // ============================================
  // USER COLLECTION ROUTES (Mon Écrin)
  // ============================================
  // ============================================
  // AI FACE DETECTION ROUTES
  // ============================================
  ai: router({
    // Upload image and get S3 URL for analysis
    uploadImage: publicProcedure
      .input(z.object({
        base64Data: z.string(),
        mimeType: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const url = await uploadImageForAnalysis(
          input.base64Data,
          input.mimeType || "image/jpeg"
        );
        return { url };
      }),

    // Detect face landmarks from image URL
    detectFace: publicProcedure
      .input(z.object({
        imageUrl: z.string(),
      }))
      .query(async ({ input }) => {
        const detection = await detectFaceLandmarks(input.imageUrl);
        return detection;
      }),

    // Full analysis: detect and calculate jewelry positions
    analyzeForJewelry: publicProcedure
      .input(z.object({
        imageUrl: z.string(),
        jewelryType: z.enum(["necklace", "earrings", "ring", "bracelet", "anklet"]),
      }))
      .query(async ({ input }) => {
        const result = await analyzeImageForJewelry(
          input.imageUrl,
          input.jewelryType
        );
        return result;
      }),

    // Combined: upload + analyze in one call
    uploadAndAnalyze: publicProcedure
      .input(z.object({
        base64Data: z.string(),
        mimeType: z.string().optional(),
        jewelryType: z.enum(["necklace", "earrings", "ring", "bracelet", "anklet"]),
      }))
      .mutation(async ({ input }) => {
        // Upload image first
        const imageUrl = await uploadImageForAnalysis(
          input.base64Data,
          input.mimeType || "image/jpeg"
        );

        // Then analyze
        const result = await analyzeImageForJewelry(
          imageUrl,
          input.jewelryType
        );

        return {
          imageUrl,
          ...result,
        };
      }),
  }),

  collection: router({
    // Get user's jewelry collection
    list: protectedProcedure.query(async ({ ctx }) => {
      const items = await db.getUserCollection(ctx.user.id);
      return items.map(item => ({ ...item, id: String(item.id) }));
    }),

    // Add item to collection
    add: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        type: z.string().min(1).max(64),
        metal: z.string().max(64).optional(),
        gem: z.string().max(64).optional(),
        brand: z.string().max(128).optional(),
        collection: z.string().max(128).optional(),
        price: z.number().optional(),
        imageUri: z.string().optional(),
        tags: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.addToCollection({
          userId: ctx.user.id,
          ...input,
        });
        return { id };
      }),

    // Remove item from collection
    remove: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.removeFromCollection(Number(input.id), ctx.user.id);
        return { success: true };
      }),

    // Update item in collection
    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        name: z.string().min(1).max(255).optional(),
        type: z.string().min(1).max(64).optional(),
        metal: z.string().max(64).optional(),
        gem: z.string().max(64).optional(),
        brand: z.string().max(128).optional(),
        collection: z.string().max(128).optional(),
        price: z.number().optional(),
        imageUri: z.string().optional(),
        tags: z.string().optional(),
        isFavorite: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateCollectionItem(Number(id), ctx.user.id, data);
        return { success: true };
      }),
  }),

  // ============================================
  // WARDROBE ROUTES (Mon Dressing) — Supabase backend
  // ============================================
  wardrobe: router({
    // Get a single wardrobe item
    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const item = await getSupabaseWardrobeItem(input.id);
        if (!item) return null;
        return {
          id: String(item.id),
          userId: item.user_id,
          name: item.name,
          category: item.category,
          brand: item.brand ?? null,
          color: item.color ?? null,
          secondaryColor: item.secondary_color ?? null,
          material: item.material ?? null,
          size: item.size ?? null,
          price: item.price ?? null,
          imageUrl: item.image_url ?? null,
          season: item.season ?? "all",
          occasion: item.occasion ?? "all",
          isFavorite: item.is_favorite ?? false,
          tags: Array.isArray(item.tags) ? item.tags.join(",") : (item.tags ?? ""),
          notes: item.notes ?? null,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
        };
      }),

    // Get all user wardrobe items (from Supabase)
    list: protectedProcedure.query(async ({ ctx }) => {
      const items = await getSupabaseWardrobeItems(ctx.user.openId);
      // Normalize to match existing app shape
      return items.map((item) => ({
        id: String(item.id),
        userId: item.user_id,
        name: item.name,
        category: item.category,
        brand: item.brand ?? null,
        color: item.color ?? null,
        secondaryColor: item.secondary_color ?? null,
        material: item.material ?? null,
        size: item.size ?? null,
        price: item.price ?? null,
        imageUrl: item.image_url ?? null,
        season: item.season ?? "all",
        occasion: item.occasion ?? "all",
        isFavorite: item.is_favorite ?? false,
        tags: Array.isArray(item.tags) ? item.tags.join(",") : (item.tags ?? ""),
        notes: item.notes ?? null,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      }));
    }),

    // Add a new wardrobe item (to Supabase)
    add: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        category: z.enum(["tops", "bottoms", "dresses", "outerwear", "shoes", "bags", "accessories", "other"]),
        brand: z.string().max(128).optional(),
        color: z.string().max(64).optional(),
        secondaryColor: z.string().max(64).optional(),
        material: z.string().max(128).optional(),
        size: z.string().max(32).optional(),
        price: z.number().optional(),
        imageUrl: z.string().optional(),
        season: z.enum(["spring", "summer", "fall", "winter", "all"]).optional(),
        occasion: z.enum(["casual", "work", "formal", "sport", "party", "all"]).optional(),
        tags: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const item = await createSupabaseWardrobeItem({
          user_id: ctx.user.openId,
          name: input.name,
          category: input.category,
          brand: input.brand,
          color: input.color,
          secondary_color: input.secondaryColor,
          material: input.material,
          size: input.size,
          price: input.price,
          image_url: input.imageUrl,
          season: input.season ?? "all",
          occasion: input.occasion ?? "all",
          tags: input.tags ? input.tags.split(",").map(t => t.trim()) : [],
          notes: input.notes,
        });
        return { id: item?.id };
      }),

    // Update a wardrobe item (Supabase)
    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        name: z.string().min(1).max(255).optional(),
        category: z.enum(["tops", "bottoms", "dresses", "outerwear", "shoes", "bags", "accessories", "other"]).optional(),
        brand: z.string().max(128).optional(),
        color: z.string().max(64).optional(),
        secondaryColor: z.string().max(64).optional(),
        material: z.string().max(128).optional(),
        size: z.string().max(32).optional(),
        price: z.number().optional(),
        imageUrl: z.string().optional(),
        season: z.enum(["spring", "summer", "fall", "winter", "all"]).optional(),
        occasion: z.enum(["casual", "work", "formal", "sport", "party", "all"]).optional(),
        isFavorite: z.boolean().optional(),
        tags: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, secondaryColor, imageUrl, isFavorite, tags, ...rest } = input;
        await updateSupabaseWardrobeItem(id, ctx.user.openId, {
          ...rest,
          secondary_color: secondaryColor,
          image_url: imageUrl,
          is_favorite: isFavorite,
          tags: tags ? tags.split(",").map(t => t.trim()) : undefined,
        });
        return { success: true };
      }),

    // Delete a wardrobe item (Supabase)
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await deleteSupabaseWardrobeItem(input.id, ctx.user.openId);
        return { success: true };
      }),

    // Upload wardrobe item image to Supabase Storage
    uploadImage: protectedProcedure
      .input(z.object({
        base64Data: z.string(),
        mimeType: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const timestamp = Date.now();
        const ext = input.mimeType?.includes("png") ? "png" : "jpg";
        const key = `wardrobe/${ctx.user.openId}/${timestamp}.${ext}`;
        const buffer = Buffer.from(input.base64Data, "base64");
        const result = await supabaseStoragePut(key, buffer, input.mimeType || "image/jpeg");
        return { url: result.url };
      }),
  }),

  // ============================================
  // WARDROBE MODELS ROUTES (Catalogue 50F + 45H)
  // ============================================
  wardrobeModels: router({
    // Get all catalogue models (filterable)
    list: publicProcedure
      .input(z.object({
        gender: z.enum(["women", "men", "all"]).optional(),
        category: z.string().optional(),
        season: z.string().optional(),
        occasion: z.string().optional(),
      }).nullish())
      .query(async ({ input }) => {
        const filters = (!input || input?.gender === "all") ? {} : {
          gender: input?.gender,
          category: input?.category,
          season: input?.season,
          occasion: input?.occasion,
        };
        return getSupabaseWardrobeModels(filters);
      }),
  }),

  // ============================================
  // SAVED LOOKS ROUTES (AI Stylist)
  // ============================================
  looks: router({
    // Get all user saved looks
    list: protectedProcedure.query(async ({ ctx }) => {
      const looks = await db.getUserSavedLooks(ctx.user.id);
      return looks.map(l => ({ ...l, id: String(l.id) }));
    }),

    // Get a single saved look
    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        const look = await db.getSavedLookById(Number(input.id), ctx.user.id);
        if (!look) return null;
        return { ...look, id: String(look.id) };
      }),

    // Create a new saved look
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        occasion: z.enum(["casual", "work", "formal", "sport", "party", "all"]).optional(),
        season: z.enum(["spring", "summer", "fall", "winter", "all"]).optional(),
        wardrobeItemIds: z.string().optional(), // JSON array
        jewelryItemIds: z.string().optional(), // JSON array
        previewImageUrl: z.string().optional(),
        stylingTips: z.string().optional(),
        isAiGenerated: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createSavedLook({
          userId: ctx.user.id,
          ...input,
        });
      }),

    // Update a saved look
    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        occasion: z.enum(["casual", "work", "formal", "sport", "party", "all"]).optional(),
        season: z.enum(["spring", "summer", "fall", "winter", "all"]).optional(),
        wardrobeItemIds: z.string().optional(),
        jewelryItemIds: z.string().optional(),
        previewImageUrl: z.string().optional(),
        stylingTips: z.string().optional(),
        isFavorite: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateSavedLook(Number(id), ctx.user.id, data);
      }),

    // Delete a saved look
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const success = await db.deleteSavedLook(Number(input.id), ctx.user.id);
        return { success };
      }),
  }),

  // ============================================
  // AI STYLIST ROUTES
  // ============================================
  stylist: router({
    // Generate look suggestions
    generateLooks: protectedProcedure
      .input(z.object({
        occasion: z.string().optional(),
        season: z.string().optional(),
        style: z.string().optional(),
        count: z.number().min(1).max(10).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get user's wardrobe items
        const wardrobeItems = await db.getUserWardrobeItems(ctx.user.id);

        // Get user's favorite jewelry (from favorites)
        const favorites = await db.getUserFavorites(ctx.user.id);
        const jewelryItems = favorites.map((f) => ({
          id: String(f.id),
          name: f.modelName || `${f.jewelryType} favori`,
          type: f.jewelryType,
          metal: null,
          gem: null,
          brand: null,
          imageUrl: f.imageUri,
        }));

        const suggestions = await generateLookSuggestions({
          wardrobeItems: wardrobeItems.map((item) => ({
            id: String(item.id),
            name: item.name,
            category: item.category,
            brand: item.brand,
            color: item.color,
            material: item.material,
            imageUrl: item.imageUrl,
            season: item.season,
            occasion: item.occasion,
          })),
          jewelryItems,
          occasion: input.occasion,
          season: input.season,
          style: input.style,
          count: input.count,
        });

        return { suggestions };
      }),

    // Get styling tips for specific items
    getStylingTips: protectedProcedure
      .input(z.object({
        wardrobeItemIds: z.array(z.string()),
        jewelryItemIds: z.array(z.string()).optional(),
        occasion: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        // Get wardrobe items by IDs
        const allWardrobeItems = await db.getUserWardrobeItems(ctx.user.id);
        const wardrobeItems = allWardrobeItems.filter((item) =>
          input.wardrobeItemIds.includes(String(item.id))
        );

        // Get jewelry items by IDs
        const allFavorites = await db.getUserFavorites(ctx.user.id);
        const jewelryItems = input.jewelryItemIds
          ? allFavorites.filter((f) => input.jewelryItemIds!.includes(String(f.id)))
          : [];

        const tips = await generateStylingTips(
          wardrobeItems.map((item) => ({
            id: String(item.id),
            name: item.name,
            category: item.category,
            brand: item.brand,
            color: item.color,
            material: item.material,
            imageUrl: item.imageUrl,
            season: item.season,
            occasion: item.occasion,
          })),
          jewelryItems.map((f) => ({
            id: String(f.id),
            name: f.modelName || `${f.jewelryType} favori`,
            type: f.jewelryType,
            metal: null,
            gem: null,
            brand: null,
            imageUrl: f.imageUri,
          })),
          input.occasion
        );

        return { tips };
      }),

    // Analyze color harmony
    analyzeColors: publicProcedure
      .input(z.object({
        colors: z.array(z.string()),
      }))
      .query(async ({ input }) => {
        return analyzeColorHarmony(input.colors);
      }),
  }),

  // ============================================
  // PARTNER BRANDS ROUTES
  // ============================================
  partnerBrands: router({
    // List all partner brands
    list: publicProcedure.query(async () => {
      const brands = await db.getPartnerBrands();
      return brands.map(b => ({ ...b, id: String(b.id) }));
    }),

    // Get featured partner brands
    featured: publicProcedure.query(async () => {
      const brands = await db.getFeaturedPartnerBrands();
      return brands.map(b => ({ ...b, id: String(b.id) }));
    }),

    // Get brand by ID
    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const brand = await db.getPartnerBrandById(Number(input.id));
        if (!brand) return null;
        return { ...brand, id: String(brand.id) };
      }),

    // Get brand by slug
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const brand = await db.getPartnerBrandBySlug(input.slug);
        if (!brand) return null;
        return { ...brand, id: String(brand.id) };
      }),

    // Create a new partner brand (admin only)
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        slug: z.string().min(1).max(128),
        description: z.string().optional(),
        logoUrl: z.string().optional(),
        websiteUrl: z.string().optional(),
        isPremium: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
        specialty: z.string().optional(),
        country: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const brand = await db.createPartnerBrand(input);
        if (!brand) return null;
        return { ...brand, id: String(brand.id) };
      }),
  }),

  // ============================================
  // PARTNER JEWELRY ROUTES
  // ============================================
  partnerJewelry: router({
    // List partner jewelry with filters
    list: publicProcedure
      .input(z.object({
        brandId: z.string().optional(),
        type: z.string().optional(),
        metalType: z.string().optional(),
        gemType: z.string().optional(),
        collection: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const dbInput = input ? {
          ...input,
          brandId: input.brandId ? Number(input.brandId) : undefined
        } : undefined;
        const items = await db.getPartnerJewelry(dbInput);
        return items.map(i => ({ ...i, id: String(i.id), brandId: String(i.brandId) }));
      }),

    // Get jewelry by ID
    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const item = await db.getPartnerJewelryById(Number(input.id));
        if (!item) return null;
        return { ...item, id: String(item.id), brandId: String(item.brandId) };
      }),

    // Get jewelry by brand
    getByBrand: publicProcedure
      .input(z.object({ brandId: z.string() }))
      .query(async ({ input }) => {
        const items = await db.getPartnerJewelryByBrand(Number(input.brandId));
        return items.map(i => ({ ...i, id: String(i.id), brandId: String(i.brandId) }));
      }),

    // Create partner jewelry (admin only)
    create: adminProcedure
      .input(z.object({
        brandId: z.string(),
        name: z.string().min(1).max(255),
        type: z.enum(["necklace", "earrings", "ring", "bracelet", "anklet", "brooch", "set"]),
        description: z.string().optional(),
        priceInCents: z.number().optional(),
        currency: z.string().optional(),
        imageUrl: z.string().optional(),
        additionalImages: z.string().optional(),
        productUrl: z.string().optional(),
        metalType: z.enum(["gold", "silver", "rose_gold", "platinum", "brass", "copper", "resin", "polymer", "other"]).optional(),
        gemType: z.enum(["diamond", "ruby", "sapphire", "emerald", "pearl", "crystal", "none", "other"]).optional(),
        collection: z.string().optional(),
        tags: z.string().optional(),
        isTryOnEnabled: z.boolean().optional(),
        tryOnImageUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const item = await db.createPartnerJewelry({
          ...input,
          brandId: Number(input.brandId)
        });
        if (!item) return null;
        return { ...item, id: String(item.id), brandId: String(item.brandId) };
      }),

    // Track view
    trackView: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.incrementPartnerJewelryStats(Number(input.id), 'viewCount');
        return { success: true };
      }),

    // Track try-on
    trackTryOn: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.incrementPartnerJewelryStats(Number(input.id), 'tryOnCount');
        return { success: true };
      }),

    // Track click to product page
    trackClick: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.incrementPartnerJewelryStats(Number(input.id), 'clickCount');
        return { success: true };
      }),

    // Get user favorites
    favorites: protectedProcedure.query(async ({ ctx }) => {
      const items = await db.getPartnerJewelryFavorites(ctx.user.id);
      return items.map(i => ({ ...i, id: String(i.id), jewelryId: String(i.jewelryId) }));
    }),

    // Add to favorites
    addFavorite: protectedProcedure
      .input(z.object({ jewelryId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return db.addPartnerJewelryFavorite(ctx.user.id, Number(input.jewelryId));
      }),

    // Remove from favorites
    removeFavorite: protectedProcedure
      .input(z.object({ jewelryId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return db.removePartnerJewelryFavorite(ctx.user.id, Number(input.jewelryId));
      }),

    // Check if favorited
    isFavorited: protectedProcedure
      .input(z.object({ jewelryId: z.string() }))
      .query(async ({ ctx, input }) => {
        return db.isPartnerJewelryFavorited(ctx.user.id, Number(input.jewelryId));
      }),
  }),

  // ============================================
  // VIRTUAL TRY-ON ROUTE
  // ============================================
  virtualTryOn: router({
    // Generate a try-on image using AI image editing
    generate: publicProcedure
      .input(z.object({
        modelImageUrl: z.string().url(),
        jewelryImageUrl: z.string().url(),
        // Mode d'essayage : bijoux, chaussures, vêtements, accessoires
        category: z.enum(["jewelry", "shoes", "clothing", "accessories"]).default("jewelry"),
        // Sous-type pour les bijoux
        jewelryType: z.enum(["earrings", "necklace", "bracelet", "ring", "anklet", "set"]).optional(),
        // Sous-type pour les accessoires
        accessoryType: z.enum(["bag", "belt", "sunglasses", "scarf", "hat", "watch", "other"]).optional(),
        jewelryName: z.string().optional(),
        // Nombre de variantes à générer (1-4)
        numSamples: z.number().int().min(1).max(4).default(1),
        // Pose du mannequin
        pose: z.enum(["front", "side", "walking", "back"]).default("front"),
        // Mode qualité: strict = contraintes renforcées (pose/échelle/intégration)
        qualityMode: z.enum(["standard", "strict"]).default("standard"),
        // Mode résultat garanti: relance en arrière-plan jusqu'au seuil minimum
        guaranteedResult: z.boolean().default(false),
        qualityThreshold: z.number().min(50).max(95).default(72),
        modelCandidates: z.string().optional(),
        // ID du mannequin sélectionné (permet d'adapter les proportions)
        modelId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const itemName = input.jewelryName || input.jewelryType || input.accessoryType || input.category;

        // Déduit le type de vue du mannequin depuis son ID
        const modelId = input.modelId ?? "";
        type ModelViewType = "face" | "hand" | "wrist" | "ankle" | "fullbody";
        const detectModelView = (id: string): ModelViewType => {
          if (id.startsWith("face") || id === "rousse") return "face";
          if (id.startsWith("hand")) return "hand";
          if (id.startsWith("wrist")) return "wrist";
          if (id.startsWith("ankle")) return "ankle";
          return "fullbody";
        };
        const modelView = detectModelView(modelId);

        // Instructions de proportion adaptées au type de vue
        const modelViewContext: Record<ModelViewType, string> = {
          face: "Image 1 shows a CLOSE-UP OF A FACE/HEAD. All items must be scaled to fit a human face/head. Earrings at earlobe scale, necklaces at neck scale, glasses at face width. Nothing should cover the entire face.",
          hand: "Image 1 shows a CLOSE-UP OF HANDS. Items must be scaled to human hand proportions. Rings fit finger width, bracelets fit wrist/hand size. Keep the hand clearly visible.",
          wrist: "Image 1 shows a CLOSE-UP OF A WRIST/FOREARM. Items must fit the wrist precisely — bracelet or watch scale only. Do not scale up beyond the wrist area.",
          ankle: "Image 1 shows a CLOSE-UP OF AN ANKLE/FOOT. Items must fit ankle proportions — anklet or small accessory scale only.",
          fullbody: "Image 1 shows a FULL BODY person. All items must be scaled to realistic body-relative size. Scarf no wider than shoulders, bag no bigger than torso, hat fitting the head.",
        };
        const modelViewNote = modelViewContext[modelView];

        // Pose courte (1 phrase max)
        const posePhrases: Record<string, string> = {
          front: "front-facing, standing upright",
          side: "3/4 side profile pose",
          walking: "natural walking pose, mid-stride",
          back: "back to camera, rear view",
        };
        const pose = posePhrases[input.pose ?? "front"] ?? posePhrases.front;

        // Instruction d'adaptation lumière (commune à tous les prompts)
        const lightingRule = "LIGHTING: Analyze the light source, direction, intensity, and color temperature in Image 1. Apply the exact same lighting to the added item — matching shadows, highlights, and reflections so the item looks naturally lit by the same light as the person.";
        const jewelryScaleRule = "JEWELRY SCALE: Keep true-to-life jewelry proportions. Never oversized. Earrings must fit earlobe anatomy (small to medium), rings must not exceed finger width, bracelets must hug wrist naturally (not chunky/oversized), necklaces must keep realistic chain thickness and pendant size. Match Image 2 proportions conservatively.";

        // ── Prompts courts par catégorie ────────────
        const strictRule =
          input.qualityMode === "strict"
            ? "QUALITY CHECK: Strictly enforce requested pose and anatomical placement. Reject oversized items, wrong body placement, and distorted proportions. Keep rendering photorealistic and coherent."
            : "";
        let prompt: string;

        if (input.category === "jewelry") {
          const placement: Record<string, string> = {
            earrings: "on the earlobes",
            necklace: "around the neck, draped on the chest",
            bracelet: "on the wrist",
            ring: "on a finger",
            anklet: "around the ankle",
            set: "earrings on ears, necklace on neck, bracelet on wrist",
          };
          const where = placement[input.jewelryType || "earrings"] ?? placement.earrings;
          prompt = `Virtual try-on. ${modelViewNote} Image 2: ${input.jewelryType ?? "jewelry"}. Place the jewelry ${where}. Keep face, skin tone, hair, and pose identical. Photorealistic luxury jewelry photography. ${jewelryScaleRule} ${strictRule} ${lightingRule}`;

        } else if (input.category === "shoes") {
          prompt = `Virtual try-on. ${modelViewNote} Image 2: shoes. Show full body head-to-toe (9:16 portrait), ${pose}. Place these exact shoes on both feet. Feet fully visible at bottom. Keep face, hair, skin, clothing unchanged. ${strictRule} ${lightingRule}`;

        } else if (input.category === "clothing") {
          prompt = `Virtual try-on. ${modelViewNote} Image 2: garment. Show full body head-to-toe (9:16 portrait), ${pose}. Dress the person in this exact garment. Full outfit visible, no cropping. Keep face, skin, hair unchanged. ${strictRule} ${lightingRule}`;

        } else {
          const accPlacement: Record<string, string> = {
            bag: "holding or carrying the bag naturally on shoulder or arm",
            belt: "wearing the belt snugly around the waist",
            sunglasses: "wearing the glasses on the face, temples on ears",
            scarf: "wearing the scarf loosely draped around the neck and shoulders — the scarf must be realistically sized: no wider than the shoulders, no longer than mid-torso, draped naturally like a real scarf on a person",
            hat: "wearing the hat on top of the head, fitting naturally",
            watch: "wearing the watch on the wrist, strap fitting snugly",
            other: "wearing or carrying the accessory naturally at correct body scale",
          };
          const accScaleRule: Record<string, string> = {
            bag: "SCALE: Bag must be realistic handbag size — not larger than the person's torso.",
            belt: "SCALE: Belt must fit exactly at waist width, no wider.",
            sunglasses: "SCALE: Glasses must fit face width precisely, frames proportional to face.",
            scarf: "SCALE CRITICAL: The scarf must appear at TRUE LIFE SIZE. It should be narrower than the person's shoulders and no longer than mid-chest. Never oversized, never covering the face. Must look like a real scarf worn by a human, not a giant fabric.",
            hat: "SCALE: Hat must fit the head naturally — not oversized or floating above the head.",
            watch: "SCALE: Watch face must be wrist-proportionate (30-45mm equivalent), strap fitting snugly.",
            other: "SCALE: Keep the accessory at realistic human-scale proportions.",
          };
          const where = accPlacement[input.accessoryType || "other"] ?? accPlacement.other;
          const scaleRule = accScaleRule[input.accessoryType || "other"] ?? accScaleRule.other;
          prompt = `Virtual try-on. ${modelViewNote} Image 2: ${input.accessoryType ?? "accessory"}. Show the person ${where}. ${scaleRule} Keep face, hair, skin, clothing completely unchanged. Photorealistic result. ${strictRule} ${lightingRule}`;
        }

        // Générer numSamples variantes avec retry automatique (3 tentatives par image)
        const numSamples = input.numSamples ?? 1;
        const modelCandidates = parseModelCandidates(input.modelCandidates);
        let totalAiCostUsd = 0;
        let totalAiApiCalls = 0;
        const generateWithRetry = async (
          attempt = 0,
          strictBoost = false,
        ): Promise<{ url: string; modelUsed?: string; aiCostUsd: number; aiApiCalls: number } | null> => {
          try {
            const result = await generateImage({
              prompt: strictBoost
                ? `${prompt} STRICT RESULT: keep pose and placement exact, no distortions, no oversized item.`
                : prompt,
              modelCandidates,
              originalImages: [
                { url: input.modelImageUrl, mimeType: "image/jpeg" },
                { url: input.jewelryImageUrl, mimeType: "image/jpeg" },
              ],
            });
            if (!result.url) return null;
            const aiCostUsd = result.estimatedCostUsd ?? 0;
            const aiApiCalls = result.apiCalls ?? 0;
            totalAiCostUsd += aiCostUsd;
            totalAiApiCalls += aiApiCalls;
            return { url: result.url, modelUsed: result.modelUsed, aiCostUsd, aiApiCalls };
          } catch (err: any) {
            console.error(`[TryOn] Attempt ${attempt} failed:`, err.message || err);
            if (attempt < 2) {
              await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
              return generateWithRetry(attempt + 1, strictBoost);
            }
            return null;
          }
        };

        // Générer jusqu'à atteindre le nombre demandé (avec plafond d'essais)
        // pour éviter de renvoyer 1 image quand l'utilisateur en demande 2/4.
        const urls: string[] = [];
        const modelsUsed = new Set<string>();
        const maxAttempts = Math.max(numSamples * 4, 8);
        let attempts = 0;
        while (urls.length < numSamples && attempts < maxAttempts) {
          const remaining = numSamples - urls.length;
          const batchSize = Math.min(remaining, 2);
          const batch = Array.from({ length: batchSize }, () => generateWithRetry());
          const batchResults = await Promise.all(batch);
          for (const item of batchResults) {
            if (!item?.url) continue;
            urls.push(item.url);
            if (item.modelUsed) modelsUsed.add(item.modelUsed);
          }
          attempts += batchSize;

          if (urls.length < numSamples) {
            await new Promise((r) => setTimeout(r, 700));
          }
        }

        if (urls.length === 0) {
          throw new Error("Image generation failed after 3 attempts");
        }
        if (urls.length < numSamples) {
          console.warn(`[TryOn] Partial result: ${urls.length}/${numSamples} images generated`);
        }

        let qualityAssessment: QualityAssessment | null = null;
        const threshold = input.qualityThreshold ?? 72;
        if (urls[0]) {
          qualityAssessment = await assessTryOnQuality({
            modelImageUrl: input.modelImageUrl,
            itemImageUrl: input.jewelryImageUrl,
            resultImageUrl: urls[0],
            category: input.category,
            pose: input.pose,
          });
        }

        if (input.guaranteedResult && urls[0]) {
          const maxGuaranteeRounds = 2;
          let round = 0;
          while (round < maxGuaranteeRounds && qualityAssessment && qualityAssessment.overall < threshold) {
            round += 1;
            const strictRetry = await generateWithRetry(0, true);
            if (!strictRetry?.url) break;
            if (strictRetry.modelUsed) modelsUsed.add(strictRetry.modelUsed);
            const strictAssessment = await assessTryOnQuality({
              modelImageUrl: input.modelImageUrl,
              itemImageUrl: input.jewelryImageUrl,
              resultImageUrl: strictRetry.url,
              category: input.category,
              pose: input.pose,
            });
            if (strictAssessment.overall >= (qualityAssessment?.overall ?? 0)) {
              urls[0] = strictRetry.url;
              qualityAssessment = strictAssessment;
            }
            if (strictAssessment.overall >= threshold) break;
          }
        }

        return {
          resultImageUrl: urls[0],
          resultImageUrls: urls,
          jewelryName: itemName,
          jewelryType: input.jewelryType || input.accessoryType || input.category,
          category: input.category,
          qualityScore: qualityAssessment?.overall ?? null,
          qualityDetails: qualityAssessment,
          modelsUsed: Array.from(modelsUsed),
          guaranteed: input.guaranteedResult,
          aiCostUsd: Number(totalAiCostUsd.toFixed(6)),
          aiApiCalls: totalAiApiCalls,
        };
      }),

    // Generate a full outfit try-on with multiple items from different categories
    outfit: publicProcedure
      .input(z.object({
        modelImageUrl: z.string().url(),
        // Vêtements
        tshirtImageUrl: z.string().url().optional(),
        jacketImageUrl: z.string().url().optional(),
        pantsImageUrl: z.string().url().optional(),
        skirtImageUrl: z.string().url().optional(),
        // Bijoux
        earringsImageUrl: z.string().url().optional(),
        necklaceImageUrl: z.string().url().optional(),
        braceletImageUrl: z.string().url().optional(),
        ringImageUrl: z.string().url().optional(),
        // Accessoires dédiés
        bagImageUrl: z.string().url().optional(),
        hatImageUrl: z.string().url().optional(),
        beltImageUrl: z.string().url().optional(),
        glassesImageUrl: z.string().url().optional(),
        sunglassesImageUrl: z.string().url().optional(),
        legwearImageUrl: z.string().url().optional(),
        // Accessoires génériques (rétro-compat)
        accessory1ImageUrl: z.string().url().optional(),
        accessory2ImageUrl: z.string().url().optional(),
        // Chaussures
        shoesImageUrl: z.string().url().optional(),
        // Noms (pour l'historique)
        tshirtName: z.string().optional(),
        jacketName: z.string().optional(),
        pantsName: z.string().optional(),
        skirtName: z.string().optional(),
        earringsName: z.string().optional(),
        necklaceName: z.string().optional(),
        braceletName: z.string().optional(),
        ringName: z.string().optional(),
        bagName: z.string().optional(),
        hatName: z.string().optional(),
        beltName: z.string().optional(),
        glassesName: z.string().optional(),
        sunglassesName: z.string().optional(),
        legwearName: z.string().optional(),
        accessory1Name: z.string().optional(),
        accessory2Name: z.string().optional(),
        shoesName: z.string().optional(),
        // Pose
        pose: z.enum(["front", "side", "walking", "back"]).default("front"),
        // Nombre de variantes
        numSamples: z.number().int().min(1).max(4).default(1),
        // Mode qualité: strict = contraintes renforcées
        qualityMode: z.enum(["standard", "strict"]).default("standard"),
        guaranteedResult: z.boolean().default(false),
        qualityThreshold: z.number().min(50).max(95).default(72),
        modelCandidates: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const posePhrases: Record<string, string> = {
          front: "front-facing, standing upright",
          side: "3/4 side profile pose",
          walking: "natural walking pose, mid-stride",
          back: "back to camera, rear view",
        };
        const pose = posePhrases[input.pose ?? "front"] ?? posePhrases.front;
        const lightingRule = "LIGHTING: Match the lighting, shadows, and color temperature of Image 1 exactly on all added items.";
        const jewelryScaleRule = "JEWELRY SCALE: All jewelry must remain true-to-life and subtle, never oversized. Preserve realistic proportions to anatomy: earrings fitted to earlobes, rings within finger width, bracelets close to wrist circumference, necklaces with realistic chain/pendant dimensions. Favor slightly smaller scale if uncertain.";
        const fullOutfitReplacementRule = "WARDROBE REPLACEMENT: Replace all visible original clothes from Image 1. Do not keep, blend, or partially preserve any original garment, pattern, logo, sleeve, collar, hem, or fabric from the source outfit. The final look must be a complete new outfit.";
        const strictRule =
          input.qualityMode === "strict"
            ? "QUALITY CHECK: Strictly enforce requested pose and full outfit replacement. Reject outputs with leftover original garments, oversized jewelry, wrong body placement, or anatomy distortions."
            : "";
        const hasTopProvided = Boolean(input.tshirtImageUrl || input.jacketImageUrl);
        const hasBottomProvided = Boolean(input.pantsImageUrl || input.skirtImageUrl);
        const missingGarmentFallbackRule = `${hasTopProvided ? "" : "TOP FALLBACK: If no top reference is provided, generate a simple neutral top that matches the outfit style."} ${hasBottomProvided ? "" : "BOTTOM FALLBACK: If no bottom reference is provided, generate simple neutral pants or skirt that matches the outfit style."}`.trim();

        // Construire la liste des images de référence et les instructions
        const referenceImages: { url: string; mimeType: string }[] = [
          { url: input.modelImageUrl, mimeType: "image/jpeg" },
        ];
        const instructions: string[] = [];
        let imgIndex = 2;

        // Vêtements
        if (input.tshirtImageUrl) {
          referenceImages.push({ url: input.tshirtImageUrl, mimeType: "image/jpeg" });
          instructions.push(`Image ${imgIndex++}: t-shirt/top — dress the person in this top`);
        }
        if (input.jacketImageUrl) {
          referenceImages.push({ url: input.jacketImageUrl, mimeType: "image/jpeg" });
          instructions.push(`Image ${imgIndex++}: jacket/blazer — layer this jacket over the top`);
        }
        if (input.pantsImageUrl) {
          referenceImages.push({ url: input.pantsImageUrl, mimeType: "image/jpeg" });
          instructions.push(`Image ${imgIndex++}: pants — dress the person in these trousers/pants`);
        }
        if (input.skirtImageUrl) {
          referenceImages.push({ url: input.skirtImageUrl, mimeType: "image/jpeg" });
          instructions.push(`Image ${imgIndex++}: skirt/dress — dress the person in this skirt or dress`);
        }
        // Bijoux
        if (input.earringsImageUrl) {
          referenceImages.push({ url: input.earringsImageUrl, mimeType: "image/jpeg" });
          instructions.push(`Image ${imgIndex++}: earrings — place these earrings on the earlobes`);
        }
        if (input.necklaceImageUrl) {
          referenceImages.push({ url: input.necklaceImageUrl, mimeType: "image/jpeg" });
          instructions.push(`Image ${imgIndex++}: necklace — drape this necklace around the neck`);
        }
        if (input.braceletImageUrl) {
          referenceImages.push({ url: input.braceletImageUrl, mimeType: "image/jpeg" });
          instructions.push(`Image ${imgIndex++}: bracelet — place this bracelet on the wrist`);
        }
        if (input.ringImageUrl) {
          referenceImages.push({ url: input.ringImageUrl, mimeType: "image/jpeg" });
          instructions.push(`Image ${imgIndex++}: ring — place this ring on a finger`);
        }
        // Accessoires dédiés
        if (input.bagImageUrl) {
          referenceImages.push({ url: input.bagImageUrl, mimeType: "image/jpeg" });
          instructions.push(`Image ${imgIndex++}: handbag/purse — show the person holding or carrying this bag on shoulder or arm`);
        }
        if (input.hatImageUrl) {
          referenceImages.push({ url: input.hatImageUrl, mimeType: "image/jpeg" });
          instructions.push(`Image ${imgIndex++}: hat/cap — place this hat on the person's head naturally`);
        }
        if (input.beltImageUrl) {
          referenceImages.push({ url: input.beltImageUrl, mimeType: "image/jpeg" });
          instructions.push(`Image ${imgIndex++}: belt — place this belt around the person's waist`);
        }
        if (input.glassesImageUrl) {
          referenceImages.push({ url: input.glassesImageUrl, mimeType: "image/jpeg" });
          instructions.push(`Image ${imgIndex++}: eyeglasses — place these glasses on the person's face (on nose and ears)`);
        }
        if (input.sunglassesImageUrl) {
          referenceImages.push({ url: input.sunglassesImageUrl, mimeType: "image/jpeg" });
          instructions.push(`Image ${imgIndex++}: sunglasses — place these sunglasses on the person's face (on nose and ears)`);
        }
        if (input.legwearImageUrl) {
          referenceImages.push({ url: input.legwearImageUrl, mimeType: "image/jpeg" });
          instructions.push(`Image ${imgIndex++}: tights/stockings/socks — dress the person's legs in this legwear`);
        }
        // Accessoires génériques (rétro-compat)
        if (input.accessory1ImageUrl) {
          referenceImages.push({ url: input.accessory1ImageUrl, mimeType: "image/jpeg" });
          instructions.push(`Image ${imgIndex++}: accessory — style the person with this accessory naturally`);
        }
        if (input.accessory2ImageUrl) {
          referenceImages.push({ url: input.accessory2ImageUrl, mimeType: "image/jpeg" });
          instructions.push(`Image ${imgIndex++}: second accessory — add this accessory naturally`);
        }
        // Chaussures
        if (input.shoesImageUrl) {
          referenceImages.push({ url: input.shoesImageUrl, mimeType: "image/jpeg" });
          instructions.push(`Image ${imgIndex++}: shoes — place these exact shoes on both feet (feet fully visible at bottom)`);
        }

        if (instructions.length === 0) {
          throw new Error("At least one item must be selected for outfit try-on");
        }

        const prompt = `Full outfit virtual try-on. Image 1: person (${pose}). ${instructions.join(". ")}. Show full body head-to-toe (9:16 portrait). Keep face, skin tone, and hair identical. Photorealistic fashion photography. ${fullOutfitReplacementRule} ${missingGarmentFallbackRule} ${jewelryScaleRule} ${strictRule} ${lightingRule}`;

        const modelCandidates = parseModelCandidates(input.modelCandidates);
        let totalAiCostUsd = 0;
        let totalAiApiCalls = 0;
        const generateWithRetry = async (
          attempt = 0,
          strictBoost = false,
        ): Promise<{ url: string; modelUsed?: string; aiCostUsd: number; aiApiCalls: number } | null> => {
          try {
            const result = await generateImage({
              prompt: strictBoost
                ? `${prompt} STRICT RESULT: enforce complete wardrobe replacement and precise anatomical placement for every item.`
                : prompt,
              modelCandidates,
              originalImages: referenceImages,
            });
            if (!result.url) return null;
            const aiCostUsd = result.estimatedCostUsd ?? 0;
            const aiApiCalls = result.apiCalls ?? 0;
            totalAiCostUsd += aiCostUsd;
            totalAiApiCalls += aiApiCalls;
            return { url: result.url, modelUsed: result.modelUsed, aiCostUsd, aiApiCalls };
          } catch (err: any) {
            console.error(`[TryOn Outfit] Attempt ${attempt} failed:`, err.message || err);
            if (attempt < 2) {
              await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
              return generateWithRetry(attempt + 1, strictBoost);
            }
            return null;
          }
        };

        const numSamples = input.numSamples ?? 1;
        const urls: string[] = [];
        const modelsUsed = new Set<string>();
        const maxAttempts = Math.max(numSamples * 4, 8);
        let attempts = 0;
        while (urls.length < numSamples && attempts < maxAttempts) {
          const remaining = numSamples - urls.length;
          const batchSize = Math.min(remaining, 2);
          const batch = Array.from({ length: batchSize }, () => generateWithRetry());
          const batchResults = await Promise.all(batch);
          for (const item of batchResults) {
            if (!item?.url) continue;
            urls.push(item.url);
            if (item.modelUsed) modelsUsed.add(item.modelUsed);
          }
          attempts += batchSize;

          if (urls.length < numSamples) {
            await new Promise((r) => setTimeout(r, 700));
          }
        }

        if (urls.length === 0) {
          throw new Error("Outfit generation failed after 3 attempts");
        }
        if (urls.length < numSamples) {
          console.warn(`[TryOn Outfit] Partial result: ${urls.length}/${numSamples} images generated`);
        }

        let qualityAssessment: QualityAssessment | null = null;
        const threshold = input.qualityThreshold ?? 72;
        const firstReference = referenceImages[1]?.url ?? input.modelImageUrl;
        if (urls[0]) {
          qualityAssessment = await assessTryOnQuality({
            modelImageUrl: input.modelImageUrl,
            itemImageUrl: firstReference,
            resultImageUrl: urls[0],
            category: "outfit",
            pose: input.pose,
          });
        }

        if (input.guaranteedResult && urls[0]) {
          const maxGuaranteeRounds = 2;
          let round = 0;
          while (round < maxGuaranteeRounds && qualityAssessment && qualityAssessment.overall < threshold) {
            round += 1;
            const strictRetry = await generateWithRetry(0, true);
            if (!strictRetry?.url) break;
            if (strictRetry.modelUsed) modelsUsed.add(strictRetry.modelUsed);
            const strictAssessment = await assessTryOnQuality({
              modelImageUrl: input.modelImageUrl,
              itemImageUrl: firstReference,
              resultImageUrl: strictRetry.url,
              category: "outfit",
              pose: input.pose,
            });
            if (strictAssessment.overall >= (qualityAssessment?.overall ?? 0)) {
              urls[0] = strictRetry.url;
              qualityAssessment = strictAssessment;
            }
            if (strictAssessment.overall >= threshold) break;
          }
        }

        return {
          resultImageUrl: urls[0],
          resultImageUrls: urls,
          category: "outfit" as const,
          qualityScore: qualityAssessment?.overall ?? null,
          qualityDetails: qualityAssessment,
          modelsUsed: Array.from(modelsUsed),
          guaranteed: input.guaranteedResult,
          aiCostUsd: Number(totalAiCostUsd.toFixed(6)),
          aiApiCalls: totalAiApiCalls,
        };
      }),
  }),  // fin virtualTryOn

  // ============================================
  // COMMUNITY ROUTES
  // ============================================
  community: router({
    // List posts (most recent first)
    list: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(20), offset: z.number().default(0) }).optional())
      .query(async ({ input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) return [];
        const { communityPosts } = await import('../drizzle/schema');
        const { desc } = await import('drizzle-orm');
        const posts = await dbInstance
          .select()
          .from(communityPosts)
          .orderBy(desc(communityPosts.isPinned), desc(communityPosts.createdAt))
          .limit(input?.limit ?? 20)
          .offset(input?.offset ?? 0);
        return posts.map(p => ({ ...p, id: String(p.id) }));
      }),

    // Create a new post (authenticated users only)
    create: protectedProcedure
      .input(z.object({
        authorName: z.string().min(1).max(255),
        authorAvatar: z.string().optional(),
        content: z.string().min(1).max(2000),
        imageUrl: z.string().optional(),
        jewelryType: z.string().max(64).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const authorName = normalizeCommunityText(input.authorName);
        const content = normalizeCommunityText(input.content);
        if (!authorName || !content) {
          throw new Error("Le texte de la publication est invalide.");
        }
        if (containsBlockedCommunityTerm(content)) {
          throw new Error("Contenu non autorise. Merci de reformuler.");
        }
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new Error('DB not available');
        const { communityPosts } = await import('../drizzle/schema');
        const [result] = await dbInstance.insert(communityPosts).values({
          userId: ctx.user.id,
          authorName,
          authorAvatar: input.authorAvatar || null,
          content,
          imageUrl: input.imageUrl || null,
          jewelryType: input.jewelryType || null,
          likesCount: 0,
          commentsCount: 0,
        });
        return { success: true, id: result ? String((result as any)?.insertId) : null };
      }),

    // Toggle like on a post (authenticated users only)
    like: protectedProcedure
      .input(z.object({ postId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new Error('DB not available');
        const { communityPosts, communityPostLikes } = await import('../drizzle/schema');
        const { eq, and, sql } = await import('drizzle-orm');

        const postId = Number(input.postId);

        // Wrap entire like/unlike operation in a transaction to prevent race conditions
        await dbInstance.transaction(async (tx) => {
          // Check if user already liked this post
          const existingLike = await tx
            .select()
            .from(communityPostLikes)
            .where(and(
              eq(communityPostLikes.postId, postId),
              eq(communityPostLikes.userId, ctx.user.id)
            ));

          if (existingLike.length > 0) {
            // Unlike: remove the like and decrement counter
            await tx
              .delete(communityPostLikes)
              .where(and(
                eq(communityPostLikes.postId, postId),
                eq(communityPostLikes.userId, ctx.user.id)
              ));
            await tx
              .update(communityPosts)
              .set({ likesCount: sql`GREATEST(${communityPosts.likesCount} - 1, 0)` })
              .where(eq(communityPosts.id, postId));
          } else {
            // Like: add the like record and increment counter
            await tx.insert(communityPostLikes).values({
              postId: postId,
              userId: ctx.user.id,
            });
            await tx
              .update(communityPosts)
              .set({ likesCount: sql`${communityPosts.likesCount} + 1` })
              .where(eq(communityPosts.id, postId));
          }
        });
        return { success: true };
      }),
  }),

  // ============================================
  // PARTNER APPLICATIONS
  // ============================================
  partnerApplications: router({
    // Submit a new partner application
    submit: publicProcedure
      .input(z.object({
        brandName: z.string().min(2).max(255),
        contactName: z.string().min(2).max(255),
        email: z.string().email().max(320),
        websiteUrl: z.string().optional(),
        jewelryTypes: z.string().optional(),
        priceRange: z.string().optional(),
        message: z.string().max(2000).optional(),
      }))
      .mutation(async ({ input }) => {
        const dbInstance = await db.getDb();
        let insertedId: number | null = null;

        if (!dbInstance) {
          console.warn('[PartnerApplications] DB not available, application not saved');
        } else {
          const { partnerApplications } = await import('../drizzle/schema');
          const [result] = await dbInstance.insert(partnerApplications).values({
            brandName: input.brandName,
            contactName: input.contactName,
            email: input.email,
            websiteUrl: input.websiteUrl || null,
            jewelryTypes: input.jewelryTypes || null,
            priceRange: input.priceRange || null,
            message: input.message || null,
            status: 'pending',
          });
          insertedId = (result as any)?.insertId ?? null;
        }

        // Envoi des emails automatiques (non bloquant)
        try {
          const { sendPartnerApplicationEmails } = await import('./services/email');
          // Séparer prénom et nom depuis contactName
          const nameParts = (input.contactName || '').trim().split(' ');
          const firstName = nameParts[0] || input.contactName;
          const lastName = nameParts.slice(1).join(' ') || '';

          const emailResult = await sendPartnerApplicationEmails({
            firstName,
            lastName,
            brandName: input.brandName,
            email: input.email,
            phone: undefined,
            website: input.websiteUrl,
            instagram: undefined,
            description: input.message,
            productTypes: input.jewelryTypes,
            priceRange: input.priceRange,
          });
          console.log('[PartnerApplications] Emails envoyés:', emailResult);
        } catch (emailErr) {
          // L'erreur email ne doit pas bloquer la soumission
          console.error('[PartnerApplications] Erreur envoi email:', emailErr);
        }

        return { success: true, id: insertedId ? String(insertedId) : null };
      }),

    // List all applications (admin only, protected by secret code)
    list: publicProcedure
      .input(z.object({
        adminCode: z.string(),
      }))
      .query(async ({ input }) => {
        const ADMIN_CODE = process.env.ADMIN_CODE;
        if (!ADMIN_CODE) {
          console.error('[Admin] Admin code not configured on server');
          throw new Error('Serveur non configuré pour les operations admin');
        }
        const { timingSafeEqual } = await import('crypto');
        const a = Buffer.from(input.adminCode);
        const b = Buffer.from(ADMIN_CODE);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          throw new Error('Code admin invalide');
        }
        const dbInstance = await db.getDb();
        if (!dbInstance) return { applications: [] };
        const { partnerApplications } = await import('../drizzle/schema');
        const apps = await dbInstance
          .select()
          .from(partnerApplications)
          .orderBy(partnerApplications.createdAt);
        return { applications: apps.map(a => ({ ...a, id: String(a.id) })) };
      }),

    // Update application status (admin only)
    updateStatus: publicProcedure
      .input(z.object({
        adminCode: z.string(),
        id: z.string(),
        status: z.enum(['pending', 'approved', 'rejected']),
      }))
      .mutation(async ({ input }) => {
        const ADMIN_CODE = process.env.ADMIN_CODE;
        if (!ADMIN_CODE) {
          console.error('[Admin] Admin code not configured on server');
          throw new Error('Serveur non configuré pour les operations admin');
        }
        const { timingSafeEqual } = await import('crypto');
        const a = Buffer.from(input.adminCode);
        const b = Buffer.from(ADMIN_CODE);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          throw new Error('Code admin invalide');
        }
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new Error('DB non disponible');
        const { partnerApplications } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        await dbInstance
          .update(partnerApplications)
          .set({ status: input.status })
          .where(eq(partnerApplications.id, Number(input.id)));
        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;

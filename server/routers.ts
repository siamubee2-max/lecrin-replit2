import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { uploadImageForAnalysis, analyzeImageForJewelry, detectFaceLandmarks } from "./face-detection";

export const appRouter = router({
  system: systemRouter,
  
  // ============================================
  // AUTH ROUTES
  // ============================================
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============================================
  // FAVORITES ROUTES
  // ============================================
  favorites: router({
    // Get all user favorites
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserFavorites(ctx.user.id);
    }),

    // Add a new favorite
    add: protectedProcedure
      .input(z.object({
        jewelryType: z.string().min(1).max(64),
        jewelryIcon: z.string().max(16).optional(),
        modelName: z.string().max(128).optional(),
        imageUri: z.string().optional(),
        jewelryItemId: z.number().optional(),
        creatorId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.addFavorite({
          userId: ctx.user.id,
          jewelryType: input.jewelryType,
          jewelryIcon: input.jewelryIcon,
          modelName: input.modelName,
          imageUri: input.imageUri,
          jewelryItemId: input.jewelryItemId,
          creatorId: input.creatorId,
        });
        return { id };
      }),

    // Remove a favorite
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.removeFavorite(input.id, ctx.user.id);
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
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const creator = await db.getCreatorById(input.id);
        if (!creator) return null;
        
        const jewelry = await db.getCreatorJewelry(input.id);
        return { ...creator, jewelry };
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
      return db.getDemoBodyParts();
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
        return db.getBodyPartsByType(input.type);
      }),

    // Get user's custom body parts (wardrobe)
    userParts: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserBodyParts(ctx.user.id);
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
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteUserBodyPart(input.id, ctx.user.id);
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
      return db.getUserCollection(ctx.user.id);
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
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.removeFromCollection(input.id);
        return { success: true };
      }),

    // Update item in collection
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
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
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCollectionItem(id, data);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;

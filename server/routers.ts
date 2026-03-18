import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { uploadImageForAnalysis, analyzeImageForJewelry, detectFaceLandmarks } from "./face-detection";
import { storagePut } from "./storage";
import { generateImage } from "./_core/imageGeneration";
import { generateLookSuggestions, generateStylingTips, analyzeColorHarmony } from "./ai-stylist";

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

  // ============================================
  // WARDROBE ROUTES (Mon Dressing)
  // ============================================
  wardrobe: router({
    // Get all user wardrobe items
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserWardrobeItems(ctx.user.id);
    }),

    // Get a single wardrobe item
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getWardrobeItemById(input.id, ctx.user.id);
      }),

    // Search wardrobe items with filters
    search: protectedProcedure
      .input(z.object({
        category: z.string().optional(),
        brand: z.string().optional(),
        color: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        search: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return db.searchWardrobeItems(ctx.user.id, input);
      }),

    // Add a new wardrobe item
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
        return db.createWardrobeItem({
          userId: ctx.user.id,
          ...input,
        });
      }),

    // Update a wardrobe item
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
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
        const { id, ...data } = input;
        return db.updateWardrobeItem(id, ctx.user.id, data);
      }),

    // Delete a wardrobe item
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const success = await db.deleteWardrobeItem(input.id, ctx.user.id);
        return { success };
      }),

    // Upload wardrobe item image
    uploadImage: protectedProcedure
      .input(z.object({
        base64Data: z.string(),
        mimeType: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const timestamp = Date.now();
        const ext = input.mimeType?.includes("png") ? "png" : "jpg";
        const key = `wardrobe/${ctx.user.id}/${timestamp}.${ext}`;
        
        // Decode base64 and upload
        const buffer = Buffer.from(input.base64Data, "base64");
        const result = await storagePut(key, buffer, input.mimeType || "image/jpeg");
        
        return { url: result.url };
      }),
  }),

  // ============================================
  // SAVED LOOKS ROUTES (AI Stylist)
  // ============================================
  looks: router({
    // Get all user saved looks
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserSavedLooks(ctx.user.id);
    }),

    // Get a single saved look
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getSavedLookById(input.id, ctx.user.id);
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
        id: z.number(),
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
        return db.updateSavedLook(id, ctx.user.id, data);
      }),

    // Delete a saved look
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const success = await db.deleteSavedLook(input.id, ctx.user.id);
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
          id: f.id,
          name: f.modelName || `${f.jewelryType} favori`,
          type: f.jewelryType,
          metal: null,
          gem: null,
          brand: null,
          imageUrl: f.imageUri,
        }));

        const suggestions = await generateLookSuggestions({
          wardrobeItems: wardrobeItems.map((item) => ({
            id: item.id,
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
        wardrobeItemIds: z.array(z.number()),
        jewelryItemIds: z.array(z.number()).optional(),
        occasion: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        // Get wardrobe items by IDs
        const allWardrobeItems = await db.getUserWardrobeItems(ctx.user.id);
        const wardrobeItems = allWardrobeItems.filter((item) => 
          input.wardrobeItemIds.includes(item.id)
        );

        // Get jewelry items by IDs
        const allFavorites = await db.getUserFavorites(ctx.user.id);
        const jewelryItems = input.jewelryItemIds 
          ? allFavorites.filter((f) => input.jewelryItemIds!.includes(f.id))
          : [];

        const tips = await generateStylingTips(
          wardrobeItems.map((item) => ({
            id: item.id,
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
            id: f.id,
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
      return db.getPartnerBrands();
    }),

    // Get featured partner brands
    featured: publicProcedure.query(async () => {
      return db.getFeaturedPartnerBrands();
    }),

    // Get brand by ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getPartnerBrandById(input.id);
      }),

    // Get brand by slug
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return db.getPartnerBrandBySlug(input.slug);
      }),

    // Create a new partner brand (admin only in production)
    create: protectedProcedure
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
        return db.createPartnerBrand(input);
      }),
  }),

  // ============================================
  // PARTNER JEWELRY ROUTES
  // ============================================
  partnerJewelry: router({
    // List partner jewelry with filters
    list: publicProcedure
      .input(z.object({
        brandId: z.number().optional(),
        type: z.string().optional(),
        metalType: z.string().optional(),
        gemType: z.string().optional(),
        collection: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getPartnerJewelry(input);
      }),

    // Get jewelry by ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getPartnerJewelryById(input.id);
      }),

    // Get jewelry by brand
    getByBrand: publicProcedure
      .input(z.object({ brandId: z.number() }))
      .query(async ({ input }) => {
        return db.getPartnerJewelryByBrand(input.brandId);
      }),

    // Create partner jewelry (admin only in production)
    create: protectedProcedure
      .input(z.object({
        brandId: z.number(),
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
        return db.createPartnerJewelry(input);
      }),

    // Track view
    trackView: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.incrementPartnerJewelryStats(input.id, 'viewCount');
        return { success: true };
      }),

    // Track try-on
    trackTryOn: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.incrementPartnerJewelryStats(input.id, 'tryOnCount');
        return { success: true };
      }),

    // Track click to product page
    trackClick: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.incrementPartnerJewelryStats(input.id, 'clickCount');
        return { success: true };
      }),

    // Get user favorites
    favorites: protectedProcedure.query(async ({ ctx }) => {
      return db.getPartnerJewelryFavorites(ctx.user.id);
    }),

    // Add to favorites
    addFavorite: protectedProcedure
      .input(z.object({ jewelryId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.addPartnerJewelryFavorite(ctx.user.id, input.jewelryId);
      }),

    // Remove from favorites
    removeFavorite: protectedProcedure
      .input(z.object({ jewelryId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.removePartnerJewelryFavorite(ctx.user.id, input.jewelryId);
      }),

    // Check if favorited
    isFavorited: protectedProcedure
      .input(z.object({ jewelryId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.isPartnerJewelryFavorited(ctx.user.id, input.jewelryId);
      }),
  }),

  // ============================================
  // VIRTUAL TRY-ON ROUTE
  // ============================================
  virtualTryOn: router({
    // Generate a try-on image using AI image editing (Nano Banana 2)
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
      }))
      .mutation(async ({ input }) => {
        const itemName = input.jewelryName || input.jewelryType || input.accessoryType || input.category;

        // Pose courte (1 phrase max)
        const posePhrases: Record<string, string> = {
          front:   "front-facing, standing upright",
          side:    "3/4 side profile pose",
          walking: "natural walking pose, mid-stride",
          back:    "back to camera, rear view",
        };
        const pose = posePhrases[input.pose ?? "front"] ?? posePhrases.front;

        // Instruction d'adaptation lumière (commune à tous les prompts)
        const lightingRule = "LIGHTING: Analyze the light source, direction, intensity, and color temperature in Image 1. Apply the exact same lighting to the added item — matching shadows, highlights, and reflections so the item looks naturally lit by the same light as the person.";

        // ── Prompts courts par catégorie ────────────
        let prompt: string;

        if (input.category === "jewelry") {
          const placement: Record<string, string> = {
            earrings: "on the earlobes",
            necklace: "around the neck, draped on the chest",
            bracelet: "on the wrist",
            ring:     "on a finger",
            anklet:   "around the ankle",
            set:      "earrings on ears, necklace on neck, bracelet on wrist",
          };
          const where = placement[input.jewelryType || "earrings"] ?? placement.earrings;
          prompt = `Virtual try-on. Image 1: person. Image 2: ${input.jewelryType ?? "jewelry"}. Place the jewelry ${where}. Keep face, skin tone, hair, and pose identical. Photorealistic luxury jewelry photography. ${lightingRule}`;

        } else if (input.category === "shoes") {
          prompt = `Virtual try-on. Image 1: person. Image 2: shoes. Show full body head-to-toe (9:16 portrait), ${pose}. Place these exact shoes on both feet. Feet fully visible at bottom. Keep face, hair, skin, clothing unchanged. ${lightingRule}`;

        } else if (input.category === "clothing") {
          prompt = `Virtual try-on. Image 1: person. Image 2: garment. Show full body head-to-toe (9:16 portrait), ${pose}. Dress the person in this exact garment. Full outfit visible, no cropping. Keep face, skin, hair unchanged. ${lightingRule}`;

        } else {
          const accPlacement: Record<string, string> = {
            bag:        "holding or carrying the bag on shoulder/arm",
            belt:       "wearing the belt around the waist",
            sunglasses: "wearing the glasses on the face",
            scarf:      "wearing the scarf draped around the neck",
            hat:        "wearing the hat on the head",
            watch:      "wearing the watch on the wrist",
            other:      "wearing or carrying the accessory naturally",
          };
          const where = accPlacement[input.accessoryType || "other"] ?? accPlacement.other;
          prompt = `Virtual try-on. Image 1: person (${pose}). Image 2: ${input.accessoryType ?? "accessory"}. Show the person ${where}. Correct scale, realistic materials. Keep appearance identical. ${lightingRule}`;
        }

        // Générer numSamples variantes avec retry automatique (3 tentatives par image)
        const numSamples = input.numSamples ?? 1;
        const generateWithRetry = async (attempt = 0): Promise<string | null> => {
          try {
            const result = await generateImage({
              prompt,
              originalImages: [
                { url: input.modelImageUrl, mimeType: "image/jpeg" },
                { url: input.jewelryImageUrl, mimeType: "image/jpeg" },
              ],
            });
            return result.url ?? null;
          } catch (err) {
            if (attempt < 2) {
              await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
              return generateWithRetry(attempt + 1);
            }
            return null;
          }
        };

        // Générer séquentiellement pour éviter la surcharge (max 2 en parallèle)
        const urls: string[] = [];
        const batchSize = Math.min(numSamples, 2);
        for (let i = 0; i < numSamples; i += batchSize) {
          const batch = Array.from({ length: Math.min(batchSize, numSamples - i) }, () => generateWithRetry());
          const batchResults = await Promise.all(batch);
          urls.push(...batchResults.filter((u): u is string => !!u));
        }

        if (urls.length === 0) {
          throw new Error("Image generation failed after 3 attempts");
        }

        return {
          resultImageUrl: urls[0],
          resultImageUrls: urls,
          jewelryName: itemName,
          jewelryType: input.jewelryType || input.accessoryType || input.category,
          category: input.category,
        };
      }),
  }),

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
        return posts;
      }),

    // Create a new post
    create: publicProcedure
      .input(z.object({
        authorName: z.string().min(1).max(255),
        authorAvatar: z.string().optional(),
        content: z.string().min(1).max(2000),
        imageUrl: z.string().optional(),
        jewelryType: z.string().max(64).optional(),
      }))
      .mutation(async ({ input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new Error('DB not available');
        const { communityPosts } = await import('../drizzle/schema');
        const [result] = await dbInstance.insert(communityPosts).values({
          authorName: input.authorName,
          authorAvatar: input.authorAvatar || null,
          content: input.content,
          imageUrl: input.imageUrl || null,
          jewelryType: input.jewelryType || null,
          likesCount: 0,
          commentsCount: 0,
        });
        return { success: true, id: (result as any)?.insertId ?? null };
      }),

    // Toggle like on a post
    like: publicProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new Error('DB not available');
        const { communityPosts } = await import('../drizzle/schema');
        const { eq, sql } = await import('drizzle-orm');
        await dbInstance
          .update(communityPosts)
          .set({ likesCount: sql`${communityPosts.likesCount} + 1` })
          .where(eq(communityPosts.id, input.postId));
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

        return { success: true, id: insertedId };
      }),

    // List all applications (admin only, protected by secret code)
    list: publicProcedure
      .input(z.object({
        adminCode: z.string(),
      }))
      .query(async ({ input }) => {
        const ADMIN_CODE = process.env.ADMIN_CODE || 'ecrin2026admin';
        if (input.adminCode !== ADMIN_CODE) {
          throw new Error('Code admin invalide');
        }
        const dbInstance = await db.getDb();
        if (!dbInstance) return { applications: [] };
        const { partnerApplications } = await import('../drizzle/schema');
        const apps = await dbInstance
          .select()
          .from(partnerApplications)
          .orderBy(partnerApplications.createdAt);
        return { applications: apps };
      }),

    // Update application status (admin only)
    updateStatus: publicProcedure
      .input(z.object({
        adminCode: z.string(),
        id: z.number(),
        status: z.enum(['pending', 'approved', 'rejected']),
      }))
      .mutation(async ({ input }) => {
        const ADMIN_CODE = process.env.ADMIN_CODE || 'ecrin2026admin';
        if (input.adminCode !== ADMIN_CODE) {
          throw new Error('Code admin invalide');
        }
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new Error('DB non disponible');
        const { partnerApplications } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        await dbInstance
          .update(partnerApplications)
          .set({ status: input.status })
          .where(eq(partnerApplications.id, input.id));
        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;

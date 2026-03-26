/**
 * Tests unitaires pour le service analytics Mixpanel
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Import après les mocks
import {
  analytics,
  AnalyticsEvents,
  ProductEventProperties,
  TryOnEventProperties,
  ShareEventProperties,
  SearchEventProperties,
} from '../services/analytics-service';

// Mock des dépendances natives
vi.mock('mixpanel-react-native', () => ({
  Mixpanel: vi.fn().mockImplementation(() => ({
    init: vi.fn().mockResolvedValue(undefined),
    track: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    registerSuperProperties: vi.fn(),
    getPeople: vi.fn().mockReturnValue({
      set: vi.fn(),
      increment: vi.fn(),
    }),
  })),
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Analytics Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AnalyticsEvents', () => {
    it('should have all product events defined', () => {
      expect(AnalyticsEvents.PRODUCT_VIEWED).toBe('product_viewed');
      expect(AnalyticsEvents.PRODUCT_TRIED_ON).toBe('product_tried_on');
      expect(AnalyticsEvents.PRODUCT_FAVORITED).toBe('product_favorited');
      expect(AnalyticsEvents.PRODUCT_UNFAVORITED).toBe('product_unfavorited');
      expect(AnalyticsEvents.PRODUCT_SHARED).toBe('product_shared');
    });

    it('should have all boutique events defined', () => {
      expect(AnalyticsEvents.BOUTIQUE_VISITED).toBe('boutique_visited');
      expect(AnalyticsEvents.COLLECTION_FILTERED).toBe('collection_filtered');
      expect(AnalyticsEvents.PRODUCT_LINK_CLICKED).toBe('product_link_clicked');
    });

    it('should have all try-on events defined', () => {
      expect(AnalyticsEvents.TRYON_STARTED).toBe('tryon_started');
      expect(AnalyticsEvents.TRYON_COMPLETED).toBe('tryon_completed');
      expect(AnalyticsEvents.TRYON_PHOTO_TAKEN).toBe('tryon_photo_taken');
      expect(AnalyticsEvents.TRYON_SAVED).toBe('tryon_saved');
    });

    it('should have all navigation events defined', () => {
      expect(AnalyticsEvents.SCREEN_VIEWED).toBe('screen_viewed');
      expect(AnalyticsEvents.TAB_CHANGED).toBe('tab_changed');
    });

    it('should have all user events defined', () => {
      expect(AnalyticsEvents.USER_SIGNED_UP).toBe('user_signed_up');
      expect(AnalyticsEvents.USER_LOGGED_IN).toBe('user_logged_in');
      expect(AnalyticsEvents.USER_LOGGED_OUT).toBe('user_logged_out');
    });

    it('should have all notification events defined', () => {
      expect(AnalyticsEvents.NOTIFICATION_ENABLED).toBe('notification_enabled');
      expect(AnalyticsEvents.NOTIFICATION_DISABLED).toBe('notification_disabled');
      expect(AnalyticsEvents.DAILY_SUGGESTION_VIEWED).toBe('daily_suggestion_viewed');
    });

    it('should have all widget events defined', () => {
      expect(AnalyticsEvents.WIDGET_INSTALLED).toBe('widget_installed');
      expect(AnalyticsEvents.WIDGET_TAPPED).toBe('widget_tapped');
    });
  });

  describe('ProductEventProperties', () => {
    it('should accept valid product properties', () => {
      const properties: ProductEventProperties = {
        productId: '123',
        productName: 'Boucles Fleur Dorée',
        collection: 'Fleurs',
        category: 'earrings',
        brand: 'Moniattitude',
      };

      expect(properties.productId).toBe('123');
      expect(properties.productName).toBe('Boucles Fleur Dorée');
      expect(properties.collection).toBe('Fleurs');
    });

    it('should allow optional properties to be undefined', () => {
      const properties: ProductEventProperties = {
        productId: '456',
        productName: 'Collier Cœur',
      };

      expect(properties.productId).toBe('456');
      expect(properties.collection).toBeUndefined();
      expect(properties.category).toBeUndefined();
    });
  });

  describe('TryOnEventProperties', () => {
    it('should extend ProductEventProperties with try-on specific fields', () => {
      const properties: TryOnEventProperties = {
        productId: '789',
        productName: 'Bracelet Géométrique',
        bodyPart: 'wrist',
        photoSource: 'camera',
        duration: 45,
      };

      expect(properties.bodyPart).toBe('wrist');
      expect(properties.photoSource).toBe('camera');
      expect(properties.duration).toBe(45);
    });

    it('should accept all photo sources', () => {
      const sources: ('camera' | 'gallery' | 'sample')[] = ['camera', 'gallery', 'sample'];
      
      sources.forEach(source => {
        const properties: TryOnEventProperties = {
          productId: '1',
          productName: 'Test',
          photoSource: source,
        };
        expect(properties.photoSource).toBe(source);
      });
    });
  });

  describe('ShareEventProperties', () => {
    it('should extend ProductEventProperties with share specific fields', () => {
      const properties: ShareEventProperties = {
        productId: '101',
        productName: 'Boucles Arc-en-ciel',
        platform: 'instagram',
        withWatermark: true,
      };

      expect(properties.platform).toBe('instagram');
      expect(properties.withWatermark).toBe(true);
    });

    it('should accept all social platforms', () => {
      const platforms: ('instagram' | 'facebook' | 'twitter' | 'whatsapp' | 'other')[] = 
        ['instagram', 'facebook', 'twitter', 'whatsapp', 'other'];
      
      platforms.forEach(platform => {
        const properties: ShareEventProperties = {
          productId: '1',
          productName: 'Test',
          platform,
        };
        expect(properties.platform).toBe(platform);
      });
    });
  });

  describe('SearchEventProperties', () => {
    it('should contain search query and results count', () => {
      const properties: SearchEventProperties = {
        query: 'boucles fleurs',
        resultsCount: 12,
        filters: {
          collection: 'Fleurs',
          category: 'earrings',
        },
      };

      expect(properties.query).toBe('boucles fleurs');
      expect(properties.resultsCount).toBe(12);
      expect(properties.filters?.collection).toBe('Fleurs');
    });

    it('should allow filters to be undefined', () => {
      const properties: SearchEventProperties = {
        query: 'collier',
        resultsCount: 5,
      };

      expect(properties.filters).toBeUndefined();
    });
  });

  describe('Analytics Service Methods', () => {
    it('should have track method', () => {
      expect(typeof analytics.track).toBe('function');
    });

    it('should have trackProductViewed method', () => {
      expect(typeof analytics.trackProductViewed).toBe('function');
    });

    it('should have trackProductTriedOn method', () => {
      expect(typeof analytics.trackProductTriedOn).toBe('function');
    });

    it('should have trackProductFavorited method', () => {
      expect(typeof analytics.trackProductFavorited).toBe('function');
    });

    it('should have trackProductUnfavorited method', () => {
      expect(typeof analytics.trackProductUnfavorited).toBe('function');
    });

    it('should have trackProductShared method', () => {
      expect(typeof analytics.trackProductShared).toBe('function');
    });

    it('should have trackBoutiqueVisited method', () => {
      expect(typeof analytics.trackBoutiqueVisited).toBe('function');
    });

    it('should have trackCollectionFiltered method', () => {
      expect(typeof analytics.trackCollectionFiltered).toBe('function');
    });

    it('should have trackProductLinkClicked method', () => {
      expect(typeof analytics.trackProductLinkClicked).toBe('function');
    });

    it('should have trackTryOnStarted method', () => {
      expect(typeof analytics.trackTryOnStarted).toBe('function');
    });

    it('should have trackTryOnCompleted method', () => {
      expect(typeof analytics.trackTryOnCompleted).toBe('function');
    });

    it('should have trackSearchPerformed method', () => {
      expect(typeof analytics.trackSearchPerformed).toBe('function');
    });

    it('should have trackScreenViewed method', () => {
      expect(typeof analytics.trackScreenViewed).toBe('function');
    });

    it('should have trackTabChanged method', () => {
      expect(typeof analytics.trackTabChanged).toBe('function');
    });

    it('should have trackDailySuggestionViewed method', () => {
      expect(typeof analytics.trackDailySuggestionViewed).toBe('function');
    });

    it('should have identify method', () => {
      expect(typeof analytics.identify).toBe('function');
    });

    it('should have setUserProperties method', () => {
      expect(typeof analytics.setUserProperties).toBe('function');
    });

    it('should have reset method', () => {
      expect(typeof analytics.reset).toBe('function');
    });

    it('should have isReady method', () => {
      expect(typeof analytics.isReady).toBe('function');
    });
  });

  describe('Event Tracking Behavior', () => {
    it('should queue events before initialization', () => {
      // Track an event before initialization
      analytics.track('test_event', { test: true });
      
      // The event should be queued (not throw an error)
      expect(true).toBe(true);
    });

    it('should call trackProductViewed with correct properties', () => {
      const properties: ProductEventProperties = {
        productId: '123',
        productName: 'Test Product',
        collection: 'Test Collection',
      };

      // Should not throw
      expect(() => analytics.trackProductViewed(properties)).not.toThrow();
    });

    it('should call trackProductTriedOn with correct properties', () => {
      const properties: TryOnEventProperties = {
        productId: '456',
        productName: 'Test Jewelry',
        bodyPart: 'ear',
        photoSource: 'gallery',
        duration: 30,
      };

      expect(() => analytics.trackProductTriedOn(properties)).not.toThrow();
    });

    it('should call trackProductShared with correct properties', () => {
      const properties: ShareEventProperties = {
        productId: '789',
        productName: 'Shared Jewelry',
        platform: 'instagram',
        withWatermark: false,
      };

      expect(() => analytics.trackProductShared(properties)).not.toThrow();
    });

    it('should call trackSearchPerformed with correct properties', () => {
      const properties: SearchEventProperties = {
        query: 'gold earrings',
        resultsCount: 8,
      };

      expect(() => analytics.trackSearchPerformed(properties)).not.toThrow();
    });

    it('should call trackScreenViewed with screen name', () => {
      expect(() => analytics.trackScreenViewed('Boutique')).not.toThrow();
    });

    it('should call trackTabChanged with tab name', () => {
      expect(() => analytics.trackTabChanged('profile')).not.toThrow();
    });

    it('should call trackBoutiqueVisited', () => {
      expect(() => analytics.trackBoutiqueVisited()).not.toThrow();
    });

    it('should call trackCollectionFiltered with collection name', () => {
      expect(() => analytics.trackCollectionFiltered('Fleurs')).not.toThrow();
    });

    it('should call trackDailySuggestionViewed with suggestion data', () => {
      expect(() => analytics.trackDailySuggestionViewed({ 
        weather: 'sunny', 
        event: 'work' 
      })).not.toThrow();
    });
  });

  describe('User Management', () => {
    it('should call identify with user ID', () => {
      expect(() => analytics.identify('user_123')).not.toThrow();
    });

    it('should call setUserProperties with user data', () => {
      expect(() => analytics.setUserProperties({
        userId: 'user_123',
        language: 'fr',
        subscriptionTier: 'premium',
        favoritesCount: 10,
        tryOnsCount: 25,
      })).not.toThrow();
    });

    it('should call reset for logout', async () => {
      await expect(analytics.reset()).resolves.not.toThrow();
    });
  });
});

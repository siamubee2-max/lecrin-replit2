/**
 * Service d'analytics Mixpanel pour L'Écrin Virtuel
 * Suit les interactions des utilisateurs avec les produits
 */

import { Mixpanel } from 'mixpanel-react-native';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types pour les événements analytics
export interface ProductEventProperties {
  productId: string;
  productName: string;
  collection?: string;
  category?: string;
  brand?: string;
  [key: string]: unknown;
}

export interface TryOnEventProperties extends ProductEventProperties {
  bodyPart?: string;
  photoSource?: 'camera' | 'gallery' | 'sample';
  duration?: number; // en secondes
  [key: string]: unknown;
}

export interface ShareEventProperties extends ProductEventProperties {
  platform?: 'instagram' | 'facebook' | 'twitter' | 'whatsapp' | 'other';
  withWatermark?: boolean;
  [key: string]: unknown;
}

export interface SearchEventProperties {
  query: string;
  resultsCount: number;
  filters?: {
    collection?: string;
    category?: string;
  };
  [key: string]: unknown;
}

export interface UserProperties {
  userId?: string;
  language?: string;
  subscriptionTier?: 'free' | 'essential' | 'premium';
  favoritesCount?: number;
  tryOnsCount?: number;
}

// Noms des événements
export const AnalyticsEvents = {
  // Événements produits
  PRODUCT_VIEWED: 'product_viewed',
  PRODUCT_TRIED_ON: 'product_tried_on',
  PRODUCT_FAVORITED: 'product_favorited',
  PRODUCT_UNFAVORITED: 'product_unfavorited',
  PRODUCT_SHARED: 'product_shared',
  
  // Événements boutique
  BOUTIQUE_VISITED: 'boutique_visited',
  COLLECTION_FILTERED: 'collection_filtered',
  PRODUCT_LINK_CLICKED: 'product_link_clicked',
  
  // Événements essayage
  TRYON_STARTED: 'tryon_started',
  TRYON_COMPLETED: 'tryon_completed',
  TRYON_PHOTO_TAKEN: 'tryon_photo_taken',
  TRYON_SAVED: 'tryon_saved',
  
  // Événements recherche
  SEARCH_PERFORMED: 'search_performed',
  
  // Événements navigation
  SCREEN_VIEWED: 'screen_viewed',
  TAB_CHANGED: 'tab_changed',
  
  // Événements utilisateur
  USER_SIGNED_UP: 'user_signed_up',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  
  // Événements notifications
  NOTIFICATION_ENABLED: 'notification_enabled',
  NOTIFICATION_DISABLED: 'notification_disabled',
  DAILY_SUGGESTION_VIEWED: 'daily_suggestion_viewed',
  
  // Événements widget
  WIDGET_INSTALLED: 'widget_installed',
  WIDGET_TAPPED: 'widget_tapped',
} as const;

// Clé de stockage pour l'ID anonyme
const ANONYMOUS_ID_KEY = '@analytics_anonymous_id';

class AnalyticsService {
  private mixpanel: Mixpanel | null = null;
  private isInitialized = false;
  private anonymousId: string | null = null;
  private pendingEvents: { name: string; properties?: Record<string, unknown> }[] = [];

  /**
   * Initialise Mixpanel avec le token du projet
   */
  async initialize(token: string): Promise<void> {
    if (this.isInitialized) {
      console.log('[Analytics] Already initialized');
      return;
    }

    try {
      this.mixpanel = new Mixpanel(token, true);
      await this.mixpanel.init();
      
      // Configurer les super propriétés (envoyées avec chaque événement)
      this.mixpanel.registerSuperProperties({
        platform: Platform.OS,
        app_version: '1.0.0',
        app_name: 'Ecrin Virtuel',
      });

      // Récupérer ou créer l'ID anonyme
      await this.ensureAnonymousId();

      this.isInitialized = true;
      console.log('[Analytics] Mixpanel initialized successfully');

      // Envoyer les événements en attente
      await this.flushPendingEvents();
    } catch (error) {
      console.error('[Analytics] Failed to initialize Mixpanel:', error);
    }
  }

  /**
   * Assure qu'un ID anonyme existe pour le tracking
   */
  private async ensureAnonymousId(): Promise<void> {
    try {
      let storedId = await AsyncStorage.getItem(ANONYMOUS_ID_KEY);
      
      if (!storedId) {
        storedId = this.generateAnonymousId();
        await AsyncStorage.setItem(ANONYMOUS_ID_KEY, storedId);
      }
      
      this.anonymousId = storedId;
      
      if (this.mixpanel) {
        this.mixpanel.identify(storedId);
      }
    } catch (error) {
      console.error('[Analytics] Failed to ensure anonymous ID:', error);
      this.anonymousId = this.generateAnonymousId();
    }
  }

  /**
   * Génère un ID anonyme unique
   */
  private generateAnonymousId(): string {
    return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Envoie les événements en attente après l'initialisation
   */
  private async flushPendingEvents(): Promise<void> {
    if (!this.isInitialized || !this.mixpanel) return;

    for (const event of this.pendingEvents) {
      this.mixpanel.track(event.name, event.properties);
    }
    
    this.pendingEvents = [];
  }

  /**
   * Enregistre un événement
   */
  track(eventName: string, properties?: Record<string, unknown>): void {
    const eventProperties = {
      ...properties,
      timestamp: new Date().toISOString(),
    };

    if (!this.isInitialized || !this.mixpanel) {
      // Stocker l'événement pour l'envoyer plus tard
      this.pendingEvents.push({ name: eventName, properties: eventProperties });
      console.log('[Analytics] Event queued:', eventName);
      return;
    }

    this.mixpanel.track(eventName, eventProperties);
    console.log('[Analytics] Event tracked:', eventName, eventProperties);
  }

  /**
   * Identifie un utilisateur connecté
   */
  identify(userId: string): void {
    if (!this.mixpanel) return;
    
    this.mixpanel.identify(userId);
    console.log('[Analytics] User identified:', userId);
  }

  /**
   * Met à jour les propriétés de l'utilisateur
   */
  setUserProperties(properties: UserProperties): void {
    if (!this.mixpanel) return;
    
    this.mixpanel.getPeople().set(properties);
    console.log('[Analytics] User properties set:', properties);
  }

  /**
   * Incrémente une propriété utilisateur
   */
  incrementUserProperty(property: string, value: number = 1): void {
    if (!this.mixpanel) return;
    
    this.mixpanel.getPeople().increment(property, value);
  }

  /**
   * Réinitialise l'identité (déconnexion)
   */
  async reset(): Promise<void> {
    if (!this.mixpanel) return;
    
    this.mixpanel.reset();
    await this.ensureAnonymousId();
    console.log('[Analytics] User reset');
  }

  // ===== Méthodes de tracking spécifiques =====

  /**
   * Track la vue d'un produit
   */
  trackProductViewed(properties: ProductEventProperties): void {
    this.track(AnalyticsEvents.PRODUCT_VIEWED, properties);
  }

  /**
   * Track un essayage virtuel
   */
  trackProductTriedOn(properties: TryOnEventProperties): void {
    this.track(AnalyticsEvents.PRODUCT_TRIED_ON, properties);
    this.incrementUserProperty('total_tryons');
  }

  /**
   * Track l'ajout aux favoris
   */
  trackProductFavorited(properties: ProductEventProperties): void {
    this.track(AnalyticsEvents.PRODUCT_FAVORITED, properties);
    this.incrementUserProperty('total_favorites');
  }

  /**
   * Track le retrait des favoris
   */
  trackProductUnfavorited(properties: ProductEventProperties): void {
    this.track(AnalyticsEvents.PRODUCT_UNFAVORITED, properties);
    this.incrementUserProperty('total_favorites', -1);
  }

  /**
   * Track le partage d'un produit
   */
  trackProductShared(properties: ShareEventProperties): void {
    this.track(AnalyticsEvents.PRODUCT_SHARED, properties);
    this.incrementUserProperty('total_shares');
  }

  /**
   * Track la visite de la boutique
   */
  trackBoutiqueVisited(): void {
    this.track(AnalyticsEvents.BOUTIQUE_VISITED);
  }

  /**
   * Track le filtrage par collection
   */
  trackCollectionFiltered(collection: string): void {
    this.track(AnalyticsEvents.COLLECTION_FILTERED, { collection });
  }

  /**
   * Track le clic sur un lien produit (vers moniattitude.com)
   */
  trackProductLinkClicked(properties: ProductEventProperties): void {
    this.track(AnalyticsEvents.PRODUCT_LINK_CLICKED, properties);
  }

  /**
   * Track le début d'un essayage
   */
  trackTryOnStarted(properties: ProductEventProperties): void {
    this.track(AnalyticsEvents.TRYON_STARTED, properties);
  }

  /**
   * Track la fin d'un essayage
   */
  trackTryOnCompleted(properties: TryOnEventProperties): void {
    this.track(AnalyticsEvents.TRYON_COMPLETED, properties);
  }

  /**
   * Track une recherche
   */
  trackSearchPerformed(properties: SearchEventProperties): void {
    this.track(AnalyticsEvents.SEARCH_PERFORMED, properties);
  }

  /**
   * Track la vue d'un écran
   */
  trackScreenViewed(screenName: string, properties?: Record<string, unknown>): void {
    this.track(AnalyticsEvents.SCREEN_VIEWED, { screen_name: screenName, ...properties });
  }

  /**
   * Track le changement d'onglet
   */
  trackTabChanged(tabName: string): void {
    this.track(AnalyticsEvents.TAB_CHANGED, { tab_name: tabName });
  }

  /**
   * Track la vue d'une suggestion quotidienne
   */
  trackDailySuggestionViewed(suggestion: { weather?: string; event?: string }): void {
    this.track(AnalyticsEvents.DAILY_SUGGESTION_VIEWED, suggestion);
  }

  /**
   * Vérifie si le service est initialisé
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export d'une instance singleton
export const analytics = new AnalyticsService();

// Export par défaut
export default analytics;

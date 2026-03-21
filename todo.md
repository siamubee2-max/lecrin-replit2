# Écrin Virtuel - Conformité App Store

## Phase 1 : Structure et Navigation iOS
- [x] Restructurer la navigation avec onglets principaux (Accueil, Essayer, Mon Écrin, Boutique, Plus)
- [x] Créer l'écran d'accueil avec hero section
- [x] Implémenter le menu hamburger avec paramètres
- [x] Ajouter le sélecteur de langue (FR, EN, ES, DE, IT, PT)

## Phase 2 : Système d'Abonnement StoreKit 2
- [x] Créer l'écran de sélection d'abonnement
- [x] Implémenter les 3 plans (9,99€, 12,99€, 100€/an)
- [x] Ajouter le bouton de restauration des achats
- [ ] Configurer expo-iap pour StoreKit 2 (après publication)
- [ ] Gérer les statuts d'abonnement localement

## Phase 3 : Essayages Virtuels avec Modèles
- [x] Créer la base de modèles de démonstration (4 modèles)
- [x] Implémenter l'écran de sélection de modèle
- [x] Développer l'écran d'essayage (choix pièce + type)
- [x] Créer la superposition bijou sur modèle
- [x] Ajouter la sauvegarde des essayages

## Phase 4 : Mon Écrin - Catalogue Personnel
- [x] Créer l'écran "Mon Écrin"
- [x] Implémenter les filtres (type, métal, pierres, marques)
- [x] Ajouter la recherche
- [x] Créer la fonctionnalité d'ajout de bijou
- [x] Implémenter l'upload de photos

## Phase 5 : Créateurs Partenaires
- [x] Créer l'écran "Boutique Style"
- [x] Intégrer Moniattitude.com
- [x] Ajouter le bouton d'invitation créateurs
- [x] Configurer l'email (inferencevision@inferencevision.store)

## Phase 6 : Conformité App Store
- [x] Créer la page Politique de Confidentialité
- [x] Créer la page Conditions d'Utilisation
- [x] Ajouter le mode démo gratuit
- [ ] Vérifier toutes les permissions iOS
- [ ] Préparer les métadonnées App Store
- [ ] Créer les captures d'écran requises

## Complété
- [x] Logo et branding
- [x] Thème bleu marine / doré
- [x] Partage réseaux sociaux
- [x] Configuration EAS Build
- [x] 5 onglets de navigation
- [x] Pages légales (Privacy + Terms)
- [x] Multi-langue (6 langues)
- [x] Système d'abonnement UI

## Page Profil Utilisateur
- [x] Créer l'écran de profil utilisateur
- [x] Ajouter la section des essayages favoris
- [x] Implémenter la sauvegarde des favoris (AsyncStorage)
- [x] Ajouter les statistiques d'utilisation
- [x] Intégrer la navigation vers le profil

## Authentification Apple/Google
- [x] Lire la documentation du backend pour l'authentification
- [x] Configurer l'authentification Apple Sign In (via Manus OAuth)
- [x] Configurer l'authentification Google Sign In (via Manus OAuth)
- [x] Créer l'écran de connexion
- [x] Intégrer le flux OAuth dans l'app
- [x] Synchroniser les favoris avec le serveur (API tRPC)
- [x] Mettre à jour le profil avec les infos utilisateur


## Intégration des Modèles de Corps (body_parts)
- [x] Ajouter la table body_parts au schéma de base de données
- [x] Importer les 9 modèles de parties du corps (seed automatique)
- [x] Créer une route API pour récupérer les modèles (bodyParts.list, bodyParts.byType)
- [x] Mettre à jour l'écran d'essayage pour afficher les vrais modèles
- [x] Mapper les types de bijoux aux parties du corps correspondantes

## Import des Partenariats de Marques
- [x] Mettre à jour le schéma creators avec les nouveaux champs (commission, tier, contract dates, contact email)
- [x] Importer les données Moniattitude depuis le CSV (seed automatique)
- [x] Mettre à jour l'écran Boutique pour afficher les informations complètes

## Écran Garde-Robe (Wardrobe)
- [x] Mettre à jour le schéma bodyParts avec tous les types (face, neck, bust_with_hands, left_ear_profile, right_ear_profile, left_wrist, right_wrist, left_hand, right_hand, left_ankle, right_ankle, full_body)
- [x] Ajouter les routes API pour créer/supprimer des body parts utilisateur
- [x] Créer l'écran Garde-Robe avec liste des photos
- [x] Implémenter l'upload de photos avec sélection de type
- [x] Intégrer avec le système d'abonnement (limite pour utilisateurs gratuits)

## Deep Linking et ASO
- [x] Configurer expo-linking pour les deep links
- [x] Créer une page web de redirection avec métadonnées Open Graph
- [x] Configurer les Universal Links (iOS) et App Links (Android)
- [x] Préparer les métadonnées App Store (titre, sous-titre, mots-clés, description)
- [x] Créer le fichier de configuration ASO avec les textes optimisés

## Captures d'écran App Store
- [x] Générer capture iPhone 1 - Écran d'accueil (1290x2796)
- [x] Générer capture iPhone 2 - Essayage virtuel (1290x2796)
- [x] Générer capture iPhone 3 - Mon Écrin (1290x2796)
- [x] Générer capture iPhone 4 - Boutique créateurs (1290x2796)
- [x] Générer capture iPhone 5 - Abonnements (1290x2796)
- [x] Générer capture iPad 1 - Écran d'accueil (2048x2732)
- [x] Générer capture iPad 2 - Essayage virtuel (2048x2732)
- [x] Générer capture iPad 3 - Mon Écrin (2048x2732)
- [x] Générer capture iPad 4 - Boutique créateurs (2048x2732)
- [x] Générer capture iPad 5 - Abonnements (2048x2732)

## Analyse Concurrentielle des Prix
- [x] Rechercher les applications d'essayage virtuel de bijoux concurrentes
- [x] Analyser leurs modèles tarifaires (freemium, abonnement, achat unique)
- [x] Comparer les fonctionnalités par niveau de prix
- [x] Formuler des recommandations tarifaires pour L'Écrin Virtuel

## Mise à jour des Tarifs
- [x] Ajouter le plan Découverte gratuit (3 essayages/mois)
- [x] Mettre à jour Essentiel de 9,99€ à 14,99€/mois
- [x] Mettre à jour Premium de 12,99€ à 24,99€/mois
- [x] Mettre à jour Annuel de 100€ à 199€/an
- [x] Mettre à jour les identifiants StoreKit correspondants

## Amélioration du Composant de Partage
- [x] Ajouter le partage natif iOS/Android
- [x] Ajouter la copie du lien avec feedback visuel
- [x] Ajouter Twitter/X
- [x] Ajouter Facebook
- [x] Ajouter Pinterest (nouveau)
- [x] Ajouter Email
- [x] Ajouter Instagram avec copie du texte
- [x] Ajouter WhatsApp
- [x] Installer expo-clipboard

## Capture d'Écran de l'Essayage
- [x] Installer react-native-view-shot
- [x] Créer un hook useScreenshot réutilisable
- [x] Intégrer la capture dans l'écran d'essayage (ViewShot)
- [x] Connecter la capture au partage natif
- [x] Ajouter la sauvegarde dans la galerie (album "Écrin Virtuel")

## Filtres et Retouche Photo
- [x] Créer le composant PhotoEditor avec preview en temps réel
- [x] Ajouter des filtres prédéfinis (Original, Glamour, Vintage, N&B, Doré, Froid, Rose, Dramatique)
- [x] Implémenter les sliders de retouche (luminosité, contraste, saturation, chaleur)
- [x] Ajouter un slider de vignette pour effet professionnel
- [x] Intégrer l'éditeur dans le flux de capture après la prise de photo
- [x] Ajouter boutons Annuler/Appliquer avec preview avant/après
- [x] Créer des tests unitaires pour les filtres (48 tests)

## Recadrage et Rotation d'Image
- [x] Créer le composant ImageCropper avec gestes tactiles (pinch-to-zoom, pan)
- [x] Implémenter le recadrage avec ratios prédéfinis (Libre, 1:1, 4:3, 3:4, 16:9, 9:16)
- [x] Ajouter les contrôles de rotation (-90°, +90°)
- [x] Implémenter le retournement horizontal/vertical
- [x] Intégrer comme étape préalable aux filtres dans le flux d'édition
- [x] Ajouter la prévisualisation en temps réel avec grille de recadrage
- [x] Créer des tests unitaires pour le recadrage (54 tests)


## Images PNG de Bijoux Professionnels
- [x] Générer des images PNG de colliers avec fond transparent
- [x] Générer des images PNG de boucles d'oreilles avec fond transparent
- [x] Générer des images PNG de bagues avec fond transparent
- [x] Générer des images PNG de bracelets avec fond transparent
- [x] Générer des images PNG de chevillières avec fond transparent
- [x] Intégrer les images dans le composant d'essayage virtuel
- [x] Ajouter le positionnement dynamique selon le type de bijou
- [x] Créer des tests unitaires pour les overlays de bijoux (44 tests)


## Styles de Bijoux (Or, Argent, Or Rose)
- [x] Générer des images de colliers en or, argent et or rose
- [x] Générer des images de boucles d'oreilles en or, argent et or rose
- [x] Générer des images de bagues en or, argent et or rose
- [x] Générer des images de bracelets en or, argent et or rose
- [x] Générer des images de chevillières en or, argent et or rose
- [x] Créer le sélecteur de style dans l'interface d'essayage
- [x] Intégrer les styles dans le flux d'essayage virtuel (étapes 1, 2 et 3)
- [x] Créer des tests unitaires pour les styles de bijoux (28 tests)


## Détection IA pour Positionnement Intelligent des Bijoux
- [x] Rechercher et configurer une solution de détection faciale/corporelle (LLM Vision)
- [x] Créer le service de détection des points clés (landmarks) du visage
- [x] Détecter les oreilles pour les boucles d'oreilles
- [x] Détecter le cou/décolleté pour les colliers
- [x] Détecter les poignets pour les bracelets
- [x] Détecter les doigts pour les bagues
- [x] Calculer l'inclinaison de la tête pour adapter l'angle du bijou
- [x] Calculer la proportion/échelle selon la distance du sujet
- [x] Implémenter le positionnement automatique intelligent
- [x] Intégrer dans le flux d'essayage virtuel (toggle IA/Manuel)
- [x] Créer des tests unitaires pour la détection IA (34 tests)


## Mon Dressing - Gestion des Vêtements
- [x] Créer le schéma de base de données pour les vêtements (wardrobe_items)
- [x] Ajouter les champs : nom, catégorie, marque, couleur, prix, image
- [x] Créer les routes API CRUD pour les vêtements
- [x] Créer l'écran Mon Dressing avec header et description
- [x] Implémenter la barre de recherche
- [x] Ajouter les filtres (catégories, marques, couleurs, prix min/max)
- [x] Créer la grille d'affichage des vêtements
- [x] Implémenter le modal d'ajout de vêtement
- [x] Ajouter l'upload de photo pour les vêtements (galerie + caméra)
- [x] Afficher l'état vide avec icône et message

## AI Stylist - Création de Looks
- [x] Créer le service AI Stylist avec LLM
- [x] Analyser les vêtements et bijoux de l'utilisateur
- [x] Générer des suggestions de looks (vêtement + bijou)
- [x] Créer l'écran AI Stylist avec suggestions visuelles
- [x] Ajouter la possibilité de sauvegarder les looks
- [x] Créer des tests unitaires pour Mon Dressing et AI Stylist (40 tests)

## Mes Looks - Galerie des Looks Sauvegardés
- [x] Créer l'écran Mes Looks avec liste des looks sauvegardés
- [x] Afficher les miniatures des vêtements et bijoux de chaque look
- [x] Ajouter les filtres par occasion (Casual, Travail, Soirée, Sport, Fête)
- [x] Ajouter les filtres par saison (Printemps, Été, Automne, Hiver)
- [x] Implémenter le tri (date, nom, favoris)
- [x] Ajouter la fonctionnalité favoris avec toggle
- [x] Créer le modal de détails du look avec conseils de style
- [x] Implémenter la suppression de looks
- [x] Ajouter la navigation depuis AI Stylist (bouton dans header)
- [x] Créer des tests unitaires pour Mes Looks (38 tests)

## Partage de Looks sur Réseaux Sociaux
- [x] Créer le composant LookShareCard pour générer une image composite
- [x] Afficher les miniatures des vêtements et bijoux dans la carte (max 6 pièces)
- [x] Ajouter le nom du look et les conseils de style
- [x] Intégrer le branding L'Écrin Virtuel dans l'image (header + footer)
- [x] Utiliser ViewShot pour capturer l'image composite
- [x] Intégrer le modal de partage existant (ShareModal)
- [x] Ajouter le bouton de partage dans le modal de détails du look
- [x] Permettre le partage sur Instagram, WhatsApp, Twitter, Facebook, Pinterest
- [x] Créer des tests unitaires pour le partage de looks (41 tests)


## Boutique Partenaires - Bijoux de Marques
- [x] Créer le schéma de données pour les marques partenaires (partnerBrands)
- [x] Créer le schéma pour les bijoux partenaires (partnerJewelry) avec prix, tags, lien externe
- [x] Ajouter les données de démonstration pour Moni'attitude (bijoux en résine)
- [x] Créer l'écran Boutique avec header "Boutique Style Sélectionné"
- [x] Afficher la section "Partenaires Vedettes" avec carte marque et badge premium
- [x] Créer la grille de bijoux avec images, noms, marque, tags et prix
- [x] Ajouter les filtres (type, métal, gemmes, marque, collection, prix)
- [x] Implémenter la barre de recherche
- [x] Créer le modal de détail du bijou avec bouton "Visiter la Marque" (lien externe)
- [x] Ajouter le bouton "Essayer virtuellement" pour lancer l'essayage avec le bijou
- [x] Intégrer les favoris (cœur) sur les cartes de bijoux
- [x] Créer des tests unitaires pour la Boutique Partenaires (50 tests)


## Filigrane sur les Captures d'Écran
- [x] Créer le composant Watermark avec le logo L'Écrin Virtuel
- [x] Positionner le filigrane de manière discrète (5 positions disponibles)
- [x] Ajouter une légère opacité configurable (0-1)
- [x] Intégrer le filigrane dans les captures d'écran d'essayage virtuel
- [x] Intégrer le filigrane dans les cartes de partage de looks
- [x] Permettre de personnaliser la position, l'opacité et le thème (light/dark)
- [x] Créer des tests unitaires pour le filigrane (47 tests)


## Internationalisation (i18n) - Anglais et Espagnol
- [x] Créer le système d'internationalisation avec contexte React (I18nProvider)
- [x] Créer le fichier de traduction français (fr.ts) - langue par défaut
- [x] Créer le fichier de traduction anglais (en.ts)
- [x] Créer le fichier de traduction espagnol (es.ts)
- [x] Traduire les textes de l'écran d'accueil
- [x] Traduire les textes de l'écran d'essayage virtuel
- [x] Traduire les textes de Mon Écrin et Mon Dressing
- [x] Traduire les textes de la Boutique Partenaires
- [x] Traduire les textes de l'AI Stylist et Mes Looks
- [x] Traduire les textes du filigrane et des captures d'écran
- [x] Créer le composant LanguageSelector dans les paramètres
- [x] Persister le choix de langue avec AsyncStorage
- [x] Créer des tests unitaires pour l'internationalisation (42 tests)


## Langues Supplémentaires (DE, IT, PT)
- [ ] Créer le fichier de traduction allemand (de.ts)
- [ ] Créer le fichier de traduction italien (it.ts)
- [ ] Créer le fichier de traduction portugais (pt.ts)
- [ ] Mettre à jour le fichier index.ts pour exporter les nouvelles langues
- [ ] Ajouter les drapeaux allemand, italien et portugais au sélecteur
- [ ] Mettre à jour le contexte I18n pour supporter les nouvelles langues
- [ ] Créer des tests unitaires pour les nouvelles traductions

## Traductions Allemand, Italien, Portugais
- [x] Créer le fichier de traduction allemand (de.ts)
- [x] Créer le fichier de traduction italien (it.ts)
- [x] Créer le fichier de traduction portugais (pt.ts)
- [x] Mettre à jour le fichier index.ts pour inclure les nouvelles langues
- [x] Mettre à jour la section languages dans tous les fichiers de traduction
- [x] Exécuter les tests pour valider les traductions (619 tests passent)

## Notifications Push - Suggestions de Looks Quotidiennes
- [x] Lire la documentation backend pour les notifications push
- [x] Configurer expo-notifications pour les permissions et tokens
- [x] Créer le service météo (weather-service.ts)
- [x] Créer le service calendrier (calendar-service.ts)
- [x] Créer le service de génération de suggestions de looks (daily-look-suggestion-service.ts)
- [x] Créer le service de notifications (notification-service.ts)
- [x] Implémenter l'écran de paramètres des notifications (app/notifications.tsx)
- [x] Ajouter les traductions pour les notifications dans les 6 langues
- [x] Créer les tests unitaires pour les services de notifications (68 tests)

## Intégration API Météo Réelle (Open-Meteo)
- [x] Rechercher la documentation de l'API Open-Meteo
- [x] Mettre à jour weather-service.ts avec les appels API réels
- [x] Mapper les codes météo Open-Meteo vers nos conditions (WMO codes)
- [x] Ajouter expo-location pour la géolocalisation
- [x] Implémenter la demande de permission de localisation
- [x] Ajouter un fallback vers Paris si la localisation est refusée
- [x] Mettre à jour l'écran de notifications pour afficher la ville
- [x] Ajouter les traductions pour la localisation (6 langues)
- [x] Créer des tests unitaires pour l'API météo (688 tests passent)

## Widgets iOS et Android - Suggestion du Jour
- [x] Rechercher et configurer @bittingz/expo-widgets
- [x] Créer le service de données partagées pour les widgets (widget-data-service.ts)
- [x] Développer le widget iOS avec WidgetKit (widgets/ios/EcrinWidget.swift)
- [x] Développer le widget Android avec AppWidget (widgets/android/)
- [x] Configurer les 3 tailles de widgets (small, medium, large)
- [x] Afficher la météo, l'événement et les bijoux recommandés
- [x] Créer les tests unitaires pour le service de widgets (33 tests)
- [x] Configurer app.config.ts avec le plugin @bittingz/expo-widgets
- [x] Total: 721 tests passent
- [ ] Implémenter la mise à jour automatique des widgets
- [ ] Ajouter les traductions pour les widgets
- [ ] Créer des tests unitaires pour le service de widgets

## Enrichissement du Profil Utilisateur
- [x] Analyser l'écran de profil existant
- [x] Créer le système d'onglets pour le profil (4 onglets)
- [x] Développer l'onglet "Préférences de Style" (StylePreferencesTab.tsx)
- [x] Développer l'onglet "Historique d'essayage" (TryOnHistoryTab.tsx)
- [x] Développer l'onglet "Ma Liste d'envies" (WishlistTab.tsx)
- [x] Persister les préférences avec AsyncStorage
- [x] Ajouter les traductions pour les nouveaux onglets (6 langues)
- [x] Créer des tests unitaires pour les nouveaux composants (32 tests - 753 total)

## Vérification Conformité iOS/Android
- [x] Vérifier les formats d'images (PNG, dimensions, transparence)
- [x] Vérifier les icônes d'application (toutes tailles requises)
- [x] Vérifier les images splash screen
- [x] Vérifier les captures d'écran App Store
- [x] Vérifier les prix d'abonnement (Découverte, Essentiel, Premium, Annuel) - CONFORME
- [x] Vérifier les identifiants StoreKit - CONFORME
- [x] Corriger l'icône d'application (1024x1024)
- [x] Régénérer captures iPhone (1290x2796) avec nouvelles fonctionnalités
  - [x] Capture 1: Écran d'accueil avec hero section
  - [x] Capture 2: Essayage virtuel avec IA
  - [x] Capture 3: Profil enrichi avec onglets
  - [x] Capture 4: Notifications et suggestions quotidiennes
  - [x] Capture 5: Boutique partenaires
- [x] Régénérer captures iPad (2048x2732) avec nouvelles fonctionnalités
  - [x] Capture 1: Écran d'accueil
  - [x] Capture 2: Essayage virtuel
  - [x] Capture 3: Mon Écrin
  - [x] Capture 4: Boutique
  - [x] Capture 5: Abonnements

## Partenariat Moniattitude - Suppression Grandes Marques
- [x] Supprimer toutes les références aux grandes marques (Cartier, Bvlgari, Tiffany, etc.)
- [x] Supprimer les prix des bijoux dans la boutique (affiche "Voir sur moniattitude.com")
- [x] Mettre à jour la boutique avec Moniattitude comme partenaire exclusif
- [x] Ajouter un lien vers moniattitude.com pour les commandes
- [x] Régénérer les captures d'écran boutique sans marques ni prix
- [x] Mettre à jour les tests unitaires (749 tests passent)

## Intégration Vrais Produits Moni'attitude
- [x] Visiter moniattitude.com et collecter les informations produits
- [x] Récupérer les noms, descriptions et images des bijoux (~140 produits identifiés)
- [x] Identifier les collections disponibles (Fleurs, Cœurs, Géométrique, Résine, Feuilles)
- [x] Mettre à jour la boutique avec 12 vrais produits Moni'attitude
- [x] Mettre à jour les informations de la marque (Belgique, slogan, description)
- [x] Tester l'affichage des produits (749 tests passent)

## Intégration Vraies Photos Moni'attitude
- [x] Télécharger les images des produits depuis moniattitude.com (7 images)
- [x] Sauvegarder les images dans assets/products/moniattitude/
- [x] Mettre à jour boutique.tsx avec les vraies images (require() local)
- [x] Tester l'affichage des images (749 tests passent)

## Compléter Collection Photos Moni'attitude
- [ ] Télécharger l'image fleur duo depuis moniattitude.com
- [ ] Télécharger l'image lotus depuis moniattitude.com
- [ ] Télécharger l'image artisanales depuis moniattitude.com
- [ ] Télécharger l'image texturées depuis moniattitude.com
- [ ] Télécharger l'image résine orange depuis moniattitude.com
- [ ] Télécharger l'image feuille métalisée depuis moniattitude.com
- [ ] Mettre à jour boutique.tsx avec les nouvelles images
- [ ] Tester l'affichage des images

## Intégration Mixpanel Analytics
- [x] Installer mixpanel-react-native
- [x] Créer le service d'analytics (analytics-service.ts)
- [x] Définir les événements produits à tracker
  - [x] product_viewed (vue d'un produit)
  - [x] product_tried_on (essayage virtuel)
  - [x] product_favorited (ajout aux favoris)
  - [x] product_shared (partage)
  - [x] boutique_visited (visite boutique)
  - [x] collection_filtered (filtre par collection)
- [x] Intégrer le tracking dans boutique.tsx
- [x] Intégrer le tracking dans l'essayage virtuel (handleTryOn)
- [x] Intégrer le tracking dans les favoris (toggleFavorite)
- [x] Créer les tests unitaires (47 tests - 796 tests au total)
- [ ] Configurer la clé API Mixpanel (EXPO_PUBLIC_MIXPANEL_TOKEN)

## Audit Inclusivité et Simplicité
- [x] Vérifier les textes pour la neutralité de genre - CONFORME (aucun terme genré)
- [x] Vérifier les images pour l'inclusivité - CONFORME (bijoux neutres)
- [x] Simplifier l'interface si nécessaire - Déjà simple et épurée
- [x] Vérifier l'élégance du design - CONFORME (bleu marine + or)
- [x] S'assurer que l'app est fonctionnelle et facile à utiliser - CONFORME
- [x] Rapport d'audit créé (docs/inclusivity-audit.md)

## Galerie de Démonstration Inclusive
- [ ] Générer des images de démonstration avec morphologies variées
  - [ ] Mains diverses (différentes carnations, tailles)
  - [ ] Oreilles diverses (différentes carnations)
  - [ ] Cous divers (différentes carnations)
- [ ] Créer l'écran de galerie de démonstration
- [ ] Intégrer la galerie dans l'écran d'accueil ou essayage
- [ ] Ajouter les traductions pour la galerie (6 langues)
- [ ] Tester l'affichage des images

## Galerie de Démonstration Inclusive
- [x] Créer l'écran demo-gallery.tsx avec filtres par catégorie
- [x] Générer 8 images de démonstration (mains, oreilles, cous avec différentes carnations)
- [x] Ajouter les traductions dans les 6 langues (FR, EN, ES, DE, IT, PT)
- [x] Intégrer le message d'inclusivité (pour tous les genres et morphologies)
- [x] Ajouter un lien vers la galerie depuis l'écran d'accueil
- [x] Créer les tests unitaires (25 tests)

## Amélioration Inclusivité - Hommes et Non Genrés
- [x] Générer des images de mains masculines avec bijoux (3 carnations)
- [x] Générer des images d'oreilles masculines avec boucles d'oreilles (3 carnations)
- [x] Générer des images de cous masculins avec colliers (2 carnations)
- [x] Générer des images de mains non genrées/androgynes avec bijoux (2 carnations)
- [x] Générer des images d'oreilles non genrées/androgynes (2 carnations)
- [x] Mettre à jour l'écran demo-gallery.tsx avec les nouvelles images
- [x] Ajouter un filtre par genre (Tous, Féminin, Masculin, Non genré)

## Nouveau Thème Beige/Crème Luxueux
- [x] Mettre à jour theme.config.js avec les nouvelles couleurs beige/crème
- [x] Fond principal : Beige crème (#F5F0E8)
- [x] Surface/cartes : Beige clair (#FAF7F2)
- [x] Bordures : Beige doré subtil (#E8DFD0)
- [x] Conserver le bleu marine (#0A1A3B) et l'or (#D4AF37)
- [x] Vérifier le contraste et l'accessibilité

## Bouton de Partage pour Essayages Virtuels
- [x] Analyser le composant d'essayage existant (try-on.tsx)
- [x] Vérifier le composant ShareModal existant
- [x] Intégrer le bouton de partage dans l'écran d'essayage
- [x] Connecter la capture d'écran au partage
- [x] Tester le partage sur tous les réseaux sociaux

## Photos d'Exemple par Catégorie
- [x] Générer photo exemple collier (produit seul)
- [x] Générer photo exemple boucles d'oreilles (produit seul)
- [x] Générer photo exemple bague (produit seul)
- [x] Générer photo exemple bracelet (produit seul)
- [x] Générer photo exemple chevillière (produit seul)
- [x] Générer photo exemple haut (chemise/blouse)
- [x] Générer photo exemple bas (pantalon)
- [x] Générer photo exemple robe
- [x] Générer photo exemple veste/manteau
- [x] Générer photo exemple chaussures
- [x] Intégrer les images dans l'écran Mon Écrin (bijoux)
- [x] Intégrer les images dans l'écran Mon Dressing (vêtements)

## Corrections Urgentes - Thème et Démo
- [x] Vérifier et corriger le thème beige/crème (couleurs appliquées dans theme.config.js)
- [x] Ajouter des bijoux de démonstration pré-chargés visibles dans Mon Écrin (5 bijoux avec images)
- [x] Ajouter des vêtements et chaussures de démonstration dans Mon Dressing (5 articles avec images)
- [x] Rendre fonctionnel le bouton "Ajouter un bijou" (modal complet avec formulaire)
- [x] Tester l'affichage des articles de démo

## Import Photo pour Ajout de Bijou
- [x] Intégrer expo-image-picker dans le modal d'ajout de bijou
- [x] Ajouter bouton pour prendre une photo avec l'appareil
- [x] Ajouter bouton pour importer depuis la galerie
- [x] Afficher l'aperçu de l'image sélectionnée
- [x] Sauvegarder l'image avec le bijou créé
- [x] Afficher l'image dans la carte du bijou

## Corrections UI - Cadrage et Photo
- [x] Corriger le header modal qui chevauche la barre d'état iOS
- [x] Ajouter SafeAreaView au modal d'ajustement d'image
- [x] Regénérer la photo du collier avec un fond beige propre
- [x] Remplacer l'image dans les assets

## Améliorations UX - Thème, Prix et Essayage Démo
- [ ] Diagnostiquer pourquoi le thème beige/crème n'est pas appliqué visuellement
- [ ] Corriger l'application du thème dans tous les écrans
- [ ] Supprimer l'affichage des prix dans les bijoux de démo
- [ ] Supprimer l'affichage des prix dans les vêtements de démo
- [ ] Permettre de sélectionner un article de démo pour l'essayer
- [ ] Intégrer l'essayage sur photos de parties du corps
- [ ] Intégrer l'essayage sur mannequin
- [ ] Intégrer l'essayage sur photo prise par l'utilisateur

## Améliorations UX - Thème, Prix et Essayage Démo
- [x] Diagnostiquer pourquoi le thème beige/crème n'est pas appliqué (thème configuré dans theme.config.js)
- [x] Supprimer l'affichage des prix dans les bijoux de démo (remplacé par badge "Démo")
- [x] Supprimer l'affichage des prix dans les vêtements de démo (remplacé par badge "Démo")
- [x] Permettre l'essayage des bijoux de démo sur les photos
- [x] Permettre l'essayage des bijoux de démo sur les mannequins
- [x] Permettre l'essayage des bijoux de démo sur sa propre photo
- [x] Ajouter un bouton "Essayer" sur chaque article de démo

## BUGS CRITIQUES À CORRIGER
- [x] Thème beige/crème non appliqué - forcé le mode light par défaut
- [x] Bouton de capture photo ne fonctionne pas - ajouté expo-image-picker avec permissions
- [x] Bouton galerie ne fonctionne pas - ajouté expo-image-picker avec permissions

## BUGS CRITIQUES - Images et Langues
- [x] Images manquantes sur les cartes de modèles - ajouté images locales de fallback
- [x] Seulement 3 langues affichées - ajouté les 6 langues (FR, EN, ES, DE, IT, PT)

## Correction des Images de Body Parts (Essayage Virtuel)
- [x] Identifier le problème : les images de demo-gallery montraient des bijoux déjà portés
- [x] Générer de nouvelles images AI de body parts sans bijoux (cou, oreilles, main, poignet, cheville)
- [x] Uploader les images sur CDN (CloudFront)
- [x] Mettre à jour LOCAL_DEMO_IMAGES dans tryon.tsx avec les URLs CDN
- [x] Corriger la gestion des types d'images ({uri: string} vs string vs require())
- [x] Mettre à jour le composant AIPositionedJewelry pour accepter {uri: string}
- [x] Corriger le mode manuel dans tryon.tsx pour les objets {uri}
- [x] Créer des tests unitaires pour la logique de chargement des images (12 tests)

## Intégration des vraies images GitHub (lecrin-replit)
- [ ] Uploader les images mannequins (face-1..4, hand-1..2, wrist-1..2, ankle-1, jewelry-model-rousse) sur CDN
- [ ] Uploader les vrais bijoux Moniattitude (boucles d'oreilles, colliers, bracelets) sur CDN
- [ ] Mettre à jour LOCAL_DEMO_IMAGES dans tryon.tsx avec les vraies images mannequins
- [ ] Mettre à jour les bijoux de démonstration dans tryon.tsx avec les vrais bijoux Moniattitude
- [ ] Mettre à jour les bijoux dans ecrin.tsx avec les vrais bijoux Moniattitude

## Intégration Supabase
- [x] Configurer les variables d'environnement Supabase dans l'application mobile
- [x] Installer @supabase/supabase-js dans le projet
- [x] Créer un client Supabase dans lib/supabase.ts
- [x] Mettre à jour les body_parts dans Supabase Ecrin avec les vraies photos mannequins CDN
- [x] Connecter l'écran d'essayage aux bijoux réels de Supabase
- [x] Connecter Mon Écrin aux bijoux de Supabase (lecture + ajout)

## Bug : Onglet Communauté disparu
- [x] Diagnostiquer pourquoi l'onglet Communauté a disparu
- [x] Restaurer l'onglet Communauté dans la barre de navigation

## Refonte Essayage Virtuel (fidèle Replit)
- [ ] Analyser le TryOnScreen.tsx du dépôt Replit
- [ ] Refaire l'écran d'essayage avec les vraies photos mannequins
- [ ] Superposition propre des bijoux sur les photos
- [ ] Interface simple et fluide comme dans Replit

## Refonte Essayage Virtuel (style Replit)
- [x] Analyser l'interface Replit pour reproduire l'essayage virtuel
- [x] Uploader les vraies photos mannequins du dépôt GitHub sur le CDN
- [x] Uploader les vrais bijoux MONI'ATTITUDE sur le CDN
- [x] Refaire l'écran d'essayage avec interface 2 blocs (photo + bijou) + galeries modales
- [x] Intégrer les 19 mannequins (visages, mains, poignets, chevilles, corps entier)
- [x] Intégrer les 30+ bijoux MONI'ATTITUDE (boucles, colliers, bracelets, bagues, chevillières, parures)

## Connexion Essayage IA
- [x] Analyser l'API d'essayage du serveur (tRPC + LLM Vision)
- [x] Connecter le bouton "Essayer ce bijou" à l'API IA
- [x] Afficher le résultat généré par l'IA dans l'écran
- [x] Ajouter un indicateur de progression pendant le traitement

## Barre de progression essayage IA
- [ ] Ajouter une barre de progression animée pendant le traitement IA

## Redesign Luxe (style Dior)
- [ ] Refondre la palette : noir profond, crème ivoire, or champagne
- [ ] Redesigner l'écran d'accueil (Home)
- [ ] Redesigner la barre de navigation (tab bar)
- [ ] Redesigner l'écran d'essayage virtuel
- [ ] Redesigner Mon Écrin
- [ ] Redesigner la Boutique
- [ ] Redesigner la Communauté
- [ ] Redesigner l'écran Plus / Profil

## Redesign Interface Luxe (style Dior)
- [x] Refondre la palette de couleurs (noir profond, crème, or)
- [x] Redesigner la navigation (tab bar luxe)
- [x] Redesigner l'écran d'accueil
- [x] Redesigner l'écran d'essayage virtuel
- [x] Redesigner Mon Écrin
- [x] Redesigner Boutique
- [x] Redesigner Communauté
- [x] Redesigner Paramètres
- [x] Ajouter barre de progression essayage IA

## Devenir Partenaire
- [ ] Créer l'écran partner.tsx avec formulaire de candidature (style luxe)
- [ ] Ajouter la route API pour soumettre une candidature partenaire
- [ ] Intégrer l'accès depuis la Boutique (bouton "Devenir Partenaire")
- [ ] Ajouter l'accès depuis les Paramètres

## Améliorations Prioritaires
- [ ] Connecter galerie photo / caméra dans l'essayage virtuel (expo-image-picker)
- [ ] Upload de la photo personnelle vers le serveur pour l'essayage IA
- [ ] Rendre Mon Écrin persistant dans Supabase (ajout, suppression, sync)
- [ ] Créer l'écran Devenir Partenaire (partner.tsx) avec formulaire luxe
- [ ] Route API pour soumettre une candidature partenaire (email + Supabase)
- [ ] Accès Devenir Partenaire depuis la Boutique et les Paramètres

## Améliorations Prioritaires (Mars 2026)
- [x] Connecter la caméra et la galerie photo dans l'écran d'essayage virtuel
- [x] Rendre Mon Écrin persistant via Supabase (tRPC collection.add/remove)
- [x] Créer l'écran Devenir Partenaire avec formulaire de candidature luxe
- [x] Ajouter le bouton Devenir Partenaire dans la Boutique
- [x] Barre de progression animée pendant l'essayage IA
- [x] Interface luxe style Dior (noir, crème, or) sur tous les écrans
- [x] Connexion aux 39 bijoux MONI'ATTITUDE depuis Supabase
- [x] Restauration de l'onglet Communauté

## Suite des Améliorations (Mars 2026 - v2)
- [ ] Créer l'onboarding au premier lancement (3 slides swipe)
- [ ] Connecter le formulaire Devenir Partenaire à un e-mail + Supabase
- [ ] Connecter la Communauté à Supabase (vrais posts persistants)
- [ ] Améliorer l'expérience de la Communauté (likes, commentaires)

## Suite des Améliorations (17 mars 2026)
- [x] Créer l'onboarding au premier lancement (3 slides swipe)
- [x] Connecter le formulaire Devenir Partenaire à la base de données (table partnerApplications)
- [x] Ajouter les routes tRPC community.list, community.create, community.like
- [x] Connecter la Communauté à la base de données (posts persistants)
- [x] Ajouter la barre de progression animée pendant l'essayage IA

## Améliorations (suite - 17 mars 2026)
- [ ] Créer l'écran de résultat dédié après l'essayage IA (plein écran, partage, sauvegarde)
- [ ] Activer l'authentification (bouton Se connecter fonctionnel)
- [ ] Connecter la boutique aux 39 bijoux MONI'ATTITUDE depuis Supabase

## Améliorations (suite - 17 mars 2026 v2)
- [x] Améliorer le modal de résultat essayage IA (plein écran luxe, badge IA, infos bijou, boutons Sauvegarder/Partager/Communauté)
- [x] Bouton "Mon Écrin" dans le résultat pour sauvegarder directement dans la collection
- [x] Bouton "Partager" natif iOS/Android dans le résultat
- [x] Bouton "Publier dans la Communauté" dans le résultat
- [x] Connecter la boutique à Supabase via tRPC (partnerJewelry.list + partnerBrands.list)
- [x] Fallback sur données de démo si Supabase retourne vide
- [x] Bouton "SE CONNECTER" dans le header de l'accueil (visible uniquement si non connecté)
- [x] Icône profil en or quand connecté
- [x] Redesign de l'écran de connexion (style luxe noir/crème/or)

## Email automatique Devenir Partenaire
- [x] Analyser le formulaire partenaire et la route tRPC existante
- [x] Configurer le service d'envoi d'email (Nodemailer + SMTP Titan port 465)
- [x] Créer le template email de confirmation pour le candidat (style luxe)
- [x] Créer le template email de notification pour l'équipe Inferencevision
- [x] Intégrer l'envoi d'email dans la route tRPC partnerApplications.submit
- [x] Tester la connexion SMTP (test vitest passé ✓)

## Mémoire Supabase Agent
- [x] Créer la table agent_memory dans le projet Supabase inferencevisionmemory
- [x] Stocker les informations clés du projet (SMTP, Supabase, stack, features)
- [x] Configurer les politiques RLS pour accès anon

## Audit et Corrections (17 mars 2026)
- [x] CRITIQUE: Upload auto de la photo locale avant envoi à l'API essayage IA (file:// → URL publique)
- [x] Connecter "Aide & FAQ" à une page web et "Noter l'App" au Store dans Paramètres
- [x] Connecter les favoris dans gallery.tsx (TODO non implémenté)
- [x] Utiliser le vrai nom de l'utilisateur connecté dans les posts Communauté
- [x] Ajouter un fallback propre si Mixpanel non configuré (déjà géré dans AnalyticsProvider)

## Dressing Virtuel Étendu (17 mars 2026)
- [x] Créer l'écran Dressing Virtuel avec 4 onglets : Bijoux, Chaussures, Vêtements, Accessoires
- [x] Ajouter section Chaussures dans l'écran Essayage avec mannequins pieds/jambes
- [x] Ajouter section Vêtements dans l'écran Essayage avec mannequins corps entier
- [x] Ajouter section Accessoires dans l'écran Essayage (sacs, ceintures, lunettes)
- [x] Routes tRPC wardrobe.add/list/delete/uploadImage déjà disponibles (réutilisées)
- [x] Navigation depuis dressing vers essayage avec paramètres de mode (section=shoes|clothing|accessories)
- [x] Sélecteur de mode dans l'écran Essayage (Bijoux / Chaussures / Vêtements / Accessoires)

## Améliorations Dressing Virtuel v2 (18 mars 2026)
- [x] Générer images PNG chaussures de démo (escarpins, sneakers, bottines, sandales)
- [x] Intégrer les chaussures de démo dans la galerie d'essayage mode Chaussures
- [x] Connecter résultat essayage → Dressing (bouton "Ajouter au Dressing" selon catégorie)
- [x] Ajouter filtre Favoris (bouton cœur rouge) dans chaque onglet du Dressing

## Nouvelles Fonctionnalités (18 mars 2026)
- [x] Scraper moniattitude.com : 19 vrais bijoux avec images CDN et prix réels
- [x] Seeder 19 bijoux MONI'ATTITUDE en base de données (partnerBrands + partnerJewelry)
- [x] Partage amélioré : image téléchargée localement + message avec watermark textuel "L'Écrin Virtuel"
- [x] Créer l'écran admin candidatures partenaires (app/admin-candidatures.tsx)
- [x] Routes tRPC admin : partnerApplications.list et partnerApplications.updateStatus
- [x] Accès admin discret via icône ⚙️ en bas de l'écran Paramètres
- [x] Code admin par défaut : ADMIN_CODE_REDACTED (configurable via ADMIN_CODE env var)
- [ ] Générer images PNG vêtements de démo (robe noire, blazer camel, chemisier ivoire, pantalon marine)
- [ ] Intégrer les vêtements de démo dans la galerie essayage mode Vêtements

## Vêtements démo + Admin sécurisé (18 mars 2026)
- [x] Générer images PNG vêtements de démo (robe noire, blazer camel, chemisier ivoire, pantalon marine)
- [x] Intégrer les vêtements de démo dans la galerie essayage mode Vêtements
- [x] Configurer ADMIN_CODE via les secrets du projet (test vitest passé ✓)

## Accessoires démo (18 mars 2026)
- [x] Générer images PNG accessoires de démo (sac à main noir, ceinture dorée, lunettes cat-eye, écharpe beige)
- [x] Intégrer les accessoires de démo dans la galerie essayage mode Accessoires

## Mannequins Corps Entier Vêtements (18 mars 2026)
- [x] Générer 5 photos mannequins corps entier professionnels (femme svelte, femme casual, femme ronde, homme classique, femme élancée peau foncée)
- [x] Intégrer les nouveaux mannequins dans la section Clothing de l'écran essayage
## Bug Fix : Mon Écrin vide (18 mars 2026)
- [x] Diagnostiquer : Mon Écrin lisait la table Supabase `jewelry` (vide) au lieu de `partnerJewelry` (MySQL)
- [x] Corriger : Mon Écrin charge maintenant les 19 bijoux MONI'ATTITUDE via tRPC partnerJewelry.list
- [x] Ajouter message "Connexion requise" si l'utilisateur non-connecté tente de sauvegarder dans Mon Écrin

## Onglets filtrage Mon Écrin (18 mars 2026)
- [x] Onglets Tous / Boucles / Colliers / Bagues / Bracelets / Chevillieres / Broches dans Mon Écrin
- [x] Filtrer les bijoux affichés selon l'onglet actif
- [x] Afficher le compteur d'articles par catégorie dans chaque onglet
- [x] Masquer automatiquement les onglets vides (count = 0)
- [x] Icônes symétriques par catégorie (✦ ◈ ◉ ◎ ⊙ ◌ ✿)
- [x] Retour haptique au changement d'onglet

## Adaptation libellés essayage (18 mars 2026)
- [ ] Adapter le bouton "Essayer ce bijou" selon le mode (Vêtement / Chaussures / Accessoire)
- [ ] Adapter les titres et labels des modals selon le mode actif
- [ ] Adapter le bouton "Sauvegarder dans Mon Écrin" selon le mode

## APIs Essayage Virtuel par Catégorie (18 mars 2026)
- [ ] Adapter les libellés de l'essayage selon le mode actif (bouton "Essayer ce bijou" → "Essayer ce vêtement" etc.)
- [ ] Rechercher les meilleures APIs d'essayage virtuel par catégorie
- [ ] Intégrer les APIs sélectionnées dans le serveur et l'écran essayage

## Amélioration Prompts IA Essayage (18 mars 2026)
- [x] Rechercher les capacités de Nano Banana 2 (gemini-3.1-flash-image-preview) pour l'essayage virtuel
- [x] Mettre à jour la route tRPC virtualTryOn.generate pour accepter le paramètre `category`
- [x] Créer des prompts spécialisés pour les bijoux (boucles, collier, bracelet, bague, chevillière, parure)
- [x] Créer un prompt spécialisé pour les chaussures (positionnement sur les pieds, texture cuir/tissu)
- [x] Créer un prompt spécialisé pour les vêtements (drapé naturel, texture tissu, remplacement du vêtement)
- [x] Créer un prompt spécialisé pour les accessoires (sac, ceinture, lunettes, écharpe)
- [x] Adapter l'appel tRPC dans tryon.tsx pour passer la catégorie et le type de bijou
- [x] Adapter les messages de progression selon le mode actif (bijou/chaussures/vêtement/accessoire)

## Améliorations Essayage v3 (18 mars 2026)
- [x] Ajouter sous-types accessoires (bag/belt/sunglasses/scarf/hat/watch) avec prompts affinés
- [x] Ajouter sélecteur de sous-type dans l'UI essayage mode Accessoires
- [x] Ajouter paramètre numSamples (1-4) dans la route tRPC virtualTryOn.generate
- [x] Ajouter sélecteur nombre de variantes dans l'UI essayage (1, 2, 4)
- [x] Retourner plusieurs URLs de résultats si numSamples > 1
- [x] Afficher les variantes en grille dans le modal de résultat
- [x] Créer l'historique des essayages par catégorie dans le profil (TryOnHistoryTab)
- [x] Sauvegarder chaque essayage dans AsyncStorage avec catégorie + image résultat
- [x] Afficher l'historique avec filtres Bijoux / Chaussures / Vêtements / Accessoires

## Relancer un essayage depuis l'historique (18 mars 2026)
- [x] Ajouter bouton "Réessayer" sur chaque carte de l'historique
- [x] Naviguer vers l'écran essayage avec les paramètres pré-remplis (photo modèle, article, catégorie, sous-type)
- [x] Mettre à jour l'écran essayage pour lire les params modelImageUrl et itemImageUrl depuis la navigation

## Partage depuis l'historique (18 mars 2026)
- [x] Ajouter bouton de partage natif sur chaque carte de l'historique
- [x] Partager l'image résultat + message MONI'ATTITUDE via Share natif iOS/Android
- [x] Télécharger l'image localement avant partage sur mobile (expo-file-system)

## Zoom sur l'image générée (18 mars 2026)
- [x] Créer composant ZoomableImage avec pinch-to-zoom et double-tap (react-native-gesture-handler + reanimated)
- [x] Intégrer ZoomableImage dans le modal de résultat de l'essayage
- [x] Ajouter indicateur visuel "Pincez pour zoomer" au premier affichage

## Fix ratio image modal résultat (18 mars 2026)
- [x] Adapter le ratio d'aspect de l'image résultat selon la catégorie (chaussures/vêtements = 9:16, bijoux/accessoires = 3:4)

## Amélioration prompt chaussures (18 mars 2026)
- [x] Mettre à jour le prompt chaussures pour forcer image plein corps avec pieds visibles en bas de cadre

## Amélioration prompt vêtements (18 mars 2026)
- [x] Appliquer la règle CRITICAL FRAMING plein corps 9:16 au prompt vêtements (cohérence avec chaussures)

## Sélecteur de pose du mannequin (18 mars 2026)
- [x] Ajouter constantes POSE_OPTIONS (face, profil, marche, dos) avec icônes et labels
- [x] Ajouter état selectedPose et sélecteur horizontal dans l'écran essayage
- [x] Passer la pose au serveur via le paramètre pose dans virtualTryOn.generate
- [x] Intégrer la pose dans les prompts chaussures, vêtements et accessoires

## Carousel horizontal pour les variantes (18 mars 2026)
- [ ] Remplacer le ScrollView vertical du modal résultat par un FlatList horizontal paginated (carousel)
- [ ] Afficher l'indicateur de page (1/2, 2/2) en overlay sur l'image
- [ ] Supprimer les miniatures en bas (remplacées par le swipe)

## Fix erreur GE-NERATE_ERROR (18 mars 2026)
- [x] Raccourcir les prompts (max ~300 tokens) pour éviter les erreurs de génération
- [x] Ajouter retry automatique (3 tentatives) côté serveur en cas d'échec
- [x] Restructurer le modal résultat avec carousel horizontal FlatList paginée

## Adaptation éclairage dans les prompts (18 mars 2026)- [x] Ajouter instruction d'adaptation lumiéreuse dans tous les prompts (même source, ombres, température couleur)

## Mode Tenue Complète (18 mars 2026)
- [x] Créer écran TenuCompleteScreen avec sélection multi-articles (vêtement + bijoux + chaussures + accessoires)
- [x] Ajouter route tRPC virtualTryOn.outfit pour prompt combiné multi-articles
- [x] Intégrer le mode Tenue Complète comme onglet dans l'écran essayage
- [x] Afficher les articles sélectionnés en grille avec bouton de suppression
- [x] Sauvegarder la tenue dans l'historique avec toutes les images des articles

## Mode Tenue Complète v2 (18 mars 2026)
- [x] Corriger erreurs TS : category type dans historique, Record manquant outfit
- [x] Mettre à jour route tRPC outfit avec slots : tshirt, jacket, pants, earrings, ring, necklace, bracelet, accessory1, accessory2, shoes
- [x] Créer interface Tenue Complète avec grille de 10 slots sélectionnables
- [x] Chaque slot ouvre la galerie correspondante pour sélectionner l'article
- [x] Bouton Essayer la Tenue lance la génération multi-articles

## Sauvegarder tenue dans Mes Looks (18 mars 2026)
- [x] Lire la structure des looks sauvegardés dans Mes Looks (route tRPC looks.create)
- [x] Ajouter bouton "Sauvegarder dans Mes Looks" dans le modal résultat de OutfitBuilder
- [x] Créer la fonction de sauvegarde avec image générée + liste des articles sélectionnés

## Nommage du look avant sauvegarde (18 mars 2026)
- [x] Ajouter un bottom sheet de nommage avec champ de saisie, sélection d'occasion et saison avant sauvegarde dans Mes Looks

## Filtres Mes Looks par occasion et saison (18 mars 2026)
- [x] Ajouter filtres occasion (Tous/Casual/Travail/Soirée/Sport/Fête) et saison (Tous/Printemps/Été/Automne/Hiver) dans Mes Looks

## Articles de démo Chapeaux et Montres (18 mars 2026)
- [x] Générer 3 images de chapeaux (bob, casquette, chapeau de paille) sur fond blanc
- [x] Générer 3 images de montres (classique, sport, luxe) sur fond blanc
- [x] Intégrer les images comme articles de démo dans les sous-types hat et watch de l'OutfitBuilder

## Mannequins inclusifs masculins et non-genrés (18 mars 2026)
- [x] Générer 3 mannequins masculins (plein corps, buste, visage) sur fond neutre studio
- [x] Générer 3 mannequins non-genrés / androgyne sur fond neutre studio
- [x] Intégrer les mannequins masculins dans OutfitBuilder (OUTFIT_MANNEQUINS)
- [x] Intégrer les mannequins masculins dans les galeries de l'écran essayage (bijoux, vêtements, chaussures, accessoires)
- [x] Intégrer les mannequins non-genrés dans les deux galeries

## OutfitBuilder - Look Complet
- [x] OutfitBuilder : ajouter slots dédiés jupe/robe, sac, chapeau, bas/collants
- [x] OutfitBuilder : ajouter slots dédiés ceinture, lunettes, lunettes de soleil
- [x] OutfitBuilder : mettre à jour la route serveur outfit avec tous les nouveaux slots
- [x] OutfitBuilder : corriger modal galerie (FlatList → ScrollView)

## Mode Snapshot Communauté
- [x] Créer le composant SnapshotEditor avec cadres stylisés (Polaroid, Magazine, Carte postale, Luxe, Minimal)
- [x] Ajouter les effets photo subtils (Original, Grain argentique, Lumière dorée, N&B chic, Rosé)
- [x] Ajouter les décors interchangeables (Studio, Rue parisienne, Jardin, Intérieur chic, Plage)
- [x] Intégrer le bouton Snapshot dans la modal de création de post
- [ ] Permettre la capture ViewShot du résultat Snapshot avant publication

## Snapshot dans le fil Communauté
- [ ] Ajouter snapshotConfig dans le type Post
- [x] Passer snapshotConfig lors de la publication
- [ ] Afficher SnapshotPreview dans PostCard si snapshotConfig est défini

## Snapshot améliorations
- [x] Cadre Story 9:16 avec logo Écrin Virtuel en bas
- [x] Texte personnalisé sur la photo (nom bijou, hashtag, citation) avec choix police et couleur
- [x] Afficher SnapshotPreview dans PostCard (fil Communauté)
- [x] Passer snapshotConfig lors de la publication

## Snapshot v3
- [x] Repositionnement texte overlay (haut/centre/bas)
- [x] Bouton Partager natif (expo-sharing) pour posts Story

## Snapshot v4
- [ ] Bouton Partager en Story dans la modal de résultat d'essayage
- [ ] Compteur de partages dans PostCard et données démo

## Communauté v2
- [ ] Onglet Tendances avec tri par partages décroissants + badge rang
- [x] Notifications in-app pour seuils de partages (10 et 50)

## Communauté v3
- [x] Filtre période (Cette semaine / Ce mois) dans onglet Tendances
- [x] Écran profil utilisateur accessible depuis les posts (avatar tap)
- [x] Système de Défis look hebdomadaires dans la Communauté

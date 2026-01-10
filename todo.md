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

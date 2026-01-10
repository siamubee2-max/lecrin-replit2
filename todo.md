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

# Checklist Complète de Soumission App Store Connect

Cette marche à suivre détaille toutes les étapes nécessaires pour préparer, configurer et soumettre une application à l'équipe de validation d'Apple (App Review) via App Store Connect.

## 1. Configuration initiale et gestion de l'équipe

- [ ] **Vérifier les comptes et les rôles :** Assurez-vous d'avoir les rôles appropriés dans App Store Connect pour créer et gérer des applications.
- [ ] **Ajouter ou modifier des utilisateurs (si nécessaire) :** Attribuez les accès nécessaires aux membres de l'équipe (développeurs, testeurs, etc.).

## 2. Création de la fiche de l'application

- [ ] **Ajouter une nouvelle application :** Créez l'enregistrement de l'application dans App Store Connect.
- [ ] **Définir le nom du développeur :** Configurez le nom du développeur qui apparaîtra sur l'App Store.
- [ ] **Ajouter les plateformes :** Spécifiez les plateformes cibles (iOS, iPadOS, macOS, tvOS, visionOS, ou watchOS).
- [ ] **Créer et soumettre les bundles d'application :** Assurez-vous que les informations du bundle sont correctes.

## 3. Gestion des informations et métadonnées de l'application

- [ ] **Renseigner les informations générales :** Consultez et modifiez les informations de base de l'application.
- [ ] **Localiser les informations :** Ajoutez les traductions de vos métadonnées si l'application est disponible dans plusieurs langues.
- [ ] **Définir la catégorie d'âge (Age Rating) :** Remplissez le questionnaire pour établir la classification de votre application.
- [ ] **Gérer les balises (Tags) :** Ajoutez des balises pertinentes pour améliorer la découverte de l'application.
- [ ] **Fournir un accord de licence personnalisé (EULA) :** Facultatif, si vous n'utilisez pas celui par défaut d'Apple.
- [ ] **Ajouter l'icône de l'application :** Vous pouvez utiliser l'outil _Icon Composer_ dans Xcode pour la créer.
- [ ] **Téléverser les aperçus (Previews) et les captures d'écran :**
  - [ ] Vérifier les formats : Les captures d'écran doivent être impérativement aux formats `.jpeg`, `.jpg` ou `.png`.
  - [ ] Téléverser au moins une capture d'écran pour les tailles d'écran requises.
  - [ ] Définir l'image de couverture (poster frame) pour vos aperçus vidéo.

## 4. Conformité, Confidentialité et Accessibilité

- [ ] **Gérer la confidentialité de l'application (App Privacy) :** Déclarez les données collectées par l'application.
- [ ] **Documentation de conformité d'exportation (Cryptographie) :** Déterminez et téléversez la documentation requise si votre application utilise un chiffrement.
- [ ] **Déclarer le statut de dispositif médical (si applicable) :** Obligatoire si l'application a une catégorie Santé & Fitness/Médicale ou contient des informations de traitement fréquentes.
- [ ] **Configurer les étiquettes de nutrition d'accessibilité :** Évaluez et gérez les critères d'accessibilité (VoiceOver, contraste, etc.).

## 5. Tarification et Disponibilité

- [ ] **Définir le prix :** Sélectionnez un palier de prix pour votre application.
- [ ] **Définir les méthodes de distribution :** Choisissez comment l'application sera distribuée sur l'App Store.
- [ ] **Gérer la disponibilité géographique :** Sélectionnez les pays ou régions où l'application sera disponible.
- [ ] **Programmer la sortie (Release option) :** Choisissez si la publication sera manuelle, automatique après validation, ou à une date précise.
- [ ] **Activer la précommande (optionnel) :** Vous pouvez publier l'application en précommande avant son lancement officiel.

## 6. Téléversement et gestion du Build (Xcode)

- [ ] **Téléverser le Build :** Utilisez Xcode pour compiler et envoyer le build de l'application vers App Store Connect.
- [ ] **Vérifier le statut du Build :** Consultez les avertissements ou erreurs potentiels liés à la livraison directement dans App Store Connect.
- [ ] **Choisir le Build à soumettre :** Sélectionnez la version spécifique du build que vous souhaitez envoyer à l'équipe de validation.

## 7. Tests avec TestFlight (Étape recommandée avant soumission)

- [ ] **Fournir les informations de test :** Remplissez les instructions pour les testeurs.
- [ ] **Ajouter des testeurs internes :** Distribuez rapidement le build à votre équipe.
- [ ] **Inviter des testeurs externes :** Créez des groupes publics ou invitez des testeurs via e-mail.
- [ ] **Vérifier les retours (Feedbacks) :** Consultez les rapports de plantage et les captures d'écran envoyés par les testeurs pour corriger les bugs finaux.

## 8. Achats intégrés, Abonnements et Événements (Si applicable)

- [ ] **Configurer les achats intégrés (In-App Purchases) :** Créez les achats consommables, non-consommables ou les abonnements.
- [ ] **Tester les achats intégrés et abonnements dans TestFlight via l'environnement Sandbox :**
  - [ ] Créer des comptes de test Apple Sandbox (Sandbox Apple Account) dans App Store Connect.
  - [ ] Modifier la vitrine (storefront) du compte de test pour vérifier le comportement selon le pays ou la région.
  - [ ] Ajuster les taux de renouvellement des abonnements pour accélérer les tests.
  - [ ] Simuler des flux d'achat interrompus pour tester la gestion des erreurs de paiement de votre application.
  - [ ] Effacer l'historique d'achats d'un compte de test pour recommencer une simulation depuis le début.
  - [ ] Tester le Partage familial (Family Sharing) en configurant des "Familles de test Sandbox" dans App Store Connect pour partager des abonnements ou achats non consommables avec un maximum de cinq testeurs.
  - [ ] _Note :_ La majorité de ces paramètres de test (historique, interruptions de flux, etc.) peuvent être modifiés directement depuis l'iPhone ou l'iPad du testeur, en plus d'App Store Connect.
- [ ] **Soumettre les composants Game Center :** Configurez et soumettez les classements, réalisations ou défis si votre application est un jeu.

## 9. Soumission finale à l'App Review

- [ ] **Vérifier l'aperçu de la soumission :** Assurez-vous que toutes les métadonnées, les builds et les achats intégrés associés sont prêts.
- [ ] **Soumettre l'application :** Cliquez sur le bouton de soumission pour envoyer l'application à l'équipe de révision d'Apple.
- [ ] **Suivre la soumission :**
  - [ ] Si des problèmes sont détectés, gérez la soumission avec les problèmes non résolus.
  - [ ] Répondez aux messages de l'équipe App Review via le centre de résolution.

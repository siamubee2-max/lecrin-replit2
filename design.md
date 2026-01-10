# Ecrin Virtuel - Design Mobile (iOS)

## Concept de l'Application

**Ecrin Virtuel** est une application d'essayage virtuel de bijoux qui permet aux utilisateurs de photographier un bijou vu en vitrine ou dans un magazine, puis de l'essayer virtuellement sur eux grâce à la réalité augmentée.

## Palette de Couleurs

| Token | Clair | Sombre | Usage |
|-------|-------|--------|-------|
| primary | #D4AF37 | #FFD700 | Accents dorés, boutons principaux |
| background | #FFFFFF | #0A0A0A | Fond des écrans |
| surface | #F8F6F0 | #1A1A1A | Cartes, surfaces élevées |
| foreground | #1A1A1A | #F5F5F5 | Texte principal |
| muted | #6B6B6B | #A0A0A0 | Texte secondaire |
| border | #E5E0D5 | #2A2A2A | Bordures |

## Liste des Écrans

### 1. Écran d'Accueil (Home)
Présentation de l'application avec un bouton principal pour commencer l'essayage.

**Contenu :**
- Logo Ecrin Virtuel en haut
- Image de bijou en fond (subtile)
- Titre : "Essayez Virtuellement les Bijoux que Vous Aimez"
- Sous-titre : "Photographiez, Analysez, Essayez"
- Bouton principal : "Commencer l'Essayage"
- Bouton secondaire : "Voir mes Essayages"

### 2. Écran de Capture (Capture)
Interface pour photographier un bijou ou importer une image.

**Contenu :**
- Aperçu caméra en plein écran
- Cadre de guidage pour centrer le bijou
- Bouton de capture (cercle doré)
- Bouton galerie (importer depuis photos)
- Instructions : "Cadrez le bijou dans le cercle"

### 3. Écran d'Analyse (Analysis)
Affichage pendant l'analyse IA du bijou.

**Contenu :**
- Image du bijou capturé
- Animation de chargement élégante
- Texte : "Analyse en cours..."
- Progression : "Détection du bijou", "Identification du type", "Préparation de l'essayage"

### 4. Écran d'Essayage Virtuel (Try-On)
Interface AR pour essayer le bijou sur soi.

**Contenu :**
- Caméra frontale en plein écran
- Bijou superposé en AR
- Contrôles : taille, position, rotation
- Bouton capture (sauvegarder l'essayage)
- Bouton partage

### 5. Écran Galerie (Gallery)
Historique des essayages sauvegardés.

**Contenu :**
- Grille de photos d'essayages
- Chaque photo avec date et type de bijou
- Actions : supprimer, partager, réessayer

### 6. Écran Paramètres (Settings)
Configuration de l'application.

**Contenu :**
- Profil utilisateur
- Préférences de caméra
- Notifications
- À propos
- Politique de confidentialité

## Flux Utilisateur Principal

1. **Accueil** → Utilisateur appuie sur "Commencer l'Essayage"
2. **Capture** → Utilisateur photographie un bijou en vitrine
3. **Analyse** → L'IA analyse et identifie le bijou
4. **Essayage** → Le bijou est affiché en AR sur l'utilisateur
5. **Sauvegarde** → L'utilisateur capture et sauvegarde son essayage
6. **Galerie** → L'utilisateur peut revoir ses essayages

## Navigation (Tab Bar)

| Tab | Icône | Écran |
|-----|-------|-------|
| Accueil | house.fill | Home |
| Essayer | camera.fill | Capture |
| Galerie | photo.stack.fill | Gallery |
| Paramètres | gearshape.fill | Settings |

## Typographie

- **Titres** : System Font Bold (SF Pro Display)
- **Corps** : System Font Regular (SF Pro Text)
- **Tailles** : 32pt (H1), 24pt (H2), 17pt (body), 14pt (caption)

## Animations

- Transitions fluides entre écrans (0.3s)
- Feedback haptique sur les boutons
- Animation de pulsation sur le bouton de capture
- Effet de brillance subtil sur les éléments dorés

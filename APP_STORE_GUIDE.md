# Guide de Soumission App Store - Écrin Virtuel

## Informations de Configuration

| Paramètre | Valeur |
|-----------|--------|
| **Bundle ID** | com.ecrin.jewelry |
| **Nom de l'App** | Ecrin Virtuel |
| **Apple Team ID** | SPLML3CN76 |
| **Apple ID** | chrweber@skynet.be |
| **Version** | 1.0.0 |

---

## Étape 1 : Installer EAS CLI

Ouvrez un terminal et exécutez :

```bash
npm install -g eas-cli
```

## Étape 2 : Se Connecter à Expo

```bash
eas login
```

Utilisez vos identifiants Expo (créez un compte sur expo.dev si nécessaire).

## Étape 3 : Configurer le Projet

Dans le dossier du projet, initialisez EAS :

```bash
cd ecrin-mobile-app
eas build:configure
```

Créez le fichier `eas.json` avec cette configuration :

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "chrweber@skynet.be",
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "SPLML3CN76"
      }
    }
  }
}
```

## Étape 4 : Générer un App-Specific Password

1. Allez sur https://appleid.apple.com
2. Connectez-vous avec chrweber@skynet.be
3. Dans "Sécurité" → "Mots de passe pour applications"
4. Cliquez sur "Générer un mot de passe"
5. Nommez-le "EAS Build" et copiez le mot de passe

## Étape 5 : Lancer le Build iOS

```bash
eas build --platform ios --profile production
```

Lors du premier build, EAS vous demandera :
- Votre Apple ID (chrweber@skynet.be)
- Le mot de passe spécifique à l'application
- De créer automatiquement les certificats et profils

## Étape 6 : Créer l'App sur App Store Connect

1. Allez sur https://appstoreconnect.apple.com
2. Cliquez sur "Mes apps" → "+"
3. Remplissez :
   - **Nom** : Écrin Virtuel
   - **Langue principale** : Français
   - **Bundle ID** : com.ecrin.jewelry
   - **SKU** : ecrin-virtuel-2024

## Étape 7 : Préparer les Métadonnées

### Description (App Store)

```
Écrin Virtuel - Votre bijouterie virtuelle

Découvrez une nouvelle façon d'essayer des bijoux grâce à la réalité augmentée. Photographiez n'importe quel bijou en vitrine ou dans un magazine, et visualisez-le instantanément sur vous.

FONCTIONNALITÉS PRINCIPALES :

📸 Capture Intelligente
Prenez en photo n'importe quel bijou - bague, collier, bracelet ou boucles d'oreilles.

✨ Analyse par IA
Notre intelligence artificielle détecte automatiquement le bijou et ses caractéristiques.

👤 Essayage Virtuel
Visualisez le bijou sur vous en temps réel grâce à la réalité augmentée.

💾 Galerie Personnelle
Sauvegardez vos essayages favoris et comparez différents bijoux.

📤 Partage Facile
Partagez vos essayages avec vos proches pour avoir leur avis.

Écrin Virtuel transforme votre smartphone en miroir magique pour bijoux. Fini les hésitations en bijouterie - essayez avant d'acheter, où que vous soyez !
```

### Mots-clés

```
bijoux, essayage virtuel, réalité augmentée, AR, bague, collier, bracelet, bijouterie, mode, accessoires
```

### Catégorie

- Principale : **Style de vie**
- Secondaire : **Shopping**

### Captures d'écran Requises

Vous devrez fournir des captures d'écran pour :
- iPhone 6.7" (iPhone 15 Pro Max)
- iPhone 6.5" (iPhone 14 Plus)
- iPad Pro 12.9"

## Étape 8 : Soumettre le Build

Une fois le build terminé :

```bash
eas submit --platform ios --latest
```

Ou soumettez manuellement via App Store Connect en téléchargeant le fichier .ipa.

## Étape 9 : Remplir les Informations de Review

### Informations de Contact pour la Review

- **Prénom** : [Votre prénom]
- **Nom** : [Votre nom]
- **Téléphone** : [Votre numéro]
- **Email** : chrweber@skynet.be

### Notes pour la Review

```
Écrin Virtuel est une application d'essayage virtuel de bijoux utilisant la réalité augmentée.

Pour tester l'application :
1. Ouvrez l'application
2. Appuyez sur "Essayer" dans la barre de navigation
3. Prenez une photo d'un bijou ou utilisez une image de la galerie
4. L'IA analysera le bijou automatiquement
5. Utilisez l'écran d'essayage pour visualiser le bijou sur vous

Aucun compte utilisateur n'est requis pour utiliser l'application.
```

### Classification du Contenu

- Violence : Aucune
- Contenu sexuel : Aucun
- Langage grossier : Aucun
- Thèmes pour adultes : Aucun

→ Classification : **4+**

---

## Checklist Finale

- [ ] Compte Apple Developer actif (99€/an)
- [ ] App-Specific Password généré
- [ ] Compte Expo créé et connecté
- [ ] Build iOS généré avec succès
- [ ] App créée sur App Store Connect
- [ ] Description et mots-clés remplis
- [ ] Captures d'écran uploadées
- [ ] Icône de l'app (1024x1024) uploadée
- [ ] Politique de confidentialité URL fournie
- [ ] Build soumis pour review

---

## Support

Pour toute question sur le processus de soumission :
- Documentation Expo : https://docs.expo.dev/submit/ios/
- Documentation Apple : https://developer.apple.com/app-store/submitting/

---

*Guide créé pour Écrin Virtuel - Janvier 2026*

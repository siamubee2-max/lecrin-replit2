# Suivi de Soumission App Store Connect — Ecrin Virtuel

> **App** : Ecrin Virtuel | **Bundle ID** : `com.inferencevision.lecrinvirtuel` | **Apple ID** : `chrweber@skynet.be` | **Team ID** : `SPLML3CN76` | **ASC App ID** : `6758549821` | **Version** : 1.0.0

---

## Section 1 — Configuration initiale et gestion de l'equipe

- [x] Compte `chrweber@skynet.be` avec role Admin
- [x] `eas.json` pret avec `ascAppId: 6758549821`, `appleTeamId: SPLML3CN76`
- [x] EAS Project ID : `52023f23-2329-4fab-b9c9-a518b17f94f3`
- [ ] Definir le SKU dans ASC (ex: `ecrin-virtuel-2025`)
- [ ] Verifier/inviter d'autres membres d'equipe sur https://appstoreconnect.apple.com/access/users

---

## Section 2 — Creation de la fiche de l'application

- [x] App enregistree — `ascAppId: 6758549821`
- [x] Bundle ID — `com.inferencevision.lecrinvirtuel`
- [x] Plateforme — iOS + iPadOS (`supportsTablet: true`)
- [x] Owner EAS — `tiwounti`
- [x] Nom developpeur configure

---

## Section 3 — Metadonnees et assets visuels

### Textes ASO (source : `ASO_CONFIG.md`)

- [x] Titre : "Ecrin Virtuel" (14 car.)
- [x] Sous-titre : "Essayage Bijoux en AR" (22 car.)
- [x] Mots-cles : 98 car. / 100 max
- [x] Description promotionnelle : 145 car. / 170 max
- [x] Description complete : ~1800 car. / 4000 max
- [x] Texte "Quoi de neuf" (v1.0.0)
- [x] Categorie principale : Shopping
- [x] Categorie secondaire : Lifestyle

### Assets visuels

- [x] Icone 1024x1024 px PNG — `assets/images/icon.png` (dimensions verifiees)
- [ ] **Captures d'ecran iPhone 6.7"** (1290x2796 px) — 5 captures minimum :
  1. Ecran d'accueil — hero "Essayez l'inaccessible Virtuellement"
  2. Essayage virtuel — modele avec bijou AR
  3. Mon Ecrin — catalogue avec filtres
  4. Boutique — createurs partenaires
  5. Abonnements — plans premium
- [ ] **Captures d'ecran iPad 12.9"** (2048x2732 px) — memes ecrans adaptes tablette
- [ ] Remplir questionnaire Age Rating dans ASC (cible : 4+)
- [ ] Apercu video (optionnel mais recommande)
- [ ] Localisation : ajouter traductions si distribution multilingue

### Actions

```bash
# Verifier les dimensions de l'icone
sips -g pixelHeight -g pixelWidth assets/images/icon.png
# -> OK : 1024x1024
```

---

## Section 4 — Conformite, Confidentialite et Accessibilite

### Encryption

- [x] `usesNonExemptEncryption: false` dans `app.config.ts` (ligne 66)

### Privacy Policy

- [x] Fichier privacy policy cree : `public/ecrinvirtuel-privacy.html`
  - Conforme RGPD, declaration des sous-traitants (Supabase, RevenueCat, PostHog, Sentry)
  - Date de mise a jour : 1er avril 2026
- [ ] **BLOQUANT** : Deployer `ecrinvirtuel-privacy.html` sur `https://ecrinvirtuel.app/privacy`
  - Option A : deployer via un hosting statique (Vercel, Netlify, Cloudflare Pages)
  - Option B : heberger directement sur le domaine `ecrinvirtuel.app`

### App Privacy (ASC)

- [ ] **Declarer dans ASC** les donnees collectees :
  - Camera : essayage AR (NSCameraUsageDescription OK)
  - Photos : sauvegarde essayages (NSPhotoLibraryUsageDescription OK)
  - Localisation : suggestions meteo (NSLocationWhenInUseUsageDescription OK)
  - Authentification : email via Supabase Auth
  - Analytics : PostHog (evenements anonymises) + Sentry (crash reports)
  - Achats : gerees par Apple/RevenueCat (pas de donnees bancaires stockees)

### Accessibilite

- [ ] Evaluer VoiceOver labels sur les ecrans principaux
- [ ] Verifier les contrastes (fond navy #0A1A3B + texte dore #C9A96E)
- [ ] Configurer les etiquettes d'accessibilite dans ASC

---

## Section 5 — Tarification et Disponibilite

- [ ] Prix : Gratuit (abonnements In-App) — a configurer dans ASC
- [ ] Distribution : App Store public
- [ ] Pays : Tous (ou selection specifique)
- [ ] Release option : Manuel apres validation
- [ ] Precommande : non active (optionnel)

---

## Section 6 — Build EAS

### Commandes

```bash
# Build production iOS
eas build --platform ios --profile production

# Soumission vers App Store Connect
eas submit --platform ios --latest
```

### Checklist

- [x] `eas.json` configure (development / preview / production)
- [x] Submit iOS configure (appleId, appleTeamId, ascAppId)
- [x] autoIncrement active sur production
- [ ] **Build production lance et complete**
- [ ] **Build soumis a App Store Connect**
- [ ] Build visible dans ASC (TestFlight -> Builds)
- [ ] Verifier avertissements/erreurs post-upload

---

## Section 7 — Tests TestFlight

### Instructions testeurs (a copier dans TestFlight)

```
Pour tester Ecrin Virtuel :
1. Ouvrir l'app -> onglet "Essayer"
2. Prendre une photo d'un bijou ou importer depuis la galerie
3. L'IA analyse et lance l'essayage AR automatiquement
Tester : Mon Ecrin, Boutique, Abonnements.
Contact : inferencevision@inferencevision.store
```

### Checklist

- [ ] Instructions de test renseignees dans TestFlight
- [ ] Testeurs internes ajoutes
- [ ] Testeurs externes invites (optionnel v1)
- [ ] Feedbacks/crashs examines et corriges

---

## Section 8 — Achats integres et Abonnements

### Produits a creer dans ASC (14 produits au total)

> Source de verite : `ASO_CONFIG.md` + `hooks/use-subscription.ts` + `server/monetization.ts`
> Les IDs ci-dessous sont ceux utilises dans le code. Ils doivent etre crees **exactement** avec ces noms.

#### Abonnements principaux (3)

| ID Produit ASC | Nom affiche | Prix | Entitlement RC | Type |
|----------------|-------------|------|----------------|------|
| `ecrin.jewelry.monthly` | Essentiel | 14,99 EUR/mois | `jewelry_access` | Abo auto-renouvelable |
| `ecrin.premium.monthly` | Premium Mensuel | 24,99 EUR/mois | `premium_access` | Abo auto-renouvelable |
| `ecrin.premium.yearly` | Premium Annuel | 199,99 EUR/an | `premium_access` | Abo auto-renouvelable |

#### Offres de lancement promo (5)

| ID Produit ASC | Nom affiche | Prix | Campagne |
|----------------|-------------|------|----------|
| `ecrin.premium.yearly.launch50` | Fondateur -50% | 99,99 EUR/an | `yearly_50_first_100` |
| `ecrin.premium.yearly.launch30` | Early Bird -30% | 139,99 EUR/an | `yearly_30_next_100` |
| `ecrin.premium.yearly.launch20` | Lancement -20% | 159,99 EUR/an | `yearly_20_next_100` |
| `ecrin.premium.yearly.launch10` | Offre speciale -10% | 179,99 EUR/an | `yearly_10_next_100` |
| `ecrin.premium.monthly.launch10` | Mensuel -10% | 22,49 EUR/mois | `monthly_10_next_100` |

#### Credits consommables (4)

| ID Produit ASC | Nom affiche | Prix |
|----------------|-------------|------|
| `ecrin.credits.50` | 50 credits | 4,99 EUR |
| `ecrin.credits.100` | 100 credits | 9,99 EUR |
| `ecrin.credits.250` | 250 credits | 19,99 EUR |
| `ecrin.credits.500` | 500 credits | 35,99 EUR |

#### Entitlements RevenueCat (3)

| Entitlement | Produits associes | Acces |
|-------------|-------------------|-------|
| `jewelry_access` | `ecrin.jewelry.monthly` | Essayage bijoux (100/mois) |
| `premium_access` | Tous les premium + promos | Essayage complet + vetements + tenues |
| `lifetime_access` | *(acces interne dev/privilegie uniquement)* | Premium a vie, illimite |

### Checklist produits

- [ ] Creer les 3 abonnements principaux dans ASC (Monetization -> Subscriptions)
- [ ] Creer les 5 offres promo de lancement dans ASC
- [ ] Creer les 4 packs de credits consommables dans ASC
- [ ] Configurer les 3 entitlements dans RevenueCat
- [ ] Configurer les offerings dans RevenueCat (current offering + launch offerings)
- [ ] Verifier `EXPO_PUBLIC_RC_API_KEY_IOS` dans `.env`

### Tests Sandbox

- [ ] Creer comptes Apple Sandbox (ASC -> Users -> Sandbox Testers)
- [ ] Modifier storefront du compte test (FR/EN)
- [ ] Ajuster taux renouvellement abonnements (accelere pour tests)
- [ ] Simuler flux d'achat interrompus
- [ ] Effacer historique achats (iPhone -> Reglages -> App Store -> Compte Sandbox)
- [ ] Tester Partage familial (Sandbox Families, max 5 testeurs)
- [ ] Verifier que le paywall affiche les bons prix et labels
- [ ] Verifier la restauration d'achats

---

## Section 9 — Soumission finale App Review

### Notes pour App Review (a copier)

```
Ecrin Virtuel — application d'essayage virtuel de bijoux via IA et realite augmentee.

Compte demo (acces Premium complet) :
  Email : appreview@ecrinvirtuel.app
  Mot de passe : EcrinReview2026!

Pour tester :
1. Se connecter avec le compte demo ci-dessus
2. Ouvrir l'app -> onglet "Essayer"
3. Importer ou photographier un bijou
4. L'IA detecte et lance l'essayage AR automatiquement
Tester aussi : Mon Ecrin, Boutique, Communaute.

Contact : inferencevision@inferencevision.store
```

### Compte demo App Review

- [ ] **Creer le compte dans Supabase Auth** : `appreview@ecrinvirtuel.app` / `EcrinReview2026!` (Auto Confirm)
- [ ] **Ajouter `appreview@ecrinvirtuel.app` a `PRIVILEGED_EMAILS`** dans `.env` serveur
- [ ] **Ajouter `appreview@ecrinvirtuel.app` a `EXPO_PUBLIC_LIFETIME_PREMIUM_EMAILS`** dans `.env` client

### Contact App Review

- [x] Email : `inferencevision@inferencevision.store`
- [ ] **Prenom/Nom : a completer**
- [ ] **Telephone : a completer**

### Suivi post-soumission

- [ ] Soumission envoyee (delai moyen 24-48h)
- [ ] "Waiting for Review"
- [ ] "In Review"
- [ ] "Ready for Sale"
- [ ] Mettre a jour `appStoreUrl` dans `app.config.ts` (actuellement placeholder `id000000000`)

---

## Resume — Actions par priorite

### BLOQUANT (a faire avant soumission)

| # | Action | Responsable | Outil |
|---|--------|-------------|-------|
| 1 | Deployer `ecrinvirtuel-privacy.html` sur `ecrinvirtuel.app/privacy` | Dev/Ops | Hosting statique |
| 2 | Generer et uploader captures d'ecran iPhone 6.7" (5 min.) | Design | Xcode Simulator |
| 3 | Generer et uploader captures d'ecran iPad 12.9" | Design | Xcode Simulator |
| 4 | Creer les 14 produits IAP dans ASC | Produit | appstoreconnect.apple.com |
| 5 | Configurer entitlements + offerings dans RevenueCat | Produit | RevenueCat Dashboard |
| 6 | Declarer App Privacy dans ASC | Dev | appstoreconnect.apple.com |
| 7 | Remplir questionnaire Age Rating (4+) | Dev | appstoreconnect.apple.com |
| 8 | Completer contact App Review (nom + telephone) | Admin | appstoreconnect.apple.com |
| 9 | Lancer build production iOS | Dev | `eas build --platform ios --profile production` |
| 10 | Soumettre build vers ASC | Dev | `eas submit --platform ios --latest` |

### RECOMMANDE (avant ou juste apres soumission)

| # | Action | Outil |
|---|--------|-------|
| 11 | Tester IAP en Sandbox | iPhone + comptes Sandbox |
| 12 | Ajouter testeurs internes TestFlight | appstoreconnect.apple.com |
| 13 | Evaluer accessibilite (VoiceOver, contrastes) | Xcode Accessibility Inspector |
| 14 | Definir SKU dans ASC | appstoreconnect.apple.com |
| 15 | Configurer prix + disponibilite geographique | appstoreconnect.apple.com |

*Mis a jour le 02/04/2026 — Ecrin Virtuel v1.0.0*

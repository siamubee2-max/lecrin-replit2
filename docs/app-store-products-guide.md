# 🛍️ Guide Création Produits App Store Connect — Écrin Virtuel
## Stratégie Early Adopter (500 places)

> **Durée estimée : ~30 minutes dans App Store Connect**

---

## 📍 Accès direct

1. Va sur : [https://appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Sélectionne l'app **Écrin Virtuel**
3. Dans le menu gauche : **Monétisation → Abonnements**

---

## 🗂️ Groupe d'abonnements

Si tu n'as pas encore de groupe, crée-en un :
- **Nom** : `Premium Écrin Virtuel`
- **Nom d'affichage** : `Écrin Virtuel Premium`

---

## 📦 Les 5 produits à créer

> Chaque produit = un onglet "+" dans la liste des abonnements

---

### 1️⃣ Fondateur −50% (100 places)

| Champ | Valeur |
|---|---|
| **Product ID** | `ecrin.premium.yearly.launch50` |
| **Durée** | 1 an |
| **Prix** | Tier correspondant à **99,99 €** (cherche le tier EUR 99,99) |
| **Nom** | Écrin Premium Annuel — Offre Fondateur |
| **Description** | Accès Premium 1 an · 1 000 essayages · Prix fondateur garanti |
| **Promotional Offer Name** | Offre Fondateur −50% |

---

### 2️⃣ Early Bird −30% (100 places)

| Champ | Valeur |
|---|---|
| **Product ID** | `ecrin.premium.yearly.launch30` |
| **Durée** | 1 an |
| **Prix** | Tier correspondant à **139,99 €** |
| **Nom** | Écrin Premium Annuel — Early Bird |
| **Description** | Accès Premium 1 an · 1 000 essayages · Tarif lancement |
| **Promotional Offer Name** | Early Bird −30% |

---

### 3️⃣ Lancement −20% (100 places)

| Champ | Valeur |
|---|---|
| **Product ID** | `ecrin.premium.yearly.launch20` |
| **Durée** | 1 an |
| **Prix** | Tier correspondant à **159,99 €** |
| **Nom** | Écrin Premium Annuel — Lancement |
| **Description** | Accès Premium 1 an · 1 000 essayages · Offre limitée |
| **Promotional Offer Name** | Offre Lancement −20% |

---

### 4️⃣ Offre Spéciale −10% Annuel+Mensuel (100 places)

| Champ | Valeur |
|---|---|
| **Product ID — Annuel** | `ecrin.premium.yearly.launch10` |
| **Durée** | 1 an |
| **Prix** | Tier correspondant à **179,99 €** |
| **Nom** | Écrin Premium Annuel — Offre Spéciale |
| **Description** | Accès Premium 1 an · 1 500 essayages |
| **Promotional Offer Name** | Offre Spéciale −10% |

---

### 5️⃣ Offre Mensuel −10% (100 places)

| Champ | Valeur |
|---|---|
| **Product ID** | `ecrin.premium.monthly.launch10` |
| **Durée** | 1 mois |
| **Prix** | Tier correspondant à **22,49 €** |
| **Nom** | Écrin Premium Mensuel — Offre Lancement |
| **Description** | Accès Premium mensuel · Tarif de lancement |
| **Promotional Offer Name** | Mensuel −10% |

---

## 🔑 Variables d'environnement à ajouter dans `.env`

```env
# Produits App Store Connect — Offres de lancement
EXPO_PUBLIC_RC_PRODUCT_PREMIUM_YEARLY_50=ecrin.premium.yearly.launch50
EXPO_PUBLIC_RC_PRODUCT_PREMIUM_YEARLY_30=ecrin.premium.yearly.launch30
EXPO_PUBLIC_RC_PRODUCT_PREMIUM_YEARLY_20=ecrin.premium.yearly.launch20
EXPO_PUBLIC_RC_PRODUCT_PREMIUM_YEARLY_10=ecrin.premium.yearly.launch10
EXPO_PUBLIC_RC_PRODUCT_PREMIUM_MONTHLY_10=ecrin.premium.monthly.launch10
```

---

## 📱 RevenueCat — Configuration

Après avoir créé les produits dans App Store Connect :

1. Va sur [app.revenuecat.com](https://app.revenuecat.com)
2. Dans ton projet → **Products**
3. Ajoute les 5 Product IDs ci-dessus
4. Dans **Offerings** → Crée un offering `launch_early_access` avec les 5 produits
5. Configure les **Entitlements** `premium_access` sur chaque produit

---

## ✅ Checklist finale

- [ ] 5 produits créés dans App Store Connect
- [ ] Produits soumis à la review Apple (peut prendre 1-2 jours)
- [ ] Variables `.env` ajoutées
- [ ] Produits configurés dans RevenueCat
- [ ] Test d'achat avec un compte Sandbox
- [ ] Supabase table `launch_offer_claims` ✅ **DÉJÀ OPÉRATIONNELLE**

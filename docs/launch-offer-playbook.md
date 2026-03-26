# Launch Offer Playbook (100/100/100/200)

Document operationnel unique pour le lancement, le suivi, le rollback et l'analyse post-incident de l'offre promo sequentielle.

## 1) Ce qui est implemente dans le code

### Backend et DB

- Table des claims: `launchOfferClaims`
  - fichiers: `drizzle/schema.ts`, `drizzle/0010_launch_offer_claims.sql`
  - 1 claim unique par `clientId`
- Logique de campagne sequentielle:
  - ordre: `yearly_50_first_100` -> `yearly_25_next_100` -> `yearly_10_next_100` -> `monthly_10_next_200`
  - fichier: `server/db.ts`
- Endpoints tRPC:
  - `monetization.getLaunchOfferStatus`
  - `monetization.claimLaunchOffer`
  - fichier: `server/routers.ts`

### Frontend

- Hook d'orchestration offre:
  - `hooks/use-launch-offer.ts`
  - persistance `clientId` dans `AsyncStorage`
  - claim et lecture de campagne active
- Integration paywall:
  - `components/paywall/PaywallModal.tsx`
  - affichage campagne active
  - achat promo via SKU dedie si disponible
- Subscription hook:
  - `hooks/use-subscription.ts`
  - expose `purchaseStoreProduct(storeId)`
- Connexions d'ecran:
  - `app/(tabs)/tryon.tsx`
  - `app/(tabs)/settings.tsx`

### Webhook RevenueCat

- Mapping SKUs promo:
  - `ecrin.premium.yearly.launch50`
  - `ecrin.premium.yearly.launch25`
  - `ecrin.premium.yearly.launch10`
  - `ecrin.premium.monthly.launch10`
- fichier: `server/_core/index.ts`

## 2) Events PostHog (funnel complet)

### Events exposes

- `launch_offer_campaign_seen`
- `launch_offer_claimed`
- `launch_offer_exhausted`
- `launch_offer_purchase_success`
- `launch_offer_purchase_failed`

### Proprietes principales

- `campaignKey`
- `storeId` (si achat promo)
- `reason` pour les fails:
  - `claim_unavailable`
  - `store_product_missing`
  - `purchase_failed`
  - `unexpected_error`
- `source` (ex: `paywall`)

## 3) Variables d'environnement recommandees

Configurer en prod (ou fallback sur valeurs par defaut code):

- `EXPO_PUBLIC_RC_PRODUCT_PREMIUM_YEARLY_50=ecrin.premium.yearly.launch50`
- `EXPO_PUBLIC_RC_PRODUCT_PREMIUM_YEARLY_25=ecrin.premium.yearly.launch25`
- `EXPO_PUBLIC_RC_PRODUCT_PREMIUM_YEARLY_10=ecrin.premium.yearly.launch10`
- `EXPO_PUBLIC_RC_PRODUCT_PREMIUM_MONTHLY_10=ecrin.premium.monthly.launch10`

Webhook:

- `REVENUECAT_WEBHOOK_SECRET`

## 4) Dashboard PostHog (8 tuiles)

### Rangee 1 (Core)

1. `[Core] Launch Revenue Funnel (24h)`
2. `[Core] Claim Rate % (7j)`
3. `[Core] Purchase After Claim % (7j)`
4. `[Core] Promo Failure Rate % (7j)`

### Rangee 2 (Diag + Inventory)

5. `[Diag] Failures by Reason (daily)`
6. `[Diag] Success vs Failed (daily)`
7. `[Inv] Claims by Campaign (7j)`
8. `[Inv] Seen by Campaign (7j)`

### Formules KPI

- Claim rate = `launch_offer_claimed / launch_offer_campaign_seen`
- Purchase after claim = `launch_offer_purchase_success / launch_offer_claimed`
- Promo failure rate = `launch_offer_purchase_failed / (launch_offer_purchase_success + launch_offer_purchase_failed)`

## 5) Alertes recommandees

- `store_product_missing > 0 / 1h` -> critique
- `purchase_failed > 8 / 1h` -> alerte
- `failure rate > 25% / 24h` -> alerte
- `launch_offer_exhausted > 0 / 1h` -> info business

## 6) Runbook Go-Live (J-1 / J / J+1)

### J-1

- Verifier les 4 SKUs promo dans stores + RevenueCat
- Verifier entitlement `premium_access`
- Verifier variables env
- Verifier webhook
- Executer migration DB
- Ouvrir dashboard et alertes

### Jour J

- Deployer backend + app
- Faire 2 achats sandbox (annuel + mensuel)
- Verifier events live:
  - `campaign_seen`
  - `claimed`
  - `purchase_success`
- Verifier en DB la progression des claims

### J+1

- Analyser conversion claim -> success
- Analyser `purchase_failed` par `reason`
- Ajuster wording/ordre de plans si necessaire

## 7) Rollback express (5 actions)

1. Retirer les 4 SKUs promo de l'offering current RevenueCat
2. Revenir aux IDs standard (env) si besoin
3. Verifier webhook et logs
4. Verifier stabilisation PostHog
5. Noter heure + cause + ouvrir ticket correctif

## 8) Template post-mortem court

- Incident: titre, debut, fin, severite
- Impact: users, tunnel, perte estimee
- Detection: signal principal, event/reason dominant
- Root cause: 1 phrase + facteurs contributifs
- Resolution: mitigation + fix final + horodatage
- Prevention: 3 actions avec owner/date
- Validation: sandbox annuel/mensuel + device reel + 24h sans alerte

## 9) Tests automatises existants

- Fichier: `__tests__/launch-offers.test.ts`
- Couvre:
  - idempotence claim par `clientId`
  - sequence exacte `100/100/100/200`
  - epuisement total et compteurs finaux

Commande:

```bash
pnpm -s vitest run __tests__/launch-offers.test.ts
```

## 10) Checklist release rapide

- [ ] Migration DB executee
- [ ] SKUs promo actifs et mappes
- [ ] Offering current RevenueCat valide
- [ ] Webhook secret configure
- [ ] 2 achats sandbox OK
- [ ] Dashboard live OK
- [ ] Alertes configurees
- [ ] Runbook rollback partage a l'equipe


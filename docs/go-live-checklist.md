# Go-live checklist

Checklist operationnelle pour un deploiement progressif avec observabilite, A/B tests et controle des couts IA.

## 1) Pre-check production

- [ ] Variables production configurees:
  - [ ] `EXPO_PUBLIC_POSTHOG_API_KEY`
  - [ ] `EXPO_PUBLIC_POSTHOG_HOST`
- [ ] Feature flags PostHog crees:
  - [ ] `ab_home_cards_variant`
  - [ ] `ab_home_cta_variant`
  - [ ] `ab_daily_look_detail_variant`
- [ ] Dashboard "Executive Cost" disponible et lisible.
- [ ] Alertes actives:
  - [ ] Cout moyen par save (`avg(aiCostUsd)`)
  - [ ] Cout total journalier (`sum(aiCostUsd)`)
  - [ ] Conversion guide -> save

## 2) Verification events live (5 minutes)

- [ ] `ab_assignment`
- [ ] `ab_conversion`
- [ ] `tryon_generation_observed`
- [ ] `guided_tryon_completed`
- [ ] `look_saved`
- [ ] `tryon_quality_feedback`

## 3) Rollout progressif

- [ ] 10% active (heure: `__`)
- [ ] Controle +2h (fiabilite, cout, conversion)
- [ ] Controle +24h
- [ ] 50% active (heure: `__`)
- [ ] Controle +24h
- [ ] 100% active (heure: `__`)

## 4) Guardrails (stop immediate si)

- [ ] Failure rate try-on depasse le seuil defini.
- [ ] Cout moyen par save depasse le seuil defini.
- [ ] Conversion chute fortement vs baseline.

## 5) Procedure incident (si stop)

- [ ] Rollback vers variante stable.
- [ ] Message incident envoye dans le canal equipe.
- [ ] Owner incident assigne.
- [ ] ETA de correction communique.
- [ ] Re-lancement en 10% apres correctif.

## 6) Post-lancement (24-48h)

- [ ] Bilan conversion (avant/apres)
- [ ] Bilan cout IA (avant/apres)
- [ ] Bilan fiabilite (failure rate, latence)
- [ ] Decision: garder, ajuster, ou rollback partiel

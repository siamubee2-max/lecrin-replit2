# Maestro E2E Tests — Écrin Virtuel

Tests end-to-end automatisés avec [Maestro](https://maestro.mobile.dev) pour les parcours critiques de l'application.

## Prérequis

```bash
# Installer Maestro CLI
curl -Ls "https://get.maestro.mobile.dev" | bash
```

## Flows disponibles

| Fichier | Description | Tags |
|---|---|---|
| `01_tryon_flow.yaml` | Essayage virtuel complet (modèle → bijou → IA → résultat) | `essayage`, `critique` |
| `02_purchase_flow.yaml` | Paywall et abonnement RevenueCat | `achat`, `revenuecat`, `critique` |
| `03_community_post_flow.yaml` | Création de publication avec Snapshot | `communaute`, `snapshot` |
| `04_boutique_tryon_flow.yaml` | Boutique partenaire → Essayage pré-rempli | `boutique`, `partenaire` |

## Exécution

```bash
# Exécuter tous les flows
maestro test .maestro/

# Exécuter un flow spécifique
maestro test .maestro/01_tryon_flow.yaml

# Exécuter les flows critiques uniquement
maestro test .maestro/ --tag critique

# Exécuter sur un device iOS spécifique
maestro test .maestro/ --device <UDID>
```

## Intégration CI/CD (GitHub Actions)

```yaml
- name: Run Maestro E2E Tests
  uses: mobile-dev-inc/action-maestro-cloud@v1
  with:
    api-key: ${{ secrets.MAESTRO_CLOUD_API_KEY }}
    app-file: build/EcrinVirtuel.app
    workspace: .maestro/
    include-tags: critique
```

## Notes

- Les flows utilisent `optional:` pour les étapes conditionnelles (ex: onboarding)
- `clearState: true` remet l'app à zéro, `clearState: false` conserve la session
- Les timeouts sont en millisecondes (ex: `timeout: 30000` = 30 secondes)
- Pour les tests d'achat, utiliser le mode Sandbox Apple/Google

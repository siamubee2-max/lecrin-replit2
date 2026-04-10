# Recherche sur les Widgets iOS et Android pour Expo

## Solutions disponibles

### 1. @bittingz/expo-widgets (v3.0.2)
- Package npm: `@bittingz/expo-widgets`
- Supporte iOS et Android
- Nécessite du code natif (Swift pour iOS, Kotlin pour Android)
- Configuration via app.config.ts
- Partage de données via UserPreferences/SharedPreferences

### 2. @bacons/apple-targets (iOS uniquement)
- Pour les widgets iOS avec WidgetKit
- Utilisé par l'app Glow (exemple officiel Expo)
- Nécessite Swift pour le widget
- ExtensionStorage pour partager les données

### 3. react-native-android-widget (Android uniquement)
- Pour les widgets Android
- Permet de créer des widgets avec React Native JSX
- Plus simple que le code natif Kotlin

## Architecture choisie

Pour L'Écrin Virtuel, nous allons créer:

1. **Service de données partagées** (TypeScript)
   - Génère les suggestions du jour
   - Stocke les données dans un format compatible widgets

2. **Widget iOS** (Swift + WidgetKit)
   - Petite taille: météo + bijou recommandé
   - Moyenne taille: météo + événement + bijoux
   - Grande taille: suggestion complète

3. **Widget Android** (Kotlin + AppWidget)
   - Mêmes tailles que iOS
   - Utilise SharedPreferences pour les données

## Données à afficher dans le widget

- Météo actuelle (icône + température)
- Type d'événement du jour (icône)
- Bijou recommandé principal
- Conseil de style court
- Deep link vers l'app

## Configuration requise

### iOS (app.config.ts)
```typescript
[
  "@bittingz/expo-widgets",
  {
    ios: {
      src: "./widgets/ios",
      devTeamId: "TEAM_ID",
      mode: "production",
      entitlements: {
        "com.apple.security.application-groups": ["group.com.ecrin.jewelry.widget"]
      }
    }
  }
]
```

### Android (app.config.ts)
```typescript
android: {
  src: "./widgets/android",
  widgets: [
    {
      name: "DailySuggestionWidget",
      resourceName: "@xml/daily_suggestion_widget_info"
    }
  ]
}
```

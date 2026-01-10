# Recherche sur la détection faciale pour le positionnement des bijoux

## Google Cloud Vision API - Face Detection

L'API retourne des **landmarks** (points clés) avec leurs positions x, y, z:

### Landmarks disponibles:
- `LEFT_EYE` - Œil gauche (position: x, y, z)
- `RIGHT_EYE` - Œil droit
- `LEFT_OF_LEFT_EYEBROW` - Sourcil gauche (côté gauche)
- `RIGHT_OF_LEFT_EYEBROW` - Sourcil gauche (côté droit)
- `LEFT_OF_RIGHT_EYEBROW` - Sourcil droit (côté gauche)
- `RIGHT_OF_RIGHT_EYEBROW` - Sourcil droit (côté droit)
- `MIDPOINT_BETWEEN_EYES` - Point central entre les yeux
- `NOSE_TIP` - Bout du nez
- `UPPER_LIP` - Lèvre supérieure
- `LOWER_LIP` - Lèvre inférieure
- `MOUTH_LEFT` - Coin gauche de la bouche
- `MOUTH_RIGHT` - Coin droit de la bouche
- `MOUTH_CENTER` - Centre de la bouche
- `NOSE_BOTTOM_RIGHT` - Narine droite
- `NOSE_BOTTOM_LEFT` - Narine gauche
- `NOSE_BOTTOM_CENTER` - Centre du bas du nez
- `LEFT_EYE_TOP_BOUNDARY` - Haut de l'œil gauche
- `LEFT_EYE_RIGHT_CORNER` - Coin droit de l'œil gauche
- `LEFT_EYE_BOTTOM_BOUNDARY` - Bas de l'œil gauche
- `LEFT_EYE_LEFT_CORNER` - Coin gauche de l'œil gauche
- `RIGHT_EYE_TOP_BOUNDARY` - Haut de l'œil droit
- `RIGHT_EYE_RIGHT_CORNER` - Coin droit de l'œil droit
- `RIGHT_EYE_BOTTOM_BOUNDARY` - Bas de l'œil droit
- `RIGHT_EYE_LEFT_CORNER` - Coin gauche de l'œil droit
- `LEFT_EYEBROW_UPPER_MIDPOINT` - Milieu supérieur du sourcil gauche
- `RIGHT_EYEBROW_UPPER_MIDPOINT` - Milieu supérieur du sourcil droit
- `LEFT_EAR_TRAGION` - Tragus de l'oreille gauche
- `RIGHT_EAR_TRAGION` - Tragus de l'oreille droite
- `FOREHEAD_GLABELLA` - Glabelle (entre les sourcils)
- `CHIN_GNATHION` - Menton
- `CHIN_LEFT_GONION` - Mâchoire gauche
- `CHIN_RIGHT_GONION` - Mâchoire droite

### Informations supplémentaires:
- `rollAngle` - Rotation de la tête (inclinaison)
- `panAngle` - Rotation horizontale
- `tiltAngle` - Rotation verticale
- `boundingPoly` - Rectangle englobant le visage
- `fdBoundingPoly` - Rectangle englobant plus précis

## Stratégie pour le positionnement des bijoux

### Boucles d'oreilles:
- Utiliser `LEFT_EAR_TRAGION` et `RIGHT_EAR_TRAGION`
- Ajuster selon `rollAngle` pour l'inclinaison
- Calculer la taille selon la distance entre les yeux

### Colliers:
- Utiliser `CHIN_GNATHION` (menton) comme référence supérieure
- Estimer la position du cou en dessous du menton
- Ajuster selon `tiltAngle` pour la perspective

### Bagues:
- Nécessite détection des mains (pas disponible dans Vision API)
- Alternative: utiliser MediaPipe Hands ou position fixe

### Bracelets:
- Nécessite détection des poignets (pas disponible dans Vision API)
- Alternative: utiliser MediaPipe Pose ou position fixe

## Solution recommandée

Utiliser le LLM intégré au serveur avec vision pour analyser l'image et retourner les coordonnées des points clés. Le LLM peut:
1. Identifier le type de photo (visage, buste, main, etc.)
2. Retourner les coordonnées des zones appropriées pour chaque type de bijou
3. Calculer l'angle et l'échelle appropriés

Avantages:
- Pas besoin de clé API externe
- Plus flexible que les APIs de détection faciale
- Peut gérer tous les types de bijoux (pas seulement le visage)

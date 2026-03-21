# Script de Présentation — Écrin Virtuel
### Nouvelle version — Essayage virtuel propulsé par l'IA

---

> **Format suggéré :** Démonstration live ou vidéo de 3 à 5 minutes, avec captures d'écran de l'application en arrière-plan. Le présentateur suit les blocs dans l'ordre, en adaptant le rythme selon le contexte (pitch investisseur, démo client, présentation interne).

---

## 1. Accroche — Le problème qu'on résout

*(Ton : direct, empathique)*

Combien de fois avez-vous commandé un bijou, une paire de chaussures ou une tenue en ligne… et été déçu à la livraison ? La couleur ne correspondait pas, la taille était mauvaise, le rendu sur vous n'avait rien à voir avec la photo du site.

**Écrin Virtuel résout exactement ce problème.**

Grâce à l'intelligence artificielle, notre application permet à n'importe qui d'essayer virtuellement un article — bijou, vêtement, chaussure, accessoire — en quelques secondes, depuis son téléphone, sans se déplacer.

---

## 2. Présentation de l'application

*(Ton : fluide, montrer l'écran d'accueil)*

Écrin Virtuel est une application mobile iOS et Android. Son interface est pensée pour être intuitive : une navigation en onglets, un design épuré en noir et or, et un parcours utilisateur en trois étapes simples.

**Étape 1 — Je choisis mon article.** L'application propose quatre grandes catégories : bijoux, chaussures, vêtements et accessoires. Chaque catégorie est déclinée en sous-types précis. Les bijoux couvrent boucles d'oreilles, colliers, bracelets, bagues, chevilles et piercings. Les accessoires incluent sacs, ceintures, lunettes, écharpes, chapeaux et montres.

**Étape 2 — Je choisis mon modèle.** L'utilisateur peut importer sa propre photo ou choisir parmi notre galerie de mannequins. Cette galerie est désormais organisée en trois sections : mannequins féminins, masculins et non-genrés — pour que chacun puisse se projeter dans le résultat.

**Étape 3 — Je lance l'essayage.** En un tap, l'IA génère une image réaliste de l'article porté par le modèle choisi. Le résultat respecte l'éclairage de la photo originale, la pose, et les proportions du corps.

---

## 3. Les fonctionnalités phares

*(Ton : enthousiaste, montrer chaque feature en live)*

### Essayage intelligent par catégorie

Chaque catégorie dispose de son propre moteur de prompt IA, calibré pour un rendu optimal. Pour les chaussures et les vêtements, l'image générée est toujours en portrait plein corps — tête aux pieds — afin de voir l'article dans son contexte réel. Pour les bijoux et accessoires, le cadrage se resserre sur la zone concernée pour mettre en valeur les détails.

### Adaptation de l'éclairage

L'IA analyse la lumière de la photo du modèle — direction, intensité, température de couleur — et applique ce même éclairage à l'article essayé. Le résultat est cohérent : les ombres, les reflets et les matières s'intègrent naturellement dans la scène.

### Sélecteur de pose

Quatre poses sont disponibles : face, profil, marche et dos. Ce choix permet d'évaluer un article sous différents angles avant de l'acheter.

### Génération multi-variantes

L'utilisateur peut demander jusqu'à quatre variantes d'un même essayage en une seule génération. Il navigue ensuite entre les résultats par un simple swipe horizontal, et peut zoomer sur chaque image pour inspecter les détails.

### Mode Tenue Complète

C'est la fonctionnalité la plus puissante de cette version. L'utilisateur compose une tenue entière en sélectionnant jusqu'à dix articles simultanément : t-shirt, veste, pantalon, boucles d'oreilles, collier, bracelet, bague, deux accessoires et chaussures. L'IA génère ensuite une image unique où tous ces éléments sont portés ensemble, de manière cohérente et réaliste.

### Mes Looks — Sauvegarde et organisation

Chaque tenue générée peut être sauvegardée dans l'onglet **Mes Looks**. Lors de la sauvegarde, l'utilisateur donne un nom à sa tenue, choisit une occasion (Casual, Travail, Soirée, Sport, Fête) et une saison (Printemps, Été, Automne, Hiver). Ces métadonnées permettent ensuite de filtrer et retrouver rapidement ses looks favoris.

### Historique et partage

Tous les essayages sont automatiquement conservés dans l'historique, filtrable par catégorie. Depuis chaque carte, l'utilisateur peut relancer un essayage identique en un tap, ou partager l'image directement via les applications natives de son téléphone.

---

## 4. Inclusivité et représentation

*(Ton : engagé, montrer la galerie de mannequins)*

Nous avons fait un choix fort dans cette version : élargir notre galerie de mannequins pour qu'elle reflète la diversité de nos utilisateurs. La galerie corps entier propose désormais des profils féminins, masculins et non-genrés, avec différentes carnations et morphologies.

Parce que l'essayage virtuel n'a de sens que si chacun peut se voir dans le résultat.

---

## 5. La technologie derrière l'application

*(Ton : rassurant, crédible — pour un public technique ou investisseur)*

Écrin Virtuel est construit sur **React Native avec Expo**, ce qui garantit une expérience native identique sur iOS et Android à partir d'une seule base de code. Le moteur d'IA repose sur **Nano Banana 2**, un modèle multimodal de génération d'images de dernière génération, intégré via une API sécurisée côté serveur. Les données utilisateur (historique, looks sauvegardés) sont stockées localement sur l'appareil via AsyncStorage, sans dépendance à un compte en ligne.

L'architecture est conçue pour évoluer : ajout de nouvelles catégories d'articles, intégration de catalogues marchands, ou synchronisation cloud pour les utilisateurs connectés.

---

## 6. Conclusion et appel à l'action

*(Ton : confiant, mémorable)*

Écrin Virtuel, c'est la promesse d'un vestiaire illimité dans votre poche. Essayez avant d'acheter. Composez des tenues sans contrainte. Partagez vos looks avec vos proches.

La mode devient enfin accessible, inclusive et sans risque.

**Téléchargez Écrin Virtuel — et essayez tout, sans vous tromper.**

---

## Annexe — Données clés pour les slides

| Fonctionnalité | Détail |
|---|---|
| Catégories principales | Bijoux, Chaussures, Vêtements, Accessoires |
| Sous-types bijoux | 6 (boucles, collier, bracelet, bague, cheville, piercing) |
| Sous-types accessoires | 6 (sac, ceinture, lunettes, écharpe, chapeau, montre) |
| Slots Mode Tenue Complète | 10 articles simultanés |
| Variantes par génération | Jusqu'à 4 |
| Mannequins disponibles | 3 sections (Féminins / Masculins / Non-Genrés) |
| Poses disponibles | 4 (Face, Profil, Marche, Dos) |
| Métadonnées Mes Looks | Nom, Occasion (5 choix), Saison (4 choix) |
| Plateforme | iOS & Android (React Native / Expo) |
| Moteur IA | Nano Banana 2 (génération d'images multimodale) |

---

*Script rédigé par Manus AI — Mars 2026*

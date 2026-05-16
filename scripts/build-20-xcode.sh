#!/usr/bin/env bash
# =============================================================================
# L'Écrin Virtuel — Build 20 via Xcode (pipeline scriptable)
# =============================================================================
# Usage :
#   ./scripts/build-20-xcode.sh              # prebuild + pods + archive + export
#   ./scripts/build-20-xcode.sh --upload     # idem + upload altool vers ASC
#   ./scripts/build-20-xcode.sh --prebuild   # uniquement prebuild + pods
#   ./scripts/build-20-xcode.sh --archive    # skip prebuild, archive + export
#
# Pré-requis :
#   - macOS + Xcode 16.2+
#   - Apple Developer Team SPLML3CN76 connecté dans Xcode
#   - .env contient la VRAIE clé RevenueCat iOS (appl_xxx)
#   - APP_STORE_CONNECT_API_KEY_PATH export si --upload
# =============================================================================

set -euo pipefail

# Couleurs
R='\033[0;31m'; G='\033[0;32m'; Y='\033[1;33m'; B='\033[0;34m'; N='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Extrait dynamiquement le buildNumber depuis app.config.ts (ligne `buildNumber: "NN"`)
BUILD_NUMBER="$(grep -oE 'buildNumber: "[0-9]+"' "$PROJECT_ROOT/app.config.ts" | head -1 | grep -oE '[0-9]+' || echo '?')"
if [[ -z "$BUILD_NUMBER" || "$BUILD_NUMBER" == "?" ]]; then
  echo -e "\033[0;31m✗ Impossible d'extraire buildNumber depuis app.config.ts\033[0m"
  exit 1
fi

ARCHIVE_PATH="$HOME/Desktop/EcrinVirtuel-b${BUILD_NUMBER}.xcarchive"
IPA_EXPORT_PATH="$HOME/Desktop/EcrinVirtuel-b${BUILD_NUMBER}-ipa"
EXPORT_OPTIONS_PLIST="$PROJECT_ROOT/scripts/ExportOptions.plist"

MODE="${1:-all}"

# -----------------------------------------------------------------------------
# Preflight — tout ce qui doit être vrai AVANT de toucher à quoi que ce soit
# -----------------------------------------------------------------------------
preflight() {
  echo -e "${B}▶ Preflight check${N}"

  # OS
  if [[ "$(uname)" != "Darwin" ]]; then
    echo -e "${R}✗ macOS requis (Xcode ne tourne que sur Mac).${N}"
    exit 1
  fi

  # Xcode
  if ! command -v xcodebuild >/dev/null 2>&1; then
    echo -e "${R}✗ xcodebuild introuvable. Installe Xcode depuis l'App Store.${N}"
    exit 1
  fi
  XCODE_VER="$(xcodebuild -version | head -1 | awk '{print $2}')"
  echo -e "${G}✓${N} Xcode $XCODE_VER"
  # On veut au moins 16.2 pour iPadOS 26 SDK
  XMAJ="${XCODE_VER%%.*}"
  if [[ "$XMAJ" -lt 16 ]]; then
    echo -e "${Y}⚠  Xcode < 16.2 : iPadOS 26 SDK peut manquer — App Review testera sur iPadOS 26.4.1.${N}"
  fi

  # CocoaPods
  if ! command -v pod >/dev/null 2>&1; then
    echo -e "${R}✗ CocoaPods introuvable. Installe : sudo gem install cocoapods${N}"
    exit 1
  fi
  echo -e "${G}✓${N} CocoaPods $(pod --version)"

  # Node + npm
  if ! command -v node >/dev/null 2>&1; then
    echo -e "${R}✗ Node introuvable.${N}"; exit 1
  fi
  echo -e "${G}✓${N} Node $(node -v)"

  # .env file
  if [[ ! -f .env ]]; then
    echo -e "${R}✗ .env absent à la racine du projet.${N}"
    exit 1
  fi

  # RevenueCat key — BLOQUANT
  if grep -q 'EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_REPLACE_ME' .env; then
    echo -e "${R}✗ .env : EXPO_PUBLIC_REVENUECAT_IOS_KEY est encore le placeholder.${N}"
    echo -e "${R}  → Va sur https://app.revenuecat.com → Project → API keys${N}"
    echo -e "${R}  → Copie la 'Public SDK key — Apple App Store' (format appl_xxx)${N}"
    echo -e "${R}  → Remplace la ligne dans .env puis relance ce script.${N}"
    exit 1
  fi
  if ! grep -qE 'EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_[A-Za-z0-9]{20,}' .env; then
    echo -e "${R}✗ .env : EXPO_PUBLIC_REVENUECAT_IOS_KEY ne ressemble pas à un appl_xxx valide.${N}"
    echo -e "${R}  → Vérifie le format : appl_ suivi de 20+ caractères alphanumériques.${N}"
    exit 1
  fi
  echo -e "${G}✓${N} Clé RevenueCat iOS présente"

  # Supabase URL
  if ! grep -q 'EXPO_PUBLIC_SUPABASE_URL=https://' .env; then
    echo -e "${R}✗ .env : EXPO_PUBLIC_SUPABASE_URL manquant ou invalide.${N}"
    exit 1
  fi
  echo -e "${G}✓${N} Supabase URL présente"

  # app.config.ts buildNumber (auto-détecté)
  echo -e "${G}✓${N} buildNumber = $BUILD_NUMBER (auto-détecté)"

  # PrivacyInfo
  if ! grep -q 'privacyManifests' app.config.ts; then
    echo -e "${Y}⚠  app.config.ts : pas de privacyManifests — risque ITMS-91053.${N}"
  else
    echo -e "${G}✓${N} privacyManifests configuré"
  fi

  echo -e "${G}✓ Preflight OK${N}\n"
}

# -----------------------------------------------------------------------------
# Prebuild — génère ios/ depuis app.config.ts
# -----------------------------------------------------------------------------
do_prebuild() {
  echo -e "${B}▶ Expo prebuild --platform ios --clean${N}"

  if [[ -d ios ]]; then
    echo -e "${Y}  ios/ existe déjà — suppression (prebuild --clean)${N}"
    rm -rf ios
  fi

  npx expo prebuild --platform ios --clean --non-interactive
  echo -e "${G}✓ ios/ généré${N}"

  # Vérifie Info.plist
  INFO="ios/EcrinVirtuel/Info.plist"
  if [[ ! -f "$INFO" ]]; then
    INFO="$(find ios -maxdepth 3 -name Info.plist -path '*/EcrinVirtuel/*' | head -1)"
  fi
  if [[ -f "$INFO" ]]; then
    BV="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleVersion' "$INFO" 2>/dev/null || echo '?')"
    SV="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$INFO" 2>/dev/null || echo '?')"
    echo -e "${G}✓${N} Info.plist : version=$SV build=$BV"
    if [[ "$BV" != "$BUILD_NUMBER" ]]; then
      echo -e "${R}✗ Build number dans Info.plist = $BV, attendu $BUILD_NUMBER.${N}"
      exit 1
    fi
  fi

  # Pods
  echo -e "${B}▶ pod install --repo-update${N}"
  cd ios
  pod install --repo-update
  cd ..
  echo -e "${G}✓ Pods installés${N}\n"
}

# -----------------------------------------------------------------------------
# Archive — xcodebuild archive
# -----------------------------------------------------------------------------
do_archive() {
  echo -e "${B}▶ Archive : xcodebuild${N}"

  if [[ -d "$ARCHIVE_PATH" ]]; then
    echo -e "${Y}  Suppression de l'ancienne archive${N}"
    rm -rf "$ARCHIVE_PATH"
  fi

  # Détection du workspace TOP-LEVEL dans ios/ uniquement
  # (exclut ios/*.xcodeproj/project.xcworkspace qui est le workspace interne)
  WS="$(find ios -mindepth 1 -maxdepth 1 -type d -name '*.xcworkspace' | head -1)"
  if [[ -z "$WS" ]]; then
    echo -e "${R}✗ Aucun .xcworkspace top-level trouvé dans ios/ (as-tu bien fait pod install ?)${N}"
    exit 1
  fi

  # Détection robuste du scheme : on demande à xcodebuild la liste réelle
  # puis on prend le 1er qui n'est pas "Pods-..." ni vide.
  SCHEME="$(xcodebuild -workspace "$WS" -list 2>/dev/null \
    | awk '/Schemes:/{f=1;next} f && NF && !/^Pods-/{print; exit}' \
    | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  if [[ -z "$SCHEME" ]]; then
    # Fallback : nom du workspace sans extension
    SCHEME="$(basename "$WS" .xcworkspace)"
  fi
  echo -e "${G}✓${N} Workspace : $WS"
  echo -e "${G}✓${N} Scheme : $SCHEME"

  # Team ID & signing style forcés (expo prebuild ne les injecte pas dans le pbxproj)
  TEAM_ID="SPLML3CN76"

  set +e
  xcodebuild \
    -workspace "$WS" \
    -scheme "$SCHEME" \
    -configuration Release \
    -destination "generic/platform=iOS" \
    -archivePath "$ARCHIVE_PATH" \
    -allowProvisioningUpdates \
    DEVELOPMENT_TEAM="$TEAM_ID" \
    CODE_SIGN_STYLE=Automatic \
    archive 2>&1 | tee /tmp/xcodebuild-b${BUILD_NUMBER}.log | xcpretty 2>/dev/null
  RC=${PIPESTATUS[0]}
  set -e

  if [[ $RC -ne 0 ]]; then
    echo -e "${R}✗ xcodebuild archive a échoué (code $RC).${N}"
    echo -e "${Y}  Extract des erreurs :${N}"
    grep -E '(error:|fatal error|ld: |Undefined symbol|FAILED)' /tmp/xcodebuild-b${BUILD_NUMBER}.log | head -20 || true
    echo -e "${Y}  Log complet : /tmp/xcodebuild-b${BUILD_NUMBER}.log${N}"
    exit 1
  fi

  if [[ ! -d "$ARCHIVE_PATH" ]]; then
    echo -e "${R}✗ Archive échouée. Vérifie la console ci-dessus.${N}"
    exit 1
  fi
  echo -e "${G}✓ Archive créée : $ARCHIVE_PATH${N}\n"
}

# -----------------------------------------------------------------------------
# Export IPA
# -----------------------------------------------------------------------------
do_export() {
  echo -e "${B}▶ Export IPA${N}"

  if [[ ! -f "$EXPORT_OPTIONS_PLIST" ]]; then
    echo -e "${R}✗ $EXPORT_OPTIONS_PLIST manquant. Re-run ce script après 'git pull'.${N}"
    exit 1
  fi

  if [[ -d "$IPA_EXPORT_PATH" ]]; then
    rm -rf "$IPA_EXPORT_PATH"
  fi

  xcodebuild -exportArchive \
    -archivePath "$ARCHIVE_PATH" \
    -exportOptionsPlist "$EXPORT_OPTIONS_PLIST" \
    -exportPath "$IPA_EXPORT_PATH" \
    -allowProvisioningUpdates

  IPA="$(find "$IPA_EXPORT_PATH" -maxdepth 2 -name '*.ipa' | head -1)"
  if [[ -z "$IPA" ]]; then
    echo -e "${R}✗ Aucun .ipa trouvé dans $IPA_EXPORT_PATH${N}"
    exit 1
  fi
  echo -e "${G}✓ IPA exportée : $IPA${N}"
  echo -e "${G}  Taille : $(du -h "$IPA" | awk '{print $1}')${N}\n"
  export IPA
}

# -----------------------------------------------------------------------------
# Upload ASC (optionnel — --upload)
# -----------------------------------------------------------------------------
do_upload() {
  echo -e "${B}▶ Upload vers App Store Connect${N}"

  if [[ -z "${APP_STORE_CONNECT_API_KEY_PATH:-}" ]]; then
    echo -e "${R}✗ APP_STORE_CONNECT_API_KEY_PATH non défini.${N}"
    echo -e "${R}  → Génère une clé : ASC → Users and Access → Keys → + → 'App Manager'${N}"
    echo -e "${R}  → Télécharge le .p8 et crée ~/.appstoreconnect/AuthKey_XXX.p8.json${N}"
    echo -e "${R}  → export APP_STORE_CONNECT_API_KEY_PATH=~/.appstoreconnect/AuthKey_XXX.p8.json${N}"
    exit 1
  fi

  IPA="${IPA:-$(find "$IPA_EXPORT_PATH" -maxdepth 2 -name '*.ipa' | head -1)}"
  if [[ -z "$IPA" || ! -f "$IPA" ]]; then
    echo -e "${R}✗ IPA introuvable. Re-run sans --upload puis avec --upload.${N}"
    exit 1
  fi

  # Extrait key_id + issuer du JSON
  KEY_ID="$(python3 -c "import json,sys; print(json.load(open('$APP_STORE_CONNECT_API_KEY_PATH'))['key_id'])")"
  ISSUER="$(python3 -c "import json,sys; print(json.load(open('$APP_STORE_CONNECT_API_KEY_PATH'))['issuer_id'])")"

  xcrun altool --upload-app \
    --type ios \
    --file "$IPA" \
    --apiKey "$KEY_ID" \
    --apiIssuer "$ISSUER"

  echo -e "${G}✓ Upload ASC terminé. Va sur appstoreconnect.apple.com → Builds (processing 15-45 min).${N}\n"
}

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------
preflight

case "$MODE" in
  --prebuild)
    do_prebuild
    echo -e "${G}════ Prebuild terminé. 'open ios/*.xcworkspace' pour ouvrir Xcode. ════${N}"
    ;;
  --archive)
    do_archive
    do_export
    echo -e "${G}════ Archive + export terminés. IPA : $IPA_EXPORT_PATH ════${N}"
    ;;
  --upload)
    do_prebuild
    do_archive
    do_export
    do_upload
    ;;
  all|"")
    do_prebuild
    do_archive
    do_export
    echo -e "${G}════ Terminé. Pour uploader : $0 --upload ════${N}"
    echo -e "${B}Ou dans Xcode : open $ARCHIVE_PATH → Distribute App → Upload${N}"
    ;;
  *)
    echo "Usage : $0 [--prebuild|--archive|--upload]"
    exit 1
    ;;
esac

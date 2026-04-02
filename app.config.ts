// Load environment variables with proper priority (system > .env)
import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

// Bundle ID for App Store
const bundleId = "com.inferencevision.lecrinvirtuel";

// Deep link configuration
const DEEP_LINK_CONFIG = {
  // Custom URL scheme for the app (ecrinvirtuel://...)
  scheme: "ecrinvirtuel",
  // Associated domain for Universal Links (iOS) and App Links (Android)
  // This should be your website domain that hosts the apple-app-site-association file
  associatedDomain: "ecrinvirtuel.app",
};

const env = {
  // App branding
  appName: "Ecrin Virtuel",
  appSlug: "ecrin-mobile-app",
  // S3 URL of the app logo
  logoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663144691943/VejyhYwxBjsBsYcG.png",
  scheme: DEEP_LINK_CONFIG.scheme,
  iosBundleId: bundleId,
  androidPackage: bundleId,
};

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  owner: "tiwounti",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "automatic",
  newArchEnabled: true,

  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
    // Associated domains for Universal Links
    associatedDomains: [
      `applinks:${DEEP_LINK_CONFIG.associatedDomain}`,
      `webcredentials:${DEEP_LINK_CONFIG.associatedDomain}`,
    ],
    infoPlist: {
      NSCameraUsageDescription: "Écrin Virtuel utilise la caméra pour l'essayage virtuel de bijoux en réalité augmentée.",
      NSPhotoLibraryUsageDescription: "Écrin Virtuel accède à vos photos pour sauvegarder vos essayages virtuels.",
      NSPhotoLibraryAddUsageDescription: "Écrin Virtuel sauvegarde vos essayages virtuels dans votre galerie.",
      NSLocationWhenInUseUsageDescription:
        "Écrin Virtuel utilise votre position pour proposer des looks adaptés à la météo locale.",
      // App Transport Security for deep link redirects
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: false,
        NSAllowsArbitraryLoadsInWebContent: true,
        // Dev : appels http:// vers la machine (API sur :3000) depuis l’iPhone sur le même Wi‑Fi
        NSAllowsLocalNetworking: true,
      },
    },
    // entitlements: {
    //   "com.apple.security.application-groups": ["group.com.ecrin.jewelry.widget"],
    // },
    // App Store configuration
    config: {
      usesNonExemptEncryption: false,
    },
  },

  android: {
    adaptiveIcon: {
      backgroundColor: "#0A1A3B",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: env.androidPackage,
    permissions: [
      "POST_NOTIFICATIONS",
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE",
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
    ],
    intentFilters: [
      // Custom URL scheme (ecrinvirtuel://...)
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: env.scheme,
            host: "*",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
      // App Links (https://ecrinvirtuel.app/...)
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: DEEP_LINK_CONFIG.associatedDomain,
            pathPrefix: "/",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },

  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },

  plugins: [
    "expo-router",
    [
      "expo-audio",
      {
        microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone.",
      },
    ],
    [
      "expo-video",
      {
        supportsBackgroundPlayback: true,
        supportsPictureInPicture: true,
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#0A1A3B",
        dark: {
          backgroundColor: "#0A1A3B",
        },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
        },
      },
    ],
    // TEMPORAIREMENT DÉSACTIVÉ — Le widget nécessite une config App Group sur Apple Developer Portal
    // [
    //   "@bittingz/expo-widgets",
    //   {
    //     ios: {
    //       src: "./widgets/ios",
    //       devTeamId: "SPLML3CN76",
    //       mode: "production",
    //       xcode: {
    //         appGroupId: "group.com.ecrin.jewelry.widget",
    //       },
    //       moduleDependencies: [],
    //       useLiveActivities: false,
    //       frequentUpdates: false,
    //       entitlements: {
    //         "com.apple.security.application-groups": ["group.com.ecrin.jewelry.widget"],
    //       },
    //     },
    //     android: {
    //       src: "./widgets/android",
    //       widgets: [
    //         {
    //           name: "DailySuggestionWidget",
    //           resourceName: "@xml/daily_suggestion_widget_info",
    //         },
    //       ],
    //     },
    //   },
    // ],
  ],

  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },

  // Extra configuration for runtime access
  extra: {
    // Deep link base URL for sharing
    deepLinkBaseUrl: `https://${DEEP_LINK_CONFIG.associatedDomain}`,
    // App Store URLs (to be updated after app submission)
    appStoreUrl: "https://apps.apple.com/app/ecrin-virtuel/id000000000",
    playStoreUrl: "https://play.google.com/store/apps/details?id=com.inferencevision.lecrinvirtuel",
    // Supabase — injectées au build pour être disponibles via Constants.expoConfig.extra
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
    // RevenueCat
    revenueCatIosKey: process.env.EXPO_PUBLIC_RC_API_KEY_IOS ?? "",
    // EAS Project ID (required for eas build with dynamic config)
    eas: {
      projectId: "52023f23-2329-4fab-b9c9-a518b17f94f3",
    },
  },
};

export default config;

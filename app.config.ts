// Load environment variables with proper priority (system > .env)
import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

// Bundle ID for App Store
const bundleId = "com.ecrin.jewelry";

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
  logoUrl: "https://amafgweelzayrjzemdtq.supabase.co/storage/v1/object/public/app-assets/logo.png",
  scheme: DEEP_LINK_CONFIG.scheme,
  iosBundleId: bundleId,
  androidPackage: bundleId,
};

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
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
      NSFaceIDUsageDescription: "Écrin Virtuel utilise Face ID pour une authentification sécurisée.",
      NSLocationWhenInUseUsageDescription: "Écrin Virtuel utilise votre position pour les suggestions personnalisées de style.",
      // App Transport Security for deep link redirects
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: false,
        NSAllowsArbitraryLoadsInWebContent: true,
      },
    },
    // App Store configuration
    config: {
      usesNonExemptEncryption: false,
    },
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyTrackingDomains: [],
      NSPrivacyCollectedDataTypes: [],
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
          NSPrivacyAccessedAPITypeReasons: ["CA92.1"],
        },
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryFileTimestamp",
          NSPrivacyAccessedAPITypeReasons: ["C617.1"],
        },
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryDiskSpace",
          NSPrivacyAccessedAPITypeReasons: ["E174.1"],
        },
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategorySystemBootTime",
          NSPrivacyAccessedAPITypeReasons: ["35F9.1"],
        },
      ],
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
    permissions: ["POST_NOTIFICATIONS", "CAMERA", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"],
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
    "expo-apple-authentication",    [
      "expo-video",
      {
        supportsBackgroundPlayback: false,
        supportsPictureInPicture: false,
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
        ios: {
          privacyManifestAggregationEnabled: true,
        },
      },
    ],
    // Widget plugin disabled temporarily — incompatible with Expo SDK 54
    // TODO: Re-enable when @bittingz/expo-widgets supports SDK 54
    // [
    //   "@bittingz/expo-widgets",
    //   {
    //     ios: {
    //       src: "./widgets/ios",
    //       devTeamId: "TEAM_ID",
    //       mode: "production",
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
    // EAS project ID
    eas: {
      projectId: "52023f23-2329-4fab-b9c9-a518b17f94f3",
    },
    // Deep link base URL for sharing
    deepLinkBaseUrl: `https://${DEEP_LINK_CONFIG.associatedDomain}`,
    // App Store URLs (to be updated after app submission)
    appStoreUrl: "https://apps.apple.com/app/ecrin-virtuel/id000000000",
  },
};

export default config;

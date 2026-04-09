/**
 * Custom Expo config plugin to disable Android lint checks that
 * block the build due to iOS-only permission strings (NSCamera*, etc.)
 * being in locale files but not in the default strings.xml.
 *
 * This patches android/app/build.gradle to add:
 *   android { lintOptions { disable 'ExtraTranslation' } }
 */
const { withAppBuildGradle } = require("@expo/config-plugins");

const withAndroidLintFix = (config) => {
  return withAppBuildGradle(config, (mod) => {
    const contents = mod.modResults.contents;

    // Only patch if not already patched
    if (contents.includes("disable 'ExtraTranslation'")) {
      return mod;
    }

    // Insert lintOptions inside the android { } block
    const patched = contents.replace(
      /android\s*\{/,
      `android {
    lintOptions {
        disable 'ExtraTranslation'
    }`
    );

    mod.modResults.contents = patched;
    return mod;
  });
};

module.exports = withAndroidLintFix;

/**
 * Custom Expo config plugin to remove 'audio' from UIBackgroundModes in Info.plist.
 *
 * expo-audio automatically adds 'audio' to UIBackgroundModes, but Écrin Virtuel
 * does NOT play audio in the background. This plugin removes that entry to comply
 * with Apple guideline 2.5.4 (Software Requirements).
 */
const { withInfoPlist } = require("@expo/config-plugins");

const withNoBackgroundAudio = (config) => {
  return withInfoPlist(config, (mod) => {
    const plist = mod.modResults;

    if (Array.isArray(plist.UIBackgroundModes)) {
      plist.UIBackgroundModes = plist.UIBackgroundModes.filter(
        (mode) => mode !== "audio"
      );
      // If array is now empty, remove the key entirely to keep plist clean
      if (plist.UIBackgroundModes.length === 0) {
        delete plist.UIBackgroundModes;
      }
    }

    return mod;
  });
};

module.exports = withNoBackgroundAudio;

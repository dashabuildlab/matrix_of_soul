/**
 * Registers the Ionicons font with ReactFontManager on Android at app startup,
 * so every <Text fontFamily="ionicons"> renders correctly before React mounts.
 *
 * The expo-font plugin's iOS handler (withFontsIos) crashes when given the
 * object-form font config, so we keep expo-font in app.json with string-form
 * (iOS-only path copy + UIAppFonts) and use THIS plugin for the Android-only
 * addCustomFont injection.
 */
const { withFontsAndroid } = require('expo-font/plugin/build/withFontsAndroid');

module.exports = function withAndroidIoniconsFix(config) {
  return withFontsAndroid(config, [
    {
      fontFamily: 'ionicons',
      fontDefinitions: [
        { path: './assets/fonts/Ionicons.ttf', weight: 400 }
      ],
    },
  ]);
};

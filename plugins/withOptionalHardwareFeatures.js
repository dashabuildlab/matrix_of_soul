/**
 * Expo config plugin: declare hardware features as optional.
 *
 * When AndroidManifest.xml has <uses-permission android:name="…CAMERA"/> or
 * RECORD_AUDIO, Android implicitly adds <uses-feature ... android:required="true"/>
 * which makes Google Play exclude every device that lacks that hardware
 * (Android TV, many Chromebooks, etc.) — ~366 devices on this app.
 *
 * Declaring them explicitly with required="false" tells Play Store the app
 * works without the hardware and should be available on those devices too.
 */
const { withAndroidManifest } = require('expo/config-plugins');

const OPTIONAL_FEATURES = [
  'android.hardware.camera',
  'android.hardware.camera.front',
  'android.hardware.camera.any',
  'android.hardware.camera.autofocus',
  'android.hardware.camera.flash',
  'android.hardware.microphone',
  'android.hardware.location',
  'android.hardware.location.gps',
  'android.hardware.location.network',
  'android.hardware.touchscreen',
  'android.hardware.wifi',
  'android.hardware.bluetooth',
  'android.hardware.faketouch',
];

module.exports = function withOptionalHardwareFeatures(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    if (!manifest['uses-feature']) {
      manifest['uses-feature'] = [];
    }

    for (const feature of OPTIONAL_FEATURES) {
      // Skip if already declared
      const exists = manifest['uses-feature'].some(
        (f) => f.$ && f.$['android:name'] === feature,
      );
      if (exists) continue;

      manifest['uses-feature'].push({
        $: {
          'android:name': feature,
          'android:required': 'false',
        },
      });
    }

    return cfg;
  });
};

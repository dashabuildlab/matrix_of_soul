const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Replaces the massive Firestore C++ source pod with a prebuilt binary xcframework.
// Without this, CocoaPods clones ~400 MB of Firestore C++ source and EAS build
// machines run out of disk space even when Firestore is not used directly.
// See: https://github.com/invertase/firestore-ios-sdk-frameworks
const FIREBASE_VERSION = '12.10.0';
const FIRESTORE_OVERRIDE = `pod 'FirebaseFirestore', :git => 'https://github.com/invertase/firestore-ios-sdk-frameworks.git', :tag => '${FIREBASE_VERSION}'`;

module.exports = function withFirestorePrebuilt(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfile, 'utf8');

      if (!contents.includes('firestore-ios-sdk-frameworks')) {
        // Insert before the first `target '...' do` block
        contents = contents.replace(
          /(target ['"].+['"] do)/,
          `${FIRESTORE_OVERRIDE}\n\n$1`
        );
        fs.writeFileSync(podfile, contents);
      }

      return cfg;
    },
  ]);
};

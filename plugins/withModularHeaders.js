const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// WHY THIS EXISTS:
//
// @react-native-google-signin declares ExpoAdapterGoogleSignIn with
// `s.static_framework = true`. CocoaPods propagates this to its transitive
// deps (Firebase Swift pods). Firebase Swift pods depend on GoogleUtilities,
// which in "dynamic" mode can't be made static → pod install fails with:
//
//   "The following Swift pods cannot yet be integrated as static libraries:
//    FirebaseCoreInternal, FirebaseAuth, FirebaseCrashlytics, FirebaseSessions"
//
// Official RNFB fix: make ALL pods static consistently via
// `use_frameworks! :linkage => :static` + `$RNFirebaseAsStaticFramework = true`.
//
// $RNFirebaseAsStaticFramework must appear BEFORE use_frameworks! in the Podfile.
module.exports = function withModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfile, 'utf8');

      if (!contents.includes('RNFirebaseAsStaticFramework')) {
        contents = contents.replace(
          /(platform :ios.*\n)/,
          `$1$RNFirebaseAsStaticFramework = true\nuse_frameworks! :linkage => :static\n`
        );
        fs.writeFileSync(podfile, contents);
      }

      return cfg;
    },
  ]);
};

const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// WHY THIS EXISTS:
//
// @react-native-google-signin/ExpoAdapterGoogleSignIn has static_framework=true.
// This requires ALL Firebase Swift pods to also be static. The only correct
// way to satisfy this is to use static linkage for all pods uniformly.
//
// Official RNFB solution for Firebase + Google Sign-In co-existence:
//   https://rnfirebase.io/#expo-installation
//
// IMPORTANT: $RNFirebaseAsStaticFramework must come BEFORE use_frameworks!
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

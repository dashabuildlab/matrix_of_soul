const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// WHY THIS EXISTS:
//
// @react-native-google-signin declares ExpoAdapterGoogleSignIn with
// `s.static_framework = true`. CocoaPods propagates this static requirement
// to transitive deps (Firebase Swift pods). Firebase Swift pods depend on
// GoogleUtilities which can't be static in dynamic mode → pod install fails:
//
//   "The following Swift pods cannot yet be integrated as static libraries:
//    FirebaseCoreInternal, FirebaseAuth, FirebaseCrashlytics, FirebaseSessions"
//
// Surgical fix: disable static_framework only for ExpoAdapterGoogleSignIn
// via pre_install hook. Everything else stays as-is (dynamic by default).
// This avoids the risk of use_frameworks! :linkage => :static breaking
// other pods that don't support static linkage.
module.exports = function withModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfile, 'utf8');

      const hook = `
pre_install do |installer|
  installer.pod_targets.each do |pod|
    if pod.name == 'ExpoAdapterGoogleSignIn'
      pod.root_spec.static_framework = false
    end
  end
end
`;

      if (!contents.includes('ExpoAdapterGoogleSignIn')) {
        // Insert before the first `target '...' do` block
        contents = contents.replace(
          /(target ['"].+['"] do)/,
          `${hook}\n$1`
        );
        fs.writeFileSync(podfile, contents);
      }

      return cfg;
    },
  ]);
};

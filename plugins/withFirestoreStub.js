const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// FirebaseAnalytics/IdentitySupport → FirebaseFirestore (transitive dep).
// FirebaseFirestore pulls in ~2 GB of C++ source from firebase-ios-sdk,
// exhausting EAS build machine disk even though we never use Firestore.
//
// Override with a local no-op stub that satisfies the version constraint
// without cloning anything.
module.exports = function withFirestoreStub(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfile, 'utf8');

      if (!contents.includes('FirestoreStub') && !contents.includes('ios-stub')) {
        // Insert before the first `target '...' do` block
        contents = contents.replace(
          /(target ['"].+['"] do)/,
          `pod 'FirebaseFirestore', :path => '../ios-stub'\n\n$1`
        );
        fs.writeFileSync(podfile, contents);
      }

      return cfg;
    },
  ]);
};

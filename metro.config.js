const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const path = require('path');

const config = getDefaultConfig(__dirname, {
  isCSSEnabled: true,
});

// Enable web support
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Redirect .mjs (ESM) → .js (CJS) to avoid `import.meta` in Metro bundles.
// Zustand v5 ESM files use import.meta.env.MODE, which Metro can't handle.
// Also mock PushNotificationIOS: RCTPushNotificationManager native module does not exist
// in Expo Go (SDK 53+). metroImportAll iterates ALL react-native exports and triggers
// PushNotificationIOS initialisation which crashes. We never use PushNotificationIOS
// directly — expo-notifications uses ExpoNotificationsEmitter instead.
const PUSH_NOTIFICATION_IOS_PATH = path.join(__dirname, 'mocks', 'PushNotificationIOS.js');
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === 'react-native/Libraries/PushNotificationIOS/PushNotificationIOS' ||
    moduleName.endsWith('/PushNotificationIOS/PushNotificationIOS')
  ) {
    return { type: 'sourceFile', filePath: PUSH_NOTIFICATION_IOS_PATH };
  }

  const resolved = context.resolveRequest(context, moduleName, platform);
  if (resolved.type === 'sourceFile' && resolved.filePath.endsWith('.mjs')) {
    const fp = resolved.filePath;
    // e.g.  .../zustand/esm/middleware.mjs  →  .../zustand/middleware.js
    const candidates = [
      path.normalize(fp.replace(/[/\\]esm[/\\]([^/\\]+)\.mjs$/, path.sep + '$1.js')),
      path.normalize(fp.replace(/\.mjs$/, '.js')),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return { ...resolved, filePath: candidate };
      }
    }
  }
  return resolved;
};

// Use port 8083 to avoid conflicts
config.server = { ...config.server, port: 8083 };

module.exports = config;

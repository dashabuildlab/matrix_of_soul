import Constants from 'expo-constants';
import { Platform } from 'react-native';

const IOS_BUNDLE_ID  = 'com.matrixofsoul.myapp-';
const ANDROID_PKG    = 'com.matrixofsoul.app';

export interface UpdateInfo {
  latestVersion: string;
  storeUrl: string;
}

/** Returns UpdateInfo if a newer version is in the store, null otherwise. */
export async function checkForUpdate(): Promise<UpdateInfo | null> {
  try {
    const current = Constants.expoConfig?.version ?? '0.0.0';

    // iTunes Lookup API works for both platforms — same version number
    const res  = await fetch(
      `https://itunes.apple.com/lookup?bundleId=${IOS_BUNDLE_ID}`,
      { signal: AbortSignal.timeout(8000) },
    );
    const data = await res.json();
    if (!data.resultCount) return null;

    const result        = data.results[0];
    const latestVersion = result.version as string;

    if (!isNewer(latestVersion, current)) return null;

    const storeUrl = Platform.OS === 'android'
      ? `https://play.google.com/store/apps/details?id=${ANDROID_PKG}`
      : (result.trackViewUrl as string);

    return { latestVersion, storeUrl };
  } catch {
    return null;
  }
}

function isNewer(latest: string, current: string): boolean {
  const l = latest.split('.').map(Number);
  const c = current.split('.').map(Number);
  for (let i = 0; i < Math.max(l.length, c.length); i++) {
    const diff = (l[i] ?? 0) - (c[i] ?? 0);
    if (diff > 0) return true;
    if (diff < 0) return false;
  }
  return false;
}

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases, {
  LOG_LEVEL,
  PurchasesPackage,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';

// RevenueCat requires native modules — not available in Expo Go
const IS_EXPO_GO = Constants.appOwnership === 'expo';

const API_KEY_IOS     = 'appl_hJrxoQgGEcZqkGfSrtEKvYjgcFb';
const API_KEY_ANDROID = 'goog_VQRGrDajmesTXEdvwCYKEuuCGyJ';

export const ENTITLEMENT_ID = 'premium';

// ── Track initialization state ────────────────────────────────────────────────
let _configured = false;

export function initializePurchases(userId?: string | null) {
  // RevenueCat requires native store — skip entirely in Expo Go
  if (IS_EXPO_GO) return;
  try {
    if (_configured) {
      // SDK already configured — just switch the user identity
      if (userId) {
        Purchases.logIn(userId).catch(() => {});
      } else {
        Purchases.logOut().catch(() => {});
      }
      return;
    }
    const apiKey = Platform.OS === 'ios' ? API_KEY_IOS : API_KEY_ANDROID;
    Purchases.setLogLevel(LOG_LEVEL.ERROR);
    Purchases.configure({ apiKey, appUserID: userId ?? undefined });
    _configured = true;
  } catch {
    _configured = false;
  }
}

// ── Retry helper (network-only) ───────────────────────────────────────────────
const RETRYABLE_CODES: string[] = [
  PURCHASES_ERROR_CODE.NETWORK_ERROR,
  PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR,
  PURCHASES_ERROR_CODE.UNEXPECTED_BACKEND_RESPONSE_ERROR,
];

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  baseDelay = 800,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const code = String(err?.code ?? err?.userInfo?.readableErrorCode ?? '');
      if (!RETRYABLE_CODES.includes(code)) throw err;          // not retryable
      if (attempt < retries) {
        await new Promise<void>((r) => setTimeout(r, baseDelay * (attempt + 1)));
      }
    }
  }
  throw lastErr;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns the current RevenueCat offering, or `null` when:
 * - SDK is not yet configured (paywall opened before login)
 * - No offerings exist in the dashboard
 * - Unrecoverable error (caller can show a fallback UI)
 *
 * Automatically retries up to 2 times on network/backend errors.
 */
export async function getOfferings() {
  if (!_configured) return null;
  try {
    const offerings = await withRetry(() => Purchases.getOfferings());
    return offerings.current ?? null;
  } catch (err: any) {
    const code = String(err?.code ?? err?.userInfo?.readableErrorCode ?? '');
    // Configuration was lost between calls — mark it
    if (code === PURCHASES_ERROR_CODE.CONFIGURATION_ERROR) {
      _configured = false;
    }
    return null; // surface as empty offerings; caller shows fallback UI
  }
}

export async function purchasePackage(pkg: PurchasesPackage) {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  const isActive = customerInfo.entitlements.active[ENTITLEMENT_ID] != null;
  return { isActive, customerInfo };
}

export async function restorePurchases() {
  const customerInfo = await Purchases.restorePurchases();
  const isActive = customerInfo.entitlements.active[ENTITLEMENT_ID] != null;
  return { isActive, customerInfo };
}

export async function checkSubscriptionStatus(): Promise<boolean> {
  if (!_configured) return false;
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] != null;
  } catch {
    return false;
  }
}

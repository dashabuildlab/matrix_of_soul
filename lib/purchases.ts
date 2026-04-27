import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesPackage } from 'react-native-purchases';

const API_KEY_IOS = 'appl_hJrxoQgGEcZqkGfSrtEKvYjgcFb';
const API_KEY_ANDROID = 'goog_VQRGrDajmesTXEdvwCYKEuuCGyJ';

export const ENTITLEMENT_ID = 'premium';

export function initializePurchases(userId?: string | null) {
  const apiKey = Platform.OS === 'ios' ? API_KEY_IOS : API_KEY_ANDROID;
  Purchases.setLogLevel(LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey, appUserID: userId ?? undefined });
}

export async function getOfferings() {
  const offerings = await Purchases.getOfferings();
  return offerings.current;
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
  const customerInfo = await Purchases.getCustomerInfo();
  return customerInfo.entitlements.active[ENTITLEMENT_ID] != null;
}

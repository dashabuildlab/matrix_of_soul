/**
 * Safe mock for PushNotificationIOS.
 * RCTPushNotificationManager native module is not available in Expo Go (SDK 53+).
 * We do not use PushNotificationIOS directly — expo-notifications uses its own
 * ExpoNotificationsEmitter native module. This mock prevents metroImportAll from
 * crashing when it iterates all react-native exports in Expo Go.
 */

const PushNotificationIOS = {
  presentLocalNotification: () => {},
  scheduleLocalNotification: () => {},
  cancelAllLocalNotifications: () => {},
  removeAllDeliveredNotifications: () => {},
  getDeliveredNotifications: () => {},
  removeDeliveredNotifications: () => {},
  setApplicationIconBadgeNumber: () => {},
  getApplicationIconBadgeNumber: () => {},
  cancelLocalNotifications: () => {},
  getScheduledLocalNotifications: () => {},
  addEventListener: () => ({ remove: () => {} }),
  removeEventListener: () => {},
  requestPermissions: () => Promise.resolve({}),
  abandonPermissions: () => {},
  checkPermissions: () => {},
  getInitialNotification: () => Promise.resolve(null),
  FetchResult: { NewData: 'UIBackgroundFetchResultNewData', NoData: 'UIBackgroundFetchResultNoData', ResultFailed: 'UIBackgroundFetchResultFailed' },
  AuthorizationStatus: { NotDetermined: -1, Denied: 1, Authorized: 2, Provisional: 3, Ephemeral: 4 },
};

module.exports = PushNotificationIOS;

// Mock for Expo Go — RN 0.86's PushNotificationIOS requires a native module not in Go.
// This mock prevents the invariant at import time and allows the app to run in Expo Go.
// Real push is handled via expo-notifications in a dev build; in Expo Go we use mock tokens.
const mock = {
  presentLocalNotification: () => {},
  scheduleLocalNotification: () => {},
  cancelLocalNotifications: () => {},
  setApplicationIconBadgeNumber: () => {},
  getApplicationIconBadgeNumber: (cb) => cb && cb(0),
  cancelAllLocalNotifications: () => {},
  checkPermissions: (cb) => cb && cb({ alert: true, badge: true, sound: true }),
  requestPermissions: () => Promise.resolve({ alert: true, badge: true, sound: true }),
  abandonPermissions: () => {},
  getInitialNotification: () => Promise.resolve(null),
  addEventListener: () => ({ remove: () => {} }),
  removeEventListener: () => {},
  removeAllListeners: () => {},
  getScheduledLocalNotifications: (cb) => cb && cb([]),
};

module.exports = mock;
module.exports.default = mock;

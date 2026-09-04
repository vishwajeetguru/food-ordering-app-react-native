const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Mock PushNotificationIOS for Expo Go (RN 0.86 removed it from core; Go binary doesn't include the native module).
// Without this, `importAll` in Expo Go tries to load react-native/Libraries/PushNotificationIOS/PushNotificationIOS
// and throws `Invariant Violation: Native module not found`.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.includes('PushNotificationIOS')) {
    return {
      filePath: require.resolve('./src/mocks/PushNotificationIOS.mock.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

import { Platform, PermissionsAndroid } from 'react-native';
import { authService } from '../services/authService';

let messaging = null;
let notifee = null;

try {
  messaging = require('@react-native-firebase/messaging').default;
} catch (_) {}

try {
  notifee = require('@notifee/react-native').default;
} catch (_) {}

/**
 * Request notification permissions across Android (API 33+) and iOS
 */
export const requestNotificationPermission = async () => {
  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        return false;
      }
    }

    if (messaging) {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      return enabled;
    }
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Register device FCM token with backend API
 */
export const registerFCMToken = async () => {
  try {
    if (!messaging) return null;

    const token = await messaging().getToken();
    if (token) {
      // Fire-and-forget backend registration
      authService.registerDeviceToken(token).catch(() => {});
      return token;
    }
  } catch (_) {}
  return null;
};

/**
 * Set up foreground notification listener using notifee if available
 */
export const setupNotificationListeners = () => {
  if (!messaging) return () => {};

  // Create channel for Android
  if (notifee && Platform.OS === 'android') {
    notifee.createChannel({
      id: 'high_importance_notifications',
      name: 'High Importance Notifications',
      importance: 4, // HIGH
    }).catch(() => {});
  }

  // Foreground messages
  const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
    if (notifee && remoteMessage.notification) {
      try {
        await notifee.displayNotification({
          title: remoteMessage.notification.title,
          body: remoteMessage.notification.body,
          android: {
            channelId: 'high_importance_notifications',
            smallIcon: 'ic_launcher',
            pressAction: { id: 'default' },
          },
        });
      } catch (_) {}
    }
  });

  // Background message handler
  try {
    messaging().setBackgroundMessageHandler(async () => {});
  } catch (_) {}

  return unsubscribeForeground;
};

export default {
  requestNotificationPermission,
  registerFCMToken,
  setupNotificationListeners,
};

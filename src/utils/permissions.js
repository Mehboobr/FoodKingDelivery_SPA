import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import Toast from 'react-native-toast-message';
import { Strings } from '../constants/strings';

/**
 * Requests location permission across Android and iOS
 * Handles:
 * - Granted -> returns true
 * - Denied -> shows error toast and returns false
 * - Permanently denied -> shows Alert with Open Settings button and returns false
 */
export const requestLocationPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Encore Driver uses your location to order delivery stops, navigate, and record arrival. Tracking runs only while you are on an active route.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      }

      if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        Alert.alert(
          'Location Permission',
          'Location permission is permanently denied. Please enable it in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return false;
      }

      Toast.show({
        type: 'error',
        text1: Strings.locationServiceDenied || 'Location service is denied!',
      });
      return false;
    } catch (e) {
      // Fallback
      return true;
    }
  }

  // On iOS, system handles prompt automatically when app requests or opens map
  return true;
};

/**
 * Opens navigation/directions to target coordinates
 */
export const openDirections = async (latitude, longitude) => {
  if (!latitude || !longitude) {
    Toast.show({ type: 'error', text1: 'No coordinates available' });
    return;
  }

  const hasPermission = await requestLocationPermission();
  if (!hasPermission) return;

  const latLng = `${latitude},${longitude}`;
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${latLng}&travelmode=driving`;
  const nativeScheme = Platform.select({
    ios: `maps:0,0?q=${latLng}`,
    android: `geo:0,0?q=${latLng}`,
  });

  try {
    const canOpenGoogle = await Linking.canOpenURL(googleUrl);
    if (canOpenGoogle) {
      await Linking.openURL(googleUrl);
      return;
    }
  } catch (_) {}

  try {
    await Linking.openURL(nativeScheme);
  } catch (_) {
    Toast.show({ type: 'error', text1: 'Could not open maps application' });
  }
};

export default {
  requestLocationPermission,
  openDirections,
};

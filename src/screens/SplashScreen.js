import React, { useEffect } from 'react';
import { View, Image, StyleSheet, StatusBar } from 'react-native';
import { Colors } from '../constants/colors';
import Images from '../assets/images/index';
import useAuthStore from '../store/authStore';
import useConfigStore from '../store/configStore';

const SplashScreen = ({ navigation }) => {
  const { loadFromStorage, refreshToken, logout } = useAuthStore();
  const { fetchConfig, fetchLanguages } = useConfigStore();

  useEffect(() => {
    const init = async () => {
      // Prefetch config and languages in parallel
      fetchConfig();
      fetchLanguages();

      await new Promise((r) => setTimeout(r, 2000));

      try {
        const loggedIn = await loadFromStorage();
        if (loggedIn) {
          try {
            await refreshToken();
            navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
          } catch (_) {
            await logout();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          }
        } else {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      } catch (_) {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <Image source={Images.splashLogo} style={styles.logo} resizeMode="contain" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
});

export default SplashScreen;

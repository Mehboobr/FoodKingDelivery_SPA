import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { Colors } from '../constants/colors';
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
      <View style={styles.mark}><Text style={styles.markText}>E</Text></View>
      <Text style={styles.name}>Encore Driver</Text>
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
  mark: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: {
    color: Colors.white,
    fontFamily: 'Rubik-Bold',
    fontSize: 40,
  },
  name: {
    marginTop: 16,
    color: Colors.font,
    fontFamily: 'Rubik-Bold',
    fontSize: 28,
  },
});

export default SplashScreen;

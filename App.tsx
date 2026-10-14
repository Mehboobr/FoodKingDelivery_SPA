/**
 * FoodKing Delivery Boy App
 * React Native — JavaScript
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import AppNavigator from './src/navigation/AppNavigator';
import { Colors } from './src/constants/colors';
import { toastConfig } from './src/components/common/Toast';
import './src/localization/i18n';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgColor} translucent={false} />
      <AppNavigator />
      <Toast config={toastConfig} />
    </SafeAreaProvider>
  );
}

export default App;

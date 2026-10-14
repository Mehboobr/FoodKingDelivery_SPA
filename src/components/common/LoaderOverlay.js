import React from 'react';
import { View, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { Colors } from '../../constants/colors';

const LoaderOverlay = ({ visible }) => {
  if (!visible) return null;
  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
});

export default LoaderOverlay;

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { BorderRadius, Spacing } from '../../constants/spacing';

export const toastConfig = {
  success: (props) => (
    <View style={[styles.container, styles.successContainer]}>
      <Text style={styles.icon}>✓</Text>
      <View style={styles.textWrapper}>
        <Text style={styles.titleText}>{props.text1}</Text>
        {props.text2 ? <Text style={styles.subText}>{props.text2}</Text> : null}
      </View>
    </View>
  ),

  error: (props) => (
    <View style={[styles.container, styles.errorContainer]}>
      <Text style={styles.icon}>✕</Text>
      <View style={styles.textWrapper}>
        <Text style={styles.titleText}>{props.text1}</Text>
        {props.text2 ? <Text style={styles.subText}>{props.text2}</Text> : null}
      </View>
    </View>
  ),

  info: (props) => (
    <View style={[styles.container, styles.infoContainer]}>
      <Text style={styles.icon}>ℹ</Text>
      <View style={styles.textWrapper}>
        <Text style={styles.titleText}>{props.text1}</Text>
        {props.text2 ? <Text style={styles.subText}>{props.text2}</Text> : null}
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  container: {
    width: '90%',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  successContainer: {
    backgroundColor: Colors.success, // #2AC769
  },
  errorContainer: {
    backgroundColor: Colors.error, // #FB4E4E
  },
  infoContainer: {
    backgroundColor: Colors.darkBlue,
  },
  icon: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
    marginRight: Spacing.sm,
  },
  textWrapper: {
    flex: 1,
  },
  titleText: {
    ...Typography.bodyMedium,
    color: Colors.white,
    fontFamily: 'Rubik-Medium',
  },
  subText: {
    ...Typography.small,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
});

export const showSuccess = (text1, text2) =>
  Toast.show({ type: 'success', text1, text2 });

export const showError = (text1, text2) =>
  Toast.show({ type: 'error', text1, text2 });

export default Toast;

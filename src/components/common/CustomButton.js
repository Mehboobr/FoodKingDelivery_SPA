import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator, StyleSheet, View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { BorderRadius } from '../../constants/spacing';

/**
 * CustomButton
 * Props: title, onPress, loading, disabled, variant, style, textStyle
 * variant: 'primary' | 'outline' | 'success' | 'danger' | 'secondary'
 */
const CustomButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const isDisabled = disabled || loading;

  const containerStyle = [
    styles.base,
    styles[variant] || styles.primary,
    isDisabled && styles.disabled,
    style,
  ];

  const labelStyle = [
    styles.label,
    styles[`${variant}Text`] || styles.primaryText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? Colors.primary : Colors.white} size="small" />
      ) : (
        <Text style={labelStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  primaryText: {
    ...Typography.bodyMedium,
    fontSize: 16,
    color: Colors.white,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  outlineText: {
    ...Typography.bodyMedium,
    fontSize: 16,
    color: Colors.primary,
  },
  success: {
    backgroundColor: Colors.success,
  },
  successText: {
    ...Typography.bodyMedium,
    fontSize: 16,
    color: Colors.white,
  },
  danger: {
    backgroundColor: Colors.error,
  },
  dangerText: {
    ...Typography.bodyMedium,
    fontSize: 16,
    color: Colors.white,
  },
  secondary: {
    backgroundColor: Colors.itemBg,
  },
  secondaryText: {
    ...Typography.bodyMedium,
    fontSize: 16,
    color: Colors.font,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
  },
});

export default CustomButton;

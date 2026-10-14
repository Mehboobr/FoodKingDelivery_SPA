import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { BorderRadius, Spacing } from '../../constants/spacing';

/**
 * CustomInput
 * Props: label, value, onChangeText, error, secureTextEntry,
 *        onToggleSecure, keyboardType, placeholder, ...rest
 */
const CustomInput = ({
  label,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  onToggleSecure,
  keyboardType = 'default',
  placeholder,
  style,
  inputStyle,
  rightElement,
  ...rest
}) => {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? Colors.error
    : focused
    ? Colors.primary
    : Colors.divider;

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputRow, { borderColor }]}>
        <TextInput
          style={[styles.input, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="none"
          {...rest}
        />
        {onToggleSecure ? (
          <TouchableOpacity
            onPress={onToggleSecure}
            style={styles.eyeButton}
            accessibilityLabel={secureTextEntry ? 'Show password' : 'Hide password'}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.eyeText}>{secureTextEntry ? '👁' : '🙈'}</Text>
          </TouchableOpacity>
        ) : null}
        {rightElement || null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.base,
  },
  label: {
    ...Typography.bodyMedium,
    color: Colors.font,
    marginBottom: Spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.font,
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 4,
  },
  eyeText: {
    fontSize: 18,
  },
  errorText: {
    ...Typography.regular,
    color: Colors.error,
    marginTop: 4,
    marginLeft: 2,
  },
});

export default CustomInput;

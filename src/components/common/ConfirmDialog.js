import React, { useEffect, useRef } from 'react';
import {
  Modal, View, Text, Image, TouchableOpacity, StyleSheet,
  Animated, Dimensions,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { BorderRadius, Spacing, Shadows } from '../../constants/spacing';
import CustomButton from './CustomButton';

const { width } = Dimensions.get('window');

/**
 * ConfirmDialog
 * Props: visible, onClose, onConfirm, title, description, image,
 *        confirmText, cancelText, extraContent, loading
 */
const ConfirmDialog = ({
  visible,
  onClose,
  onConfirm,
  title,
  description,
  image,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  extraContent,
  loading = false,
  confirmVariant = 'primary',
}) => {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.85);
      opacity.setValue(0);
    }
  }, [visible, scale, opacity]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Animated.View style={[styles.dialog, { transform: [{ scale }], opacity }]}>
          {image ? (
            <Image source={image} style={styles.image} resizeMode="contain" />
          ) : null}
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {description ? <Text style={styles.description}>{description}</Text> : null}
          {extraContent || null}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn]}
              onPress={onClose}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={cancelText}
            >
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.btn,
                confirmVariant === 'success' ? styles.successBtn : styles.confirmBtn,
                loading && { opacity: 0.7 },
              ]}
              onPress={onConfirm}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={confirmText}
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  dialog: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    ...Shadows.strong,
  },
  image: {
    width: 100,
    height: 100,
    marginBottom: Spacing.base,
  },
  title: {
    ...Typography.heading,
    color: Colors.font,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.base,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    width: '100%',
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: Colors.itemBg,
  },
  cancelText: {
    ...Typography.bodyMedium,
    color: Colors.font,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
  },
  successBtn: {
    backgroundColor: Colors.success,
  },
  confirmText: {
    ...Typography.bodyMedium,
    color: Colors.white,
  },
});

export default ConfirmDialog;

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

/**
 * EmptyState
 * Props: image (require()), title, subtitle
 */
const EmptyState = ({ image, title, subtitle }) => (
  <View style={styles.container}>
    {image ? (
      <Image source={image} style={styles.image} resizeMode="contain" />
    ) : null}
    {title ? <Text style={styles.title}>{title}</Text> : null}
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    paddingTop: Spacing.xxxl,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.largeBold,
    color: Colors.font,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default EmptyState;

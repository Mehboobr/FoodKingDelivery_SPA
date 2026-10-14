import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusColors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { BorderRadius, Spacing } from '../../constants/spacing';

/**
 * OrderStatusBadge
 * Props: status (number), statusName (string)
 */
const OrderStatusBadge = ({ status, statusName }) => {
  const colors = StatusColors[status] || { bg: '#EEE', text: '#666' };

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]} numberOfLines={1}>
        {statusName || String(status)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    alignSelf: 'flex-start',
  },
  text: {
    ...Typography.small,
    fontFamily: 'Rubik-Medium',
    fontSize: 11,
  },
});

export default OrderStatusBadge;

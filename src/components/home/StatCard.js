import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { BorderRadius, Spacing, Shadows } from '../../constants/spacing';
import { Strings } from '../../constants/strings';
import { StatCardSkeleton } from '../common/SkeletonLoader';
import SvgIcon from '../common/SvgIcon';

/**
 * StatCard component
 * Props: iconName, count, label, bgColor, loading
 */
const StatCard = ({ iconName, count, label, bgColor, loading }) => {
  if (loading) return null;

  return (
    <View style={[styles.card, { backgroundColor: bgColor }]}>
      <View style={styles.iconBox}>
        <SvgIcon name={iconName} width={32} height={32} />
      </View>
      <Text style={styles.count}>{count ?? 0}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

export const StatsRow = ({ countData, loading }) => {
  if (loading) return <StatCardSkeleton />;

  return (
    <View style={styles.row}>
      <View style={[styles.card, { backgroundColor: Colors.cardGreen }]}>
        <View style={styles.iconBox}>
          <SvgIcon name="order_complete" width={32} height={32} />
        </View>
        <Text style={styles.count}>{countData?.total_delivered ?? 0}</Text>
        <Text style={styles.label}>{Strings.completeDelivery || 'Complete\nDelivery'}</Text>
      </View>
      <View style={[styles.card, { backgroundColor: Colors.cardSky }]}>
        <View style={styles.iconBox}>
          <SvgIcon name="return_delivery" width={32} height={32} />
        </View>
        <Text style={styles.count}>{countData?.total_returned ?? 0}</Text>
        <Text style={styles.label}>{Strings.returnDelivery || 'Return\nDelivery'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    gap: Spacing.md,
  },
  card: {
    flex: 1,
    height: 132,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    ...Shadows.card,
  },
  iconBox: {
    marginBottom: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontFamily: 'Rubik-Black',
    fontSize: 26,
    color: Colors.font,
    lineHeight: 32,
  },
  label: {
    ...Typography.regular,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 16,
  },
});

export default StatCard;

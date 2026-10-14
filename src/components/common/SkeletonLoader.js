import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing } from '../../constants/spacing';

const ShimmerItem = ({ width, height, style }) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <Animated.View
      style={[
        { width, height, backgroundColor: Colors.itemBg, borderRadius: BorderRadius.md, opacity },
        style,
      ]}
    />
  );
};

export const StatCardSkeleton = () => (
  <View style={styles.row}>
    <ShimmerItem width="48%" height={132} style={{ borderRadius: BorderRadius.lg }} />
    <ShimmerItem width="48%" height={132} style={{ borderRadius: BorderRadius.lg }} />
  </View>
);

export const OrderCardSkeleton = () => (
  <View style={styles.card}>
    <View style={styles.cardRow}>
      <ShimmerItem width="55%" height={16} />
      <ShimmerItem width="25%" height={20} style={{ borderRadius: BorderRadius.pill }} />
    </View>
    <ShimmerItem width="40%" height={13} style={{ marginTop: 10 }} />
    <ShimmerItem width="70%" height={13} style={{ marginTop: 8 }} />
    <View style={[styles.cardRow, { marginTop: 14 }]}>
      <ShimmerItem width="45%" height={36} style={{ borderRadius: BorderRadius.pill }} />
      <ShimmerItem width="45%" height={36} style={{ borderRadius: BorderRadius.pill }} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default ShimmerItem;

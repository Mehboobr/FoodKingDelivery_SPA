import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { BorderRadius, Spacing, Shadows } from '../../constants/spacing';
import OrderStatusBadge from '../common/OrderStatusBadge';
import { Strings } from '../../constants/strings';
import SvgIcon from '../common/SvgIcon';
import { openDirections } from '../../utils/permissions';

export const handleGetDirection = async (latitude, longitude) => {
  await openDirections(latitude, longitude);
};

/**
 * ActiveOrderCard
 * Props: order, onSeeDetails, loadingDetails
 */
const ActiveOrderCard = ({ order, onSeeDetails, loadingDetails }) => {
  const addr = order?.order_address;

  return (
    <View style={styles.card}>
      {/* Row 1: Order ID + Status Badge */}
      <View style={styles.row}>
        <View style={styles.orderIdRow}>
          <Text style={styles.orderIdLabel}>{Strings.orderId}</Text>
          <Text style={styles.orderIdValue} numberOfLines={1}>
            {order?.order_serial_no}
          </Text>
        </View>
        <OrderStatusBadge status={order?.status} statusName={order?.status_name} />
      </View>

      {/* Row 2: Date/Time */}
      <Text style={styles.dateText}>{order?.order_datetime}</Text>

      {/* Row 3: Address with SVG location pin */}
      <View style={styles.addressRow}>
        <View style={styles.pinWrapper}>
          <SvgIcon name="location" width={16} height={16} color={Colors.primary} />
        </View>
        <Text style={styles.addressText} numberOfLines={2}>
          {addr?.address || '—'}
        </Text>
      </View>

      {/* Row 4: Action Buttons */}
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={onSeeDetails}
          disabled={loadingDetails}
          activeOpacity={0.8}
          accessibilityLabel={`${Strings.seeDetails} for order ${order?.order_serial_no}`}
          accessibilityRole="button"
        >
          <Text style={styles.outlineBtnText}>{Strings.seeDetails}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => handleGetDirection(addr?.latitude, addr?.longitude)}
          activeOpacity={0.8}
          accessibilityLabel={`${Strings.getDirection} for order ${order?.order_serial_no}`}
          accessibilityRole="button"
        >
          <Text style={styles.primaryBtnText}>{Strings.getDirection}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  orderIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  orderIdLabel: {
    ...Typography.regular,
    color: Colors.textMuted,
  },
  orderIdValue: {
    ...Typography.bodyMedium,
    color: Colors.darkBlue,
    flexShrink: 1,
  },
  dateText: {
    ...Typography.regular,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  pinWrapper: {
    marginRight: 6,
    marginTop: 2,
  },
  addressText: {
    ...Typography.body,
    color: Colors.font,
    flex: 1,
    lineHeight: 20,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  outlineBtn: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.pill,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    ...Typography.bodyMedium,
    fontSize: 13,
    color: Colors.font,
  },
  primaryBtn: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    ...Typography.bodyMedium,
    fontSize: 13,
    color: Colors.white,
  },
});

export default ActiveOrderCard;

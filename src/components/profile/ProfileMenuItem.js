import React from 'react';
import {
  TouchableOpacity, View, Text, StyleSheet,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import SvgIcon from '../common/SvgIcon';

/**
 * ProfileMenuItem
 * Props:
 * - icon: string (SvgIcon name) or ReactNode
 * - label: string
 * - onPress: func
 * - isDanger: bool
 * - rightLabel: string
 */
const ProfileMenuItem = ({ icon, label, onPress, isDanger = false, rightLabel }) => (
  <TouchableOpacity
    style={styles.row}
    onPress={onPress}
    activeOpacity={0.7}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    <View style={[styles.iconBox, isDanger && styles.dangerIconBox]}>
      {typeof icon === 'string' ? (
        <SvgIcon
          name={icon}
          width={20}
          height={20}
          color={isDanger ? Colors.error : Colors.primary}
        />
      ) : (
        icon
      )}
    </View>
    <Text style={[styles.label, isDanger && styles.dangerLabel]}>{label}</Text>
    <View style={styles.spacer} />
    {rightLabel ? <Text style={styles.rightLabel}>{rightLabel}</Text> : null}
    <SvgIcon name="arrow_right" width={14} height={14} color={Colors.textMuted} />
  </TouchableOpacity>
);

const Divider = () => <View style={styles.divider} />;
ProfileMenuItem.Divider = Divider;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.itemBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  dangerIconBox: {
    backgroundColor: '#FFDADA',
  },
  label: {
    ...Typography.bodyMedium,
    color: Colors.font,
    flex: 1,
  },
  dangerLabel: {
    color: Colors.error,
  },
  spacer: { flex: 1 },
  rightLabel: {
    ...Typography.body,
    color: Colors.textMuted,
    marginRight: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: Spacing.base + 40 + Spacing.md,
    marginRight: Spacing.base,
  },
});

export default ProfileMenuItem;

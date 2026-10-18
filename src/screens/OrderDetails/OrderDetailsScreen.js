import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, StatusBar, TouchableOpacity,
  Linking, RefreshControl, Image, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { BorderRadius, Spacing, Shadows } from '../../constants/spacing';
import { Strings } from '../../constants/strings';
import OrderStatusBadge from '../../components/common/OrderStatusBadge';
import LoaderOverlay from '../../components/common/LoaderOverlay';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import CustomButton from '../../components/common/CustomButton';
import SvgIcon from '../../components/common/SvgIcon';
import useOrderStore from '../../store/orderStore';
import useConfigStore from '../../store/configStore';
import { openDirections } from '../../utils/permissions';
import useRouteStore from '../../store/routeStore';
import Images from '../../assets/images/index';

const SectionTitle = ({ title }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

const InfoRow = ({ label, value, valueStyle }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, valueStyle]}>{value}</Text>
  </View>
);

const OrderDetailsScreen = ({ navigation, route }) => {
  const { orderId } = route.params || {};
  const { orderDetails, loaders, getOrderDetails, changeOrderStatus } = useOrderStore();
  const { countryInfo } = useConfigStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCollectDialog, setShowCollectDialog] = useState(false);

  const order = orderDetails;
  const routePlan = useRouteStore((state) => state.route);
  const stop = routePlan?.stops?.find((item) => item.orderId === order?.id);

  useEffect(() => {
    if (orderId) getOrderDetails(orderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await getOrderDetails(orderId).catch(() => {});
    setRefreshing(false);
  }, [orderId, getOrderDetails]);

  const handleConfirmDelivery = () => {
    if (!order) return;
    navigation.navigate(stop?.status === 'arrived' ? 'CustomerSignature' : 'Arrival', { orderId: order.id });
  };

  const handleArrive = () => {
    if (!stop) {
      Toast.show({ type: 'error', text1: 'Plan and start the route before recording arrival.' });
      return;
    }
    navigation.navigate('Arrival', { orderId: order.id });
  };

  const doChangeStatus = async () => {
    setShowConfirmDialog(false);
    setShowCollectDialog(false);
    try {
      await changeOrderStatus(order.id, 13);
      navigation.replace('ConfirmDelivery', {
        orderSerialNo: order.order_serial_no,
        orderDatetime: order.order_datetime,
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message || 'Failed to confirm delivery',
      });
    }
  };

  const getPaymentMethod = () => {
    if (!order) return '—';
    if (order.payment_method === 4) return 'Cheque';
    if (order.transaction) return String(order.transaction.payment_method);
    if (order.order_type === 5) return Strings.cashOnDelivery;
    if (order.order_type === 10) return Strings.pickAndPay;
    return '—';
  };

  const showActionBar = order && order.status !== 13 && order.status !== 22;
  const showConfirmBtn = order && order.status === 10;

  if (!order && !loaders.details) {
    return (
      <View style={styles.centeredEmpty}>
        <Text style={styles.emptyText}>Order not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgColor} />
      <LoaderOverlay visible={loaders.details && !refreshing} />

      {/* App Bar with SVG back arrow */}
      <View style={styles.appBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <SvgIcon name="back" width={24} height={24} color={Colors.font} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>{Strings.orderDetails}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          showActionBar && { paddingBottom: 140 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {order ? (
          <>
            {/* 1. Header */}
            <View style={[styles.card, styles.headerCard]}>
              <View style={styles.headerRow}>
                <View style={styles.orderIdSection}>
                  <Text style={styles.orderIdLabel}>{Strings.orderId}</Text>
                  <Text style={styles.orderIdValue}>{order.order_serial_no}</Text>
                </View>
                <OrderStatusBadge status={order.status} statusName={order.status_name} />
              </View>
              <Text style={styles.dateText}>{order.order_datetime}</Text>
            </View>

            {/* 2. Estimated Time (hidden if delivered status === 13) */}
            {order.status !== 13 && order.preparation_time ? (
              <View style={styles.card}>
                <Text style={styles.estimatedLabel}>{Strings.estimatedDeliveryTime}</Text>
                <Text style={styles.estimatedTime}>{order.preparation_time}min</Text>
              </View>
            ) : null}

            {/* 3. Customer Info */}
            <View style={styles.card}>
              <SectionTitle title={Strings.customer} />
              <View style={styles.customerRow}>
                {order.user?.image ? (
                  <Image
                    source={{ uri: order.user.image }}
                    style={styles.customerAvatar}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.customerAvatar, styles.avatarCirclePlaceholder]}>
                    <Text style={styles.avatarInitial}>
                      {order.user?.name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{order.user?.name || '—'}</Text>
                  <Text style={styles.customerRole}>{Strings.customer}</Text>
                </View>
                {order.user?.phone ? (
                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => {
                      const calling = countryInfo?.calling_code || '';
                      Linking.openURL(`tel:${calling}${order.user.phone}`);
                    }}
                    accessibilityLabel={`Call customer ${order.user.name}`}
                    accessibilityRole="button"
                  >
                    <SvgIcon name="call" width={22} height={22} color={Colors.primary} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* 4. Payment Info */}
            <View style={styles.card}>
              <SectionTitle title={Strings.paymentInfo} />
              <InfoRow label={`${Strings.method} :`} value={getPaymentMethod()} />
              <InfoRow
                label={`${Strings.status} :`}
                value={order.payment_status === 5 ? Strings.paid : Strings.unpaid}
                valueStyle={{ color: order.payment_status === 5 ? Colors.success : Colors.error }}
              />
            </View>

            {/* 5. Delivery Address */}
            <View style={styles.card}>
              <SectionTitle title={Strings.deliveryAddress} />
              <View style={styles.addressRow}>
                <View style={styles.addressPinBox}>
                  <SvgIcon name="location" width={18} height={18} color={Colors.primary} />
                </View>
                <Text style={styles.addressText} numberOfLines={3}>
                  {[order.order_address?.apartment, order.order_address?.address]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              </View>
            </View>

            {/* 6. Order Summary */}
            <View style={styles.card}>
              <SectionTitle title={Strings.orderSummary || 'Order Summary'} />
              {(order.order_items || []).map((item, idx) => (
                <View key={String(item.id || idx)}>
                  {/* Item Row */}
                  <View style={styles.itemRow}>
                    <View style={styles.itemImageWrapper}>
                      {item.item_image ? (
                        <Image
                          source={{ uri: item.item_image }}
                          style={styles.itemImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                          <Image
                            source={Images.appLogo}
                            style={{ width: 36, height: 36 }}
                            resizeMode="contain"
                          />
                        </View>
                      )}
                      <View style={styles.qtyBadge}>
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                      </View>
                    </View>
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName} numberOfLines={2}>{item.item_name}</Text>
                      {(item.item_variations || []).map((v) => (
                        <Text key={String(v.id)} style={styles.variationText}>{v.name}</Text>
                      ))}
                      <Text style={styles.itemPrice}>{item.total_currency_price}</Text>
                    </View>
                  </View>
                  {item.item_extras?.length > 0 && (
                    <Text style={styles.extrasText}>
                      {Strings.extras}: {item.item_extras.map((e) => e.name).join(', ')}
                    </Text>
                  )}
                  {item.instruction ? (
                    <Text style={styles.instructionText}>
                      {Strings.instruction}: {item.instruction}
                    </Text>
                  ) : null}
                  {idx < (order.order_items?.length ?? 0) - 1 && <View style={styles.divider} />}
                </View>
              ))}

              {/* Price Breakdown */}
              <View style={styles.priceTable}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>{Strings.subtotal}</Text>
                  <Text style={styles.priceValue}>{order.subtotal_currency_price}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>{Strings.discount}</Text>
                  <Text style={styles.priceValue}>{order.discount_currency_price}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>{Strings.deliveryCharge}</Text>
                  <Text style={[styles.priceValue, { color: Colors.success }]}>
                    {order.delivery_charge_currency_price}
                  </Text>
                </View>
                <View style={styles.dashedDivider} />
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, styles.totalLabel]}>{Strings.total}</Text>
                  <Text style={[styles.priceValue, styles.totalValue]}>
                    {order.total_currency_price}
                  </Text>
                </View>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>

      {/* 7. Bottom Action Bar */}
      {showActionBar && order ? (
        <View style={styles.actionBar}>
          <CustomButton
            title={Strings.getDirection}
            onPress={() =>
              openDirections(order.order_address?.latitude, order.order_address?.longitude)
            }
            variant="outline"
            style={styles.actionBtn}
          />
          {showConfirmBtn && stop ? (
            <CustomButton
              title={stop.status === 'arrived' ? 'Arrived at Customer' : 'Arrive'}
              onPress={handleArrive}
              variant="outline"
              style={styles.actionBtn}
            />
          ) : null}
          {showConfirmBtn ? (
            <CustomButton
              title={Strings.confirmDelivery}
              onPress={handleConfirmDelivery}
              variant="success"
              loading={loaders.confirm}
              style={styles.actionBtn}
            />
          ) : null}
        </View>
      ) : null}

      {/* Confirm Delivery Dialog */}
      <ConfirmDialog
        visible={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={doChangeStatus}
        title={Strings.confirmDeliveryAlert}
        image={Images.confirm}
        cancelText={Strings.noCancel}
        confirmText={Strings.yesConfirm}
        loading={loaders.confirm}
        confirmVariant="success"
      />

      {/* Collect Payment Dialog */}
      <ConfirmDialog
        visible={showCollectDialog}
        onClose={() => setShowCollectDialog(false)}
        onConfirm={doChangeStatus}
        title={Strings.doYouCollectPayment}
        image={Images.collectPayment}
        cancelText={Strings.noCancel}
        confirmText={Strings.yesCollect}
        loading={loaders.confirm}
        extraContent={
          <View style={styles.amountBlock}>
            <Text style={styles.amountLabel}>{Strings.amount}:</Text>
            <Text style={styles.amountValue}>{order?.total_currency_price}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgColor },
  flex: { flex: 1 },
  centeredEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgColor,
  },
  emptyText: { ...Typography.body, color: Colors.textMuted },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bgColor,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  appBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Rubik-Bold',
    fontSize: 20,
    color: Colors.font,
  },
  content: {
    padding: Spacing.base,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.card,
  },
  headerCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  orderIdSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderIdLabel: { ...Typography.regular, color: Colors.textMuted },
  orderIdValue: {
    ...Typography.bodyMedium,
    color: Colors.darkBlue,
    fontFamily: 'Rubik-Bold',
  },
  dateText: { ...Typography.regular, color: Colors.textMuted },
  estimatedLabel: {
    ...Typography.regular,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  estimatedTime: {
    fontFamily: 'Rubik-Bold',
    fontSize: 26,
    color: Colors.font,
  },
  sectionTitle: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.font,
    marginBottom: Spacing.md,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: Spacing.md,
  },
  avatarCirclePlaceholder: {
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: 'Rubik-Bold',
    fontSize: 20,
    color: Colors.primary,
  },
  customerInfo: { flex: 1 },
  customerName: {
    fontFamily: 'Rubik-Bold',
    fontSize: 15,
    color: Colors.font,
  },
  customerRole: {
    ...Typography.small,
    color: Colors.textMuted,
    marginTop: 2,
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  infoLabel: { ...Typography.body, color: Colors.textMuted },
  infoValue: { ...Typography.bodyMedium, color: Colors.font },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressPinBox: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  addressText: {
    ...Typography.body,
    color: Colors.font,
    flex: 1,
    lineHeight: 22,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  itemImageWrapper: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.itemBg,
  },
  itemImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBadge: {
    position: 'absolute',
    top: -6,
    left: -6,
    backgroundColor: Colors.font,
    borderRadius: BorderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  qtyText: {
    color: Colors.white,
    fontSize: 11,
    fontFamily: 'Rubik-Bold',
  },
  itemDetails: { flex: 1 },
  itemName: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    color: Colors.font,
    marginBottom: 2,
  },
  variationText: {
    ...Typography.small,
    color: Colors.textMuted,
  },
  itemPrice: {
    fontFamily: 'Rubik-Medium',
    fontSize: 13,
    color: Colors.font,
    marginTop: 4,
  },
  extrasText: {
    ...Typography.small,
    color: Colors.textMuted,
    marginTop: 2,
  },
  instructionText: {
    ...Typography.small,
    color: Colors.warning,
    marginTop: 2,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.md,
  },
  priceTable: {
    backgroundColor: Colors.bgColor,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  priceLabel: { ...Typography.body, color: Colors.textMuted },
  priceValue: { ...Typography.bodyMedium, color: Colors.font },
  dashedDivider: {
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: Colors.divider,
    marginVertical: Spacing.sm,
  },
  totalLabel: {
    fontFamily: 'Rubik-Bold',
    fontSize: 16,
    color: Colors.font,
  },
  totalValue: {
    fontFamily: 'Rubik-Bold',
    fontSize: 16,
    color: Colors.primary,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    flexDirection: 'row',
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    ...Shadows.modal,
  },
  actionBtn: { flex: 1 },
  amountBlock: {
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  amountLabel: { ...Typography.body, color: Colors.textMuted },
  amountValue: {
    fontFamily: 'Rubik-Black',
    fontSize: 22,
    color: Colors.darkBlue,
    marginTop: 2,
  },
});

export default OrderDetailsScreen;

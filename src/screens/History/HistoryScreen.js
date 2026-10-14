import React, { useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, StatusBar, RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { BorderRadius, Spacing, Shadows } from '../../constants/spacing';
import { Strings } from '../../constants/strings';
import OrderStatusBadge from '../../components/common/OrderStatusBadge';
import EmptyState from '../../components/common/EmptyState';
import LoaderOverlay from '../../components/common/LoaderOverlay';
import { OrderCardSkeleton } from '../../components/common/SkeletonLoader';
import SvgIcon from '../../components/common/SvgIcon';
import Images from '../../assets/images/index';
import useOrderStore from '../../store/orderStore';

const HistoryCard = ({ item, onPress }) => (
  <TouchableOpacity
    style={styles.card}
    onPress={onPress}
    activeOpacity={0.8}
    accessibilityRole="button"
    accessibilityLabel={`View order ${item?.order_serial_no}`}
  >
    {/* Row 1: Order ID + Status */}
    <View style={styles.headerRow}>
      <View style={styles.orderIdRow}>
        <Text style={styles.orderIdLabel}>{Strings.orderId}</Text>
        <Text style={styles.orderIdValue} numberOfLines={1}>{item?.order_serial_no}</Text>
      </View>
      <OrderStatusBadge status={item?.status} statusName={item?.status_name} />
    </View>

    {/* Row 2: Date */}
    <Text style={styles.dateText}>{item?.order_datetime}</Text>

    {/* Row 3: Address */}
    <View style={styles.addressRow}>
      <View style={styles.pinWrapper}>
        <SvgIcon name="location" width={16} height={16} color={Colors.primary} />
      </View>
      <Text style={styles.addressText} numberOfLines={2}>
        {item?.order_address?.address || '—'}
      </Text>
    </View>

    {/* Row 4: See Details Link */}
    <View style={styles.detailsRow}>
      <Text style={styles.detailsText}>{Strings.seeOrderDetails}</Text>
      <View style={styles.arrowIconWrapper}>
        <SvgIcon name="arrow_right" width={12} height={12} color={Colors.primary} />
      </View>
    </View>
  </TouchableOpacity>
);

const HistoryScreen = ({ navigation }) => {
  const { previousOrderList, loaders, listError, getOrderList, getOrderDetails } = useOrderStore();

  const handleRefresh = useCallback(() => {
    getOrderList();
  }, [getOrderList]);

  const handleViewOrder = useCallback(async (orderId) => {
    try {
      await getOrderDetails(orderId);
      navigation.navigate('OrderDetails', { orderId });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not load order details' });
    }
  }, [getOrderDetails, navigation]);

  const renderItem = useCallback(({ item }) => (
    <HistoryCard item={item} onPress={() => handleViewOrder(item.id)} />
  ), [handleViewOrder]);

  const keyExtractor = useCallback((item) => String(item.id), []);

  const ListHeader = () => (
    <View style={styles.headerSection}>
      {loaders.list && previousOrderList.length === 0 ? (
        <>
          <OrderCardSkeleton />
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgColor} />
      <LoaderOverlay visible={loaders.details} />

      {/* App Bar */}
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>{Strings.orderHistory}</Text>
      </View>

      <FlatList
        data={previousOrderList}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={
          loaders.list ? null : (
            <EmptyState
              image={Images.orderEmpty}
              title={listError || Strings.noOrderHistory}
              subtitle={listError ? 'Pull down to retry' : undefined}
            />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={loaders.list && previousOrderList.length > 0}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        removeClippedSubviews={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgColor },
  appBar: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bgColor,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  appBarTitle: {
    fontFamily: 'Rubik-Bold',
    fontSize: 18,
    color: Colors.font,
  },
  headerSection: {},
  listContent: { flexGrow: 1, padding: Spacing.base, gap: Spacing.md },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  orderIdRow: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  orderIdLabel: { ...Typography.regular, color: Colors.textMuted },
  orderIdValue: { ...Typography.bodyMedium, color: Colors.darkBlue, flexShrink: 1 },
  dateText: { ...Typography.regular, color: Colors.textMuted, marginBottom: Spacing.sm },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.md },
  pinWrapper: { marginRight: 6, marginTop: 2 },
  addressText: { ...Typography.body, color: Colors.font, flex: 1, lineHeight: 20 },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.sm,
    gap: 4,
  },
  detailsText: { ...Typography.bodyMedium, color: Colors.primary },
  arrowIconWrapper: { justifyContent: 'center' },
});

export default HistoryScreen;

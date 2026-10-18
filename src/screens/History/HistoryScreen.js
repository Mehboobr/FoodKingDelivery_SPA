import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, StatusBar, RefreshControl,
  TouchableOpacity, TextInput,
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
import { orderService } from '../../services/orderService';

const STATUS_CODE = {
  pending: 1,
  ready: 7,
  in_transit: 10,
  delivered: 13,
  returned: 19,
  cancelled: 14,
};

function mapDriverOrder(order) {
  const line = [order.deliveryAddress?.addressLine1, order.deliveryAddress?.addressLine2].filter(Boolean).join(', ');
  return {
    id: order.orderId,
    order_serial_no: order.invoiceNumber,
    status: STATUS_CODE[order.deliveryStatus] || 1,
    status_name: order.orderStatus,
    order_datetime: order.orderDate,
    user: { name: order.contact?.name || '' },
    order_address: { address: line },
  };
}

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

    {item?.user?.name ? <Text style={styles.customer}>{item.user.name}</Text> : null}
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

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'completed', label: 'Completed' },
  { id: 'returned', label: 'Returned' },
];

const HistoryScreen = ({ navigation }) => {
  const { orderList, loaders, listError, getOrderList, getOrderDetails } = useOrderStore();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [remote, setRemote] = useState(null);
  const [searching, setSearching] = useState(false);
  const history = orderList.filter((order) => [13, 19, 22].includes(order.status));
  const localList = history.filter((order) => {
    if (filter === 'completed') return order.status === 13;
    if (filter === 'returned') return order.status === 19 || order.status === 22;
    return true;
  });
  const previousOrderList = remote || localList;

  const search = useCallback(async (text, nextFilter) => {
    const term = text.trim();
    if (term.length < 2) {
      setRemote(null);
      return;
    }
    setSearching(true);
    try {
      const status = nextFilter === 'completed' ? 'delivered' : (nextFilter === 'returned' ? 'returned' : undefined);
      const response = await orderService.getDriverOrders({ search: term, status, limit: 50 });
      const rows = (response.data?.data || []).map(mapDriverOrder).filter((order) => [13, 19, 22].includes(order.status));
      setRemote(rows);
    } catch {
      Toast.show({ type: 'error', text1: 'Search failed. The loaded history is still shown.' });
      setRemote(null);
    } finally {
      setSearching(false);
    }
  }, []);

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
        <Text style={styles.appBarTitle}>Delivery History</Text>
        <TextInput
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            search(text, filter);
          }}
          placeholder="Search shipment or customer"
          placeholderTextColor={Colors.textMuted}
          style={styles.search}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.filters}>
          {FILTERS.map((item) => (
            <TouchableOpacity key={item.id} style={[styles.filter, filter === item.id && styles.filterOn]} onPress={() => { setFilter(item.id); search(query, item.id); }}>
              <Text style={[styles.filterText, filter === item.id && styles.filterTextOn]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={previousOrderList}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={
          loaders.list || searching ? null : (
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
  search: { marginTop: 12, backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 12, minHeight: 44, color: Colors.font },
  filters: { flexDirection: 'row', gap: 8, marginTop: 12 },
  customer: { ...Typography.bodyMedium, color: Colors.font, marginBottom: 2 },
  filter: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.white },
  filterOn: { backgroundColor: Colors.primary },
  filterText: { color: Colors.font, fontFamily: 'Rubik-Medium' },
  filterTextOn: { color: Colors.white },
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

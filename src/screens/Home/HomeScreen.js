import React, { useCallback, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, StatusBar, RefreshControl,
  BackHandler, ToastAndroid, Platform, TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, Shadows } from '../../constants/spacing';
import { Strings } from '../../constants/strings';
import EmptyState from '../../components/common/EmptyState';
import LoaderOverlay from '../../components/common/LoaderOverlay';
import { OrderCardSkeleton } from '../../components/common/SkeletonLoader';
import useOrderStore from '../../store/orderStore';
import useProfileStore from '../../store/profileStore';
import useRouteStore from '../../store/routeStore';
import { openDirections } from '../../utils/permissions';
import { locationStatus } from '../../utils/locationTracker';
import Images from '../../assets/images/index';

function formatDistance(meters) {
  if (meters == null) return null;
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds) {
  if (seconds == null) return null;
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
}

function trackingLabel(tracking) {
  const native = locationStatus();
  if (!native.nativeAvailable) return 'GPS module needs a rebuild';
  if (!tracking?.lastCapturedAt) return 'Waiting for GPS';
  if (tracking.stale) {
    const time = new Date(tracking.lastCapturedAt);
    return `Location last updated ${time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  return tracking.enabled ? 'GPS sharing' : 'GPS ready';
}

const Metric = ({ label, value }) => (
  <View style={styles.metric}>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const HomeScreen = ({ navigation }) => {
  const { activeOrderList, loaders, listError, getOrderList, getOrderCount, getOrderDetails } = useOrderStore();
  const profile = useProfileStore((state) => state.profileData);
  const getProfile = useProfileStore((state) => state.getProfile);
  const {
    route, summary, tracking, message, onDuty, arrival, loading, error,
    loadDuty, loadCurrent, planRoute, startRoute, recalculate, setOnDuty, resumeTracking,
  } = useRouteStore();
  const backPressCount = useRef(0);

  const refresh = useCallback(async () => {
    await Promise.all([
      getOrderList().catch(() => {}),
      getOrderCount().catch(() => {}),
      getProfile().catch(() => {}),
      loadCurrent().catch(() => {}),
    ]);
  }, [getOrderList, getOrderCount, getProfile, loadCurrent]);

  useFocusEffect(
    useCallback(() => {
      loadDuty().then(() => refresh()).then(() => resumeTracking());
      const onBack = () => {
        if (backPressCount.current === 1) {
          BackHandler.exitApp();
          return true;
        }
        backPressCount.current = 1;
        if (Platform.OS === 'android') ToastAndroid.show(Strings.pressBackToExit, ToastAndroid.SHORT);
        setTimeout(() => { backPressCount.current = 0; }, 2000);
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, [loadDuty, refresh, resumeTracking])
  );

  const openShipment = useCallback(async (orderId) => {
    try {
      await getOrderDetails(orderId);
      navigation.navigate('OrderDetails', { orderId });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not load shipment details' });
    }
  }, [getOrderDetails, navigation]);

  const handlePlan = async () => {
    try {
      const data = await planRoute();
      if (data?.message) Toast.show({ type: 'success', text1: data.message });
    } catch (err) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message || 'Could not plan the route' });
    }
  };

  const handleStart = async () => {
    try {
      await startRoute();
      navigation.navigate('RouteMap');
    } catch (err) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message || 'Could not start the route' });
    }
  };

  const stops = route?.stops || [];
  const next = route?.nextStop;

  const ListHeader = () => (
    <View>
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>E</Text></View>
          <View style={styles.headerText}>
            <Text style={styles.brand}>Encore Driver</Text>
            <Text style={styles.driverName}>{profile?.name || 'Driver'}</Text>
          </View>
        </View>
        <View style={styles.chips}>
          <View style={styles.chip}><Text style={styles.chipText}>Logged in</Text></View>
          <TouchableOpacity style={[styles.chip, onDuty && styles.chipOn]} onPress={() => setOnDuty(!onDuty)}>
            <Text style={[styles.chipText, onDuty && styles.chipTextOn]}>{onDuty ? 'On duty' : 'Off duty'}</Text>
          </TouchableOpacity>
          <View style={styles.chip}><Text style={styles.chipText}>{trackingLabel(tracking)}</Text></View>
        </View>
      </View>

      <View style={styles.metrics}>
        <Metric label="Assigned" value={summary?.assigned ?? '—'} />
        <Metric label="Pending" value={summary?.pending ?? '—'} />
        <Metric label="Completed" value={summary?.completed ?? '—'} />
        <Metric label="Returned" value={summary?.returned ?? '—'} />
        <Metric label="Stops left" value={summary?.remainingStops ?? '—'} />
      </View>

      {route ? (
        <View style={styles.routeCard}>
          <Text style={styles.kicker}>{route.status === 'active' ? 'Active route' : 'Planned route'}</Text>
          <Text style={styles.routeCode}>{route.code}</Text>
          <Text style={styles.progress}>{route.progressLabel}</Text>
          <View style={styles.track}><View style={[styles.trackFill, { width: `${route.totalStops ? (route.completedStops / route.totalStops) * 100 : 0}%` }]} /></View>
          <Text style={styles.routeMeta}>
            {[formatDistance(route.remainingDistanceMeters), formatDuration(route.remainingDurationSeconds), route.originLabel].filter(Boolean).join(' · ')}
          </Text>
          {message ? <Text style={styles.note}>{message}</Text> : null}
          <View style={styles.row}>
            {route.status === 'planned' ? (
              <TouchableOpacity style={styles.primaryBtn} onPress={handleStart}>
                <Text style={styles.primaryBtnText}>Start Route</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('RouteMap')}>
                <Text style={styles.primaryBtnText}>Resume Route</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.secondaryBtn} onPress={async () => {
              try {
                const data = await recalculate();
                if (data?.message) Toast.show({ type: 'success', text1: data.message });
              } catch (err) {
                Toast.show({ type: 'error', text1: err?.response?.data?.message || 'Could not recalculate the route' });
              }
            }}>
              <Text style={styles.secondaryBtnText}>Recalculate</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.routeCard}>
          <Text style={styles.routeCode}>No route yet</Text>
          <Text style={styles.note}>Plan a road route from your current location and the shipments that are out for delivery.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={handlePlan}>
            <Text style={styles.primaryBtnText}>Plan Route</Text>
          </TouchableOpacity>
        </View>
      )}

      {arrival ? (
        <View style={styles.arrival}>
          <Text style={styles.arrivalTitle}>Arrived at customer</Text>
          <Text style={styles.note}>Arrival does not complete the shipment. Capture the signature and any required payment proof.</Text>
        </View>
      ) : null}

      {next ? (
        <View style={styles.nextCard}>
          <Text style={styles.kicker}>Next stop · {next.sequence}</Text>
          <Text style={styles.routeCode}>{next.shipmentReference}</Text>
          <Text style={styles.driverName}>{next.customerName}</Text>
          <Text style={styles.address}>{next.address}</Text>
          <Text style={styles.routeMeta}>
            {[formatDistance(next.legDistanceMeters), formatDuration(next.legDurationSeconds)].filter(Boolean).join(' · ') || 'Road leg will show after routing'}
          </Text>
          {next.instructions ? <Text style={styles.note}>{next.instructions}</Text> : null}
          <View style={styles.row}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => openDirections(next.latitude, next.longitude)}>
              <Text style={styles.primaryBtnText}>Navigate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => openShipment(next.orderId)}>
              <Text style={styles.secondaryBtnText}>View Shipment</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Route stops</Text>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {(loading || loaders.list) && stops.length === 0 && activeOrderList.length === 0 ? (
        <>
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </>
      ) : null}
    </View>
  );

  const data = stops.length ? stops : activeOrderList.map((order) => ({
    id: `order-${order.id}`,
    orderId: order.id,
    sequence: null,
    shipmentReference: order.order_serial_no,
    customerName: '',
    address: order.order_address?.address,
    status: 'pending',
    statusName: order.status_name,
    latitude: Number(order.order_address?.latitude),
    longitude: Number(order.order_address?.longitude),
    instructions: '',
    unsequenced: true,
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgColor} />
      <LoaderOverlay visible={loaders.details} />
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={<ListHeader />}
        refreshControl={<RefreshControl refreshing={loading && Boolean(route)} onRefresh={refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const done = item.status === 'completed' || item.status === 'failed';
          return (
            <View style={[styles.stopCard, done && styles.stopDone]}>
              <View style={styles.stopIndex}><Text style={styles.stopIndexText}>{item.sequence || '•'}</Text></View>
              <View style={styles.stopBody}>
                <Text style={styles.stopRef}>{item.shipmentReference}</Text>
                <Text style={styles.address}>{[item.customerName, item.address].filter(Boolean).join(' · ')}</Text>
                <Text style={styles.routeMeta}>{item.statusName || item.status}{item.deliveryTime ? ` · ${item.deliveryTime}` : ''}</Text>
                {item.instructions ? <Text style={styles.note}>{item.instructions}</Text> : null}
                <View style={styles.row}>
                  <TouchableOpacity onPress={() => openDirections(item.latitude, item.longitude)}><Text style={styles.link}>Navigate</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => openShipment(item.orderId)}><Text style={styles.link}>View Shipment</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={!loading && !loaders.list ? (
          listError ? (
            <TouchableOpacity onPress={refresh}><Text style={styles.errorText}>{listError}. Tap to retry.</Text></TouchableOpacity>
          ) : (
            <EmptyState image={Images.orderEmpty} title={Strings.noOrderForDelivery} subtitle={Strings.waitNote} />
          )
        ) : null}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgColor },
  list: { padding: Spacing.base, paddingBottom: 32 },
  headerCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, ...Shadows.card },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  brandMark: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: Colors.white, fontFamily: 'Rubik-Bold', fontSize: 22 },
  headerText: { marginLeft: Spacing.md, flex: 1 },
  brand: { ...Typography.small, color: Colors.primary, fontFamily: 'Rubik-Medium' },
  driverName: { ...Typography.large, color: Colors.font, fontFamily: 'Rubik-Medium' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: Spacing.md },
  chip: { backgroundColor: Colors.bgColor, borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 6 },
  chipOn: { backgroundColor: Colors.primary },
  chipText: { ...Typography.small, color: Colors.font },
  chipTextOn: { color: Colors.white },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: Spacing.md },
  metric: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: 10, minWidth: '30%', flexGrow: 1 },
  metricValue: { fontFamily: 'Rubik-Bold', fontSize: 18, color: Colors.font },
  metricLabel: { ...Typography.small, color: Colors.textMuted, marginTop: 2 },
  routeCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginTop: Spacing.md },
  nextCard: { backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.lg, padding: Spacing.md, marginTop: Spacing.md },
  kicker: { ...Typography.small, color: Colors.primary, fontFamily: 'Rubik-Medium' },
  routeCode: { fontFamily: 'Rubik-Bold', fontSize: 20, color: Colors.font, marginTop: 2 },
  progress: { ...Typography.body, color: Colors.font, marginTop: 4 },
  track: { height: 8, backgroundColor: Colors.divider, borderRadius: 8, marginTop: 8, overflow: 'hidden' },
  trackFill: { height: 8, backgroundColor: Colors.primary },
  routeMeta: { ...Typography.small, color: Colors.textMuted, marginTop: 6 },
  note: { ...Typography.small, color: Colors.font, marginTop: 6 },
  address: { ...Typography.body, color: Colors.font, marginTop: 4 },
  row: { flexDirection: 'row', gap: 8, marginTop: Spacing.md },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: 16, paddingVertical: 12, minHeight: 48, justifyContent: 'center' },
  primaryBtnText: { color: Colors.white, fontFamily: 'Rubik-Medium' },
  secondaryBtn: { borderWidth: 1, borderColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: 16, paddingVertical: 12, minHeight: 48, justifyContent: 'center' },
  secondaryBtnText: { color: Colors.primary, fontFamily: 'Rubik-Medium' },
  arrival: { backgroundColor: '#FEF3C7', borderRadius: BorderRadius.lg, padding: Spacing.md, marginTop: Spacing.md },
  arrivalTitle: { fontFamily: 'Rubik-Medium', color: '#92400E' },
  sectionHeader: { marginTop: Spacing.lg, marginBottom: Spacing.sm },
  sectionTitle: { ...Typography.large, color: Colors.font, fontFamily: 'Rubik-Medium' },
  stopCard: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  stopDone: { opacity: 0.55 },
  stopIndex: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  stopIndexText: { color: Colors.primary, fontFamily: 'Rubik-Bold' },
  stopBody: { flex: 1, marginLeft: Spacing.md },
  stopRef: { fontFamily: 'Rubik-Medium', color: Colors.font },
  link: { color: Colors.primary, fontFamily: 'Rubik-Medium', marginRight: 16 },
  errorText: { color: Colors.error, marginVertical: Spacing.sm },
});

export default HomeScreen;

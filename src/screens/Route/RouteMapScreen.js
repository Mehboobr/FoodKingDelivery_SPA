import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, FlatList, Linking, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import Toast from 'react-native-toast-message';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadows } from '../../constants/spacing';
import useRouteStore from '../../store/routeStore';
import useOrderStore from '../../store/orderStore';
import { openDirections } from '../../utils/permissions';
import { routeMapHtml } from './routeMapHtml';
import { formatDistance, formatDuration, formatEta, routeStatusLabel, stopStatusLabel } from './routeFormat';

function cumulativeEta(stops, stop) {
  const remaining = stops.filter((item) => item.status === 'pending' || item.status === 'arrived');
  let seconds = 0;
  for (const item of remaining) {
    seconds += item.legDurationSeconds || 0;
    if (item.id === stop.id) return seconds || item.legDurationSeconds;
  }
  return stop.legDurationSeconds;
}

const RouteMapScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const webRef = useRef(null);
  const route = useRouteStore((state) => state.route);
  const tracking = useRouteStore((state) => state.tracking);
  const loading = useRouteStore((state) => state.loading);
  const loadCurrent = useRouteStore((state) => state.loadCurrent);
  const recalculate = useRouteStore((state) => state.recalculate);
  const planRoute = useRouteStore((state) => state.planRoute);
  const startRoute = useRouteStore((state) => state.startRoute);
  const getOrderDetails = useOrderStore((state) => state.getOrderDetails);
  const [selectedId, setSelectedId] = useState(null);
  const [optimizing, setOptimizing] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [mapFailed, setMapFailed] = useState(false);

  useFocusEffect(useCallback(() => {
    loadCurrent().catch(() => {});
  }, [loadCurrent]));

  const html = useMemo(() => routeMapHtml(route, tracking), [route, tracking]);
  const stops = route?.stops || [];
  const next = route?.nextStop;
  const selected = stops.find((stop) => stop.id === selectedId) || null;
  const completed = route?.completedStops || 0;
  const total = route?.totalStops || 0;
  const remaining = route?.remainingStops || 0;
  const progress = total ? Math.min(100, (completed / total) * 100) : 0;
  const finished = route && remaining === 0;

  const optimize = async () => {
    if (optimizing) return;
    setOptimizing(true);
    try {
      const data = route?.id ? await recalculate() : await planRoute();
      Toast.show({ type: 'success', text1: data?.message || 'Route updated from road travel.' });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: error?.response?.data?.message || 'Optimization failed. The last route is still shown.',
      });
    } finally {
      setOptimizing(false);
    }
  };

  const openShipment = async (orderId) => {
    try {
      await getOrderDetails(orderId);
      navigation.navigate('OrderDetails', { orderId });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not load shipment details' });
    }
  };

  const startNavigation = async () => {
    if (!next || finished) return;
    try {
      if (route?.status === 'planned') await startRoute();
      navigation.navigate('Navigation', { stopId: next.id });
    } catch (error) {
      Toast.show({ type: 'error', text1: error?.response?.data?.message || 'Could not start navigation.' });
    }
  };

  const onMapMessage = (event) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload.type === 'stop') setSelectedId(payload.id);
    } catch {
      // Ignore non-JSON map messages.
    }
  };

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} accessibilityLabel="Go back">
            <Text style={styles.back}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Route Overview</Text>
          <TouchableOpacity style={styles.optimize} onPress={optimize} disabled={optimizing} accessibilityLabel="Optimize route">
            {optimizing ? <ActivityIndicator color={Colors.primary} /> : <Text style={styles.optimizeText}>Optimize</Text>}
          </TouchableOpacity>
        </View>
        <View style={styles.summary}>
          <View style={styles.summaryTop}>
            <Text style={styles.routeCode}>{route?.code || 'No route'}</Text>
            {route ? <View style={styles.badge}><Text style={styles.badgeText}>{routeStatusLabel(route.status)}</Text></View> : null}
          </View>
          <Text style={styles.summaryLine}>
            {total} stops • {completed} completed • {remaining} remaining
          </Text>
          <View style={styles.track}><View style={[styles.trackFill, { width: `${progress}%` }]} /></View>
          <View style={styles.metrics}>
            <View>
              <Text style={styles.metricLabel}>Remaining distance</Text>
              <Text style={styles.metricValue}>{formatDistance(route?.remainingDistanceMeters) || '—'}</Text>
            </View>
            <View>
              <Text style={styles.metricLabel}>Remaining time</Text>
              <Text style={styles.metricValue}>{formatDuration(route?.remainingDurationSeconds) || '—'}</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.mapWrap}>
        {route?.geometry?.type === 'LineString' && !mapFailed ? (
          <WebView
            ref={webRef}
            originWhitelist={['*']}
            source={{ html }}
            style={styles.map}
            onMessage={onMapMessage}
            onError={() => setMapFailed(true)}
          />
        ) : (
          <View style={styles.mapFallback}>
            <Text style={styles.fallbackText}>
              {mapFailed
                ? 'The map could not load. Stop details below still use the last route.'
                : 'A road route is not available yet. Optimize the route to load the road line.'}
            </Text>
            <TouchableOpacity onPress={() => { setMapFailed(false); loadCurrent().catch(() => {}); }}>
              <Text style={styles.link}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity
          style={styles.recenter}
          onPress={() => webRef.current?.injectJavaScript('window.recenterMap && window.recenterMap(); true;')}
          accessibilityLabel="Recenter map"
        >
          <Text style={styles.recenterText}>◎</Text>
        </TouchableOpacity>
        {tracking?.stale ? <Text style={styles.stale}>Location last update is stale</Text> : null}
        {selected ? (
          <View style={styles.callout}>
            <Text style={styles.calloutTitle}>{selected.sequence} · {selected.shipmentReference}</Text>
            <Text style={styles.calloutBody}>{selected.customerName}</Text>
            <Text style={styles.calloutMeta}>{selected.address}</Text>
            <Text style={styles.calloutMeta}>
              {[formatDistance(selected.legDistanceMeters), formatDuration(selected.legDurationSeconds), stopStatusLabel(selected, next?.id === selected.id)].filter(Boolean).join(' · ')}
            </Text>
            <TouchableOpacity onPress={() => openShipment(selected.orderId)}><Text style={styles.link}>View shipment</Text></TouchableOpacity>
          </View>
        ) : null}
      </View>

      <View style={[styles.sheet, expanded ? styles.sheetOpen : styles.sheetClosed, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity onPress={() => setExpanded((value) => !value)} accessibilityLabel="Toggle stops">
          <View style={styles.handle} />
        </TouchableOpacity>
        <View style={styles.sheetHead}>
          <Text style={styles.sheetTitle}>Stops ({stops.length})</Text>
        </View>
        {expanded ? (
          <FlatList
            data={stops}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={() => loadCurrent().catch(() => {})} tintColor={Colors.primary} />}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isNext = next?.id === item.id;
              const done = item.status === 'completed';
              const failed = item.status === 'failed';
              const etaSeconds = cumulativeEta(stops, item);
              return (
                <View style={[styles.stop, isNext && styles.stopNext, done && styles.stopDone]}>
                  <View style={[styles.seq, done && styles.seqDone, isNext && styles.seqNext, failed && styles.seqFail]}>
                    <Text style={[styles.seqText, !(done || isNext || failed) && styles.seqTextDark]}>{done ? '✓' : item.sequence}</Text>
                  </View>
                  <View style={styles.stopBody}>
                    <View style={styles.stopTop}>
                      <Text style={styles.stopRef}>{item.shipmentReference}</Text>
                      <Text style={[styles.stopState, isNext && styles.stopStateNext, failed && styles.stopStateFail]}>
                        {stopStatusLabel(item, isNext)}
                      </Text>
                    </View>
                    <Text style={styles.customer}>{item.customerName || 'Customer'}</Text>
                    <Text style={styles.address} numberOfLines={2}>{item.address}</Text>
                    {!done ? (
                      <Text style={styles.leg}>
                        {[formatDuration(item.legDurationSeconds), formatDistance(item.legDistanceMeters)].filter(Boolean).join(' · ')}
                        {etaSeconds ? ` · ETA ${formatEta(etaSeconds)}` : ''}
                      </Text>
                    ) : null}
                    {isNext ? (
                      <View style={styles.actions}>
                        <TouchableOpacity style={styles.navBtn} onPress={() => openDirections(item.latitude, item.longitude)}>
                          <Text style={styles.navBtnText}>Navigate</Text>
                        </TouchableOpacity>
                        {item.customerPhone ? (
                          <TouchableOpacity style={styles.ghost} onPress={() => Linking.openURL(`tel:${item.customerPhone}`)}>
                            <Text style={styles.ghostText}>Call</Text>
                          </TouchableOpacity>
                        ) : null}
                        <TouchableOpacity style={styles.ghost} onPress={() => openShipment(item.orderId)}>
                          <Text style={styles.ghostText}>View</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity onPress={() => openShipment(item.orderId)}><Text style={styles.link}>View shipment</Text></TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={<Text style={styles.fallbackText}>{loading ? 'Loading route…' : 'No stops on this route.'}</Text>}
          />
        ) : null}
        <TouchableOpacity
          style={[styles.start, (!next || finished) && styles.startDisabled]}
          disabled={!next || finished}
          onPress={startNavigation}
        >
          <Text style={styles.startText}>{finished ? 'Route completed' : 'Start Navigation'}</Text>
          <Text style={styles.startSub}>{finished ? 'All assigned stops are finished' : 'Follow the road route to the next stop'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgColor },
  headerSafe: { backgroundColor: Colors.bgColor, zIndex: 2 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingBottom: 8 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  back: { fontSize: 32, color: Colors.font, lineHeight: 34 },
  title: { flex: 1, textAlign: 'center', fontFamily: 'Rubik-Bold', fontSize: 18, color: Colors.font },
  optimize: { minWidth: 84, height: 34, borderRadius: 17, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  optimizeText: { color: Colors.primary, fontFamily: 'Rubik-Medium' },
  summary: { marginHorizontal: Spacing.base, marginBottom: 8, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, ...Shadows.card },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeCode: { fontFamily: 'Rubik-Bold', fontSize: 18, color: Colors.font },
  badge: { backgroundColor: '#DCFCE7', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#15803D', fontFamily: 'Rubik-Medium', fontSize: 12 },
  summaryLine: { color: Colors.textMuted, marginTop: 4, fontFamily: 'Rubik-Regular' },
  track: { height: 6, backgroundColor: Colors.divider, borderRadius: 6, marginTop: 8, overflow: 'hidden' },
  trackFill: { height: 6, backgroundColor: Colors.primary },
  metrics: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  metricLabel: { color: Colors.textMuted, fontSize: 12, fontFamily: 'Rubik-Regular' },
  metricValue: { color: Colors.font, fontFamily: 'Rubik-Bold', fontSize: 16, marginTop: 2 },
  mapWrap: { flex: 1 },
  map: { flex: 1, backgroundColor: '#e7eef2' },
  mapFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  fallbackText: { color: Colors.textMuted, textAlign: 'center', fontFamily: 'Rubik-Regular' },
  recenter: { position: 'absolute', right: 16, top: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadows.card },
  recenterText: { color: Colors.primary, fontSize: 22 },
  stale: { position: 'absolute', left: 16, top: 16, backgroundColor: '#FEF3C7', color: '#92400E', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, overflow: 'hidden', fontFamily: 'Rubik-Medium', fontSize: 12 },
  callout: { position: 'absolute', left: 16, right: 16, top: 56, backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: 12, ...Shadows.card },
  calloutTitle: { fontFamily: 'Rubik-Bold', color: Colors.font },
  calloutBody: { color: Colors.font, marginTop: 2 },
  calloutMeta: { color: Colors.textMuted, marginTop: 2, fontSize: 12 },
  link: { color: Colors.primary, fontFamily: 'Rubik-Medium', marginTop: 6 },
  sheet: { backgroundColor: Colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, ...Shadows.strong },
  sheetOpen: { height: '46%' },
  sheetClosed: { height: 150 },
  handle: { alignSelf: 'center', width: 42, height: 5, borderRadius: 3, backgroundColor: Colors.divider, marginTop: 8 },
  sheetHead: { paddingHorizontal: Spacing.base, paddingVertical: 8 },
  sheetTitle: { fontFamily: 'Rubik-Bold', fontSize: 18, color: Colors.font },
  list: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.base, paddingBottom: 8 },
  stop: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  stopNext: { backgroundColor: '#F3FBFC', marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 12, borderBottomWidth: 0 },
  stopDone: { opacity: 0.7 },
  seq: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  seqNext: { backgroundColor: Colors.primary },
  seqDone: { backgroundColor: Colors.success },
  seqFail: { backgroundColor: Colors.error },
  seqText: { color: Colors.white, fontFamily: 'Rubik-Bold', fontSize: 12 },
  seqTextDark: { color: Colors.primary },
  stopBody: { flex: 1 },
  stopTop: { flexDirection: 'row', justifyContent: 'space-between' },
  stopRef: { fontFamily: 'Rubik-Bold', color: Colors.font },
  stopState: { color: Colors.textMuted, fontSize: 12, fontFamily: 'Rubik-Medium' },
  stopStateNext: { color: Colors.primary },
  stopStateFail: { color: Colors.error },
  customer: { color: Colors.font, marginTop: 2 },
  address: { color: Colors.textMuted, fontSize: 13, marginTop: 2 },
  leg: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  navBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  navBtnText: { color: Colors.white, fontFamily: 'Rubik-Medium' },
  ghost: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  ghostText: { color: Colors.font, fontFamily: 'Rubik-Medium' },
  start: { marginHorizontal: Spacing.base, marginTop: 8, backgroundColor: Colors.primary, borderRadius: 14, minHeight: 56, alignItems: 'center', justifyContent: 'center' },
  startDisabled: { backgroundColor: '#94A3B8' },
  startText: { color: Colors.white, fontFamily: 'Rubik-Bold', fontSize: 16 },
  startSub: { color: '#E6F6F7', fontSize: 12, marginTop: 2 },
});

export default RouteMapScreen;

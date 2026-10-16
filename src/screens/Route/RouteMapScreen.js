import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import useRouteStore from '../../store/routeStore';
import { openDirections } from '../../utils/permissions';

function mapHtml(route, tracking) {
  const geometry = route?.geometry?.type === 'LineString' ? route.geometry : null;
  const payload = JSON.stringify({
    geometry,
    tracking: tracking?.latitude != null ? { latitude: tracking.latitude, longitude: tracking.longitude, stale: tracking.stale } : null,
    stops: (route?.stops || []).map((stop) => ({
      sequence: stop.sequence,
      latitude: stop.latitude,
      longitude: stop.longitude,
      status: stop.status,
      label: stop.shipmentReference,
      next: route?.nextStop?.id === stop.id,
    })),
  }).replace(/</g, '\\u003c');
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#map{height:100%;margin:0} .num{background:#0092a1;color:#fff;border-radius:12px;padding:2px 6px;font:700 12px sans-serif}</style>
</head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
const data = ${payload};
const map = L.map('map');
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
const bounds = [];
if (data.geometry) {
  const line = data.geometry.coordinates.map((pair) => [pair[1], pair[0]]);
  L.polyline(line, { color: '#0092a1', weight: 5 }).addTo(map);
  line.forEach((point) => bounds.push(point));
}
(data.stops || []).forEach((stop) => {
  if (stop.latitude == null || stop.longitude == null) return;
  const point = [stop.latitude, stop.longitude];
  bounds.push(point);
  const marker = L.circleMarker(point, {
    radius: stop.next ? 11 : 8,
    color: stop.status === 'completed' ? '#737A91' : '#0092a1',
    fillColor: stop.status === 'completed' ? '#E6EAF0' : (stop.next ? '#0092a1' : '#ffffff'),
    fillOpacity: 1,
    weight: 2
  }).addTo(map);
  marker.bindTooltip(String(stop.sequence) + ' ' + stop.label, { permanent: true, direction: 'top', className: 'num' });
});
if (data.tracking) {
  const here = [data.tracking.latitude, data.tracking.longitude];
  bounds.push(here);
  L.circleMarker(here, { radius: 8, color: data.tracking.stale ? '#F59E0B' : '#20243A', fillOpacity: 1 }).addTo(map).bindTooltip(data.tracking.stale ? 'Last location' : 'You');
}
if (bounds.length) map.fitBounds(bounds, { padding: [24, 24] });
else map.setView([20, 0], 2);
</script></body></html>`;
}

const RouteMapScreen = ({ navigation }) => {
  const route = useRouteStore((state) => state.route);
  const tracking = useRouteStore((state) => state.tracking);
  const html = useMemo(() => mapHtml(route, tracking), [route, tracking]);
  const next = route?.nextStop;
  const hasRoad = route?.geometry?.type === 'LineString';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.bar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{route?.code || 'Route'}</Text>
      </View>
      {next ? (
        <View style={styles.summary}>
          <Text style={styles.next}>Next · {next.sequence} · {next.shipmentReference}</Text>
          <Text style={styles.address}>{next.customerName} · {next.address}</Text>
          <Text style={styles.meta}>{route.progressLabel}{tracking?.stale ? ' · Location last update is stale' : ''}</Text>
        </View>
      ) : null}
      {hasRoad ? (
        <WebView originWhitelist={['*']} source={{ html }} style={styles.map} />
      ) : (
        <View style={styles.empty}><Text style={styles.address}>The road route is not available yet. Plan the route again when the routing service responds.</Text></View>
      )}
      {next ? (
        <TouchableOpacity style={styles.navigate} onPress={() => openDirections(next.latitude, next.longitude)}>
          <Text style={styles.navigateText}>Navigate</Text>
        </TouchableOpacity>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgColor },
  bar: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base },
  back: { color: Colors.primary, fontFamily: 'Rubik-Medium', fontSize: 16, marginRight: 12 },
  title: { fontFamily: 'Rubik-Bold', fontSize: 18, color: Colors.font },
  summary: { marginHorizontal: Spacing.base, marginBottom: Spacing.sm, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md },
  next: { fontFamily: 'Rubik-Medium', color: Colors.primary },
  address: { color: Colors.font, marginTop: 4, fontFamily: 'Rubik-Regular' },
  meta: { color: Colors.textMuted, marginTop: 4, fontFamily: 'Rubik-Regular', fontSize: 12 },
  map: { flex: 1 },
  empty: { flex: 1, padding: Spacing.base, justifyContent: 'center' },
  navigate: { margin: Spacing.base, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  navigateText: { color: Colors.white, fontFamily: 'Rubik-Medium', fontSize: 16 },
});

export default RouteMapScreen;

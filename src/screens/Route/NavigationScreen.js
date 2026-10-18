import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import useRouteStore from '../../store/routeStore';
import { openDirections } from '../../utils/permissions';
import { routeMapHtml } from './routeMapHtml';
import { formatDistance, formatDuration } from './routeFormat';

const NavigationScreen = ({ navigation, route }) => {
  const plan = useRouteStore((state) => state.route);
  const tracking = useRouteStore((state) => state.tracking);
  const stop = plan?.stops?.find((item) => item.id === route.params?.stopId) || plan?.nextStop;
  const html = routeMapHtml(plan, tracking, { focusStopId: stop?.id });

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.map}>
        {plan?.geometry?.type === 'LineString' ? (
          <WebView originWhitelist={['*']} source={{ html }} style={styles.map} />
        ) : (
          <View style={styles.fallback}><Text style={styles.meta}>Road geometry is not available. Use maps for driving directions.</Text></View>
        )}
      </View>
      <SafeAreaView edges={['top']} style={styles.top}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>End</Text>
        </TouchableOpacity>
      </SafeAreaView>
      <SafeAreaView edges={['bottom']} style={styles.cardWrap}>
        <View style={styles.card}>
          <Text style={styles.kicker}>Next stop</Text>
          <Text style={styles.title}>{stop?.shipmentReference || 'No stop'}</Text>
          <Text style={styles.body}>{stop?.customerName}</Text>
          <Text style={styles.meta}>{stop?.address}</Text>
          <Text style={styles.meta}>
            {[formatDistance(stop?.legDistanceMeters), formatDuration(stop?.legDurationSeconds)].filter(Boolean).join(' · ') || 'Distance updates after the route is optimized'}
          </Text>
          <Text style={styles.note}>Driving directions open in your maps app. Ending this screen does not cancel the route or deliver the shipment.</Text>
          {tracking?.stale ? <Text style={styles.warn}>Location last update is stale</Text> : null}
          <TouchableOpacity
            style={styles.button}
            onPress={() => openDirections(stop?.latitude, stop?.longitude)}
            disabled={!stop}
          >
            <Text style={styles.buttonText}>Open navigation</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgColor },
  map: { flex: 1, backgroundColor: '#e7eef2' },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  top: { position: 'absolute', top: 0, left: 0, right: 0 },
  back: { alignSelf: 'flex-end', margin: Spacing.base, backgroundColor: Colors.error, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 8 },
  backText: { color: Colors.white, fontFamily: 'Rubik-Bold' },
  cardWrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  card: { margin: Spacing.base, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md },
  kicker: { color: Colors.primary, fontFamily: 'Rubik-Medium' },
  title: { fontFamily: 'Rubik-Bold', fontSize: 22, color: Colors.font, marginTop: 4 },
  body: { color: Colors.font, marginTop: 4, fontFamily: 'Rubik-Medium' },
  meta: { color: Colors.textMuted, marginTop: 4 },
  note: { color: Colors.textMuted, marginTop: 8, fontSize: 12, lineHeight: 18 },
  warn: { color: '#92400E', marginTop: 8, fontFamily: 'Rubik-Medium' },
  button: { marginTop: 12, backgroundColor: Colors.primary, borderRadius: 12, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: Colors.white, fontFamily: 'Rubik-Bold' },
});

export default NavigationScreen;

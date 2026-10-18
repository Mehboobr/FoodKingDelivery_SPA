import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import useRouteStore from '../../store/routeStore';
import useOrderStore from '../../store/orderStore';

function metersBetween(from, to) {
  if (!from || to?.latitude == null) return null;
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * 6371000 * Math.asin(Math.sqrt(a)));
}

const ArrivalScreen = ({ navigation }) => {
  const order = useOrderStore((state) => state.orderDetails);
  const plan = useRouteStore((state) => state.route);
  const tracking = useRouteStore((state) => state.tracking);
  const arrival = useRouteStore((state) => state.arrival);
  const markArrived = useRouteStore((state) => state.markArrived);
  const stop = useMemo(
    () => plan?.stops?.find((item) => item.orderId === order?.id),
    [plan, order],
  );
  const radius = plan?.arrivalRadiusMeters || 120;
  const distance = metersBetween(
    tracking?.latitude != null ? tracking : null,
    stop,
  );
  const inside = arrival?.stopId === stop?.id || (distance != null && distance <= radius && !tracking?.stale);

  const continueProof = async () => {
    if (stop && stop.status !== 'arrived' && stop.status !== 'completed') {
      try {
        await markArrived(stop.id);
      } catch {
        // Manual continuation is still allowed when GPS cannot record arrival.
      }
    }
    navigation.navigate('CustomerSignature', { orderId: order?.id });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹</Text></TouchableOpacity>
        <Text style={styles.title}>Arrived at Customer</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.kicker}>{inside ? `Within ${radius} m` : 'Confirm arrival'}</Text>
        <Text style={styles.ref}>{order?.order_serial_no}</Text>
        <Text style={styles.name}>{order?.user?.name}</Text>
        <Text style={styles.address}>{order?.order_address?.address}</Text>
        <Text style={styles.meta}>
          {distance == null ? 'GPS distance is unavailable. You can confirm arrival manually.' : `${distance} m from the delivery address`}
        </Text>
        <Text style={styles.note}>Arrival does not mark this shipment delivered.</Text>
      </View>
      <View style={styles.actions}>
        {order?.user?.phone ? (
          <TouchableOpacity style={styles.ghost} onPress={() => Linking.openURL(`tel:${order.user.phone}`)}>
            <Text style={styles.ghostText}>Call Customer</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.ghost} onPress={() => navigation.navigate('OrderDetails', { orderId: order?.id })}>
          <Text style={styles.ghostText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primary} onPress={continueProof}>
          <Text style={styles.primaryText}>Continue to Proof of Delivery</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgColor, padding: Spacing.base },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  back: { fontSize: 32, color: Colors.font, marginRight: 8 },
  title: { fontFamily: 'Rubik-Bold', fontSize: 20, color: Colors.font },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md },
  kicker: { color: Colors.primary, fontFamily: 'Rubik-Medium' },
  ref: { fontFamily: 'Rubik-Bold', fontSize: 24, color: Colors.font, marginTop: 6 },
  name: { color: Colors.font, marginTop: 6, fontFamily: 'Rubik-Medium' },
  address: { color: Colors.textMuted, marginTop: 4 },
  meta: { color: Colors.font, marginTop: 12 },
  note: { color: Colors.textMuted, marginTop: 8, fontSize: 12 },
  actions: { marginTop: 'auto', gap: 10 },
  ghost: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white },
  ghostText: { color: Colors.font, fontFamily: 'Rubik-Medium' },
  primary: { backgroundColor: Colors.primary, borderRadius: 12, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: Colors.white, fontFamily: 'Rubik-Bold' },
});

export default ArrivalScreen;

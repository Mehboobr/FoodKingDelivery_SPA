import React, { useMemo } from 'react';
import { Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import CustomButton from '../../components/common/CustomButton';
import useOrderStore from '../../store/orderStore';
import useRouteStore from '../../store/routeStore';
import useProofDraftStore from '../../store/proofDraftStore';
import { driverService } from '../../services/driverService';
import { getCurrentFix } from '../../utils/locationTracker';

const REASONS = [
  ['customer_unavailable', 'Customer unavailable'],
  ['inaccessible_address', 'Inaccessible address'],
  ['refused', 'Refused'],
  ['return_to_warehouse', 'Return to warehouse'],
];

const Check = ({ ok, label }) => (
  <Text style={[styles.check, ok ? styles.ok : styles.missing]}>{ok ? '✓' : '•'} {label}</Text>
);

const DeliveryReviewScreen = ({ navigation }) => {
  const order = useOrderStore((state) => state.orderDetails);
  const routeState = useRouteStore((state) => state.route);
  const loadCurrent = useRouteStore((state) => state.loadCurrent);
  const draft = useProofDraftStore();
  const stop = useMemo(
    () => routeState?.stops?.find((item) => item.orderId === order?.id),
    [routeState, order],
  );
  const paid = order?.payment_status === 5;
  const needsCheque = order?.payment_method === 4 && !paid;
  const arrived = stop?.status === 'arrived' || stop?.status === 'completed';
  const cashRecorded = paid || order?.payment_method !== 1 || draft.collected;
  const ready = Boolean(stop)
    && draft.consent
    && draft.strokes > 0
    && draft.signature
    && cashRecorded
    && (!needsCheque || (draft.front && draft.back));

  const submit = async () => {
    if (!stop) {
      Toast.show({ type: 'error', text1: 'Start the route so this shipment has a stop.' });
      return;
    }
    if (!draft.consent || !(draft.strokes > 0) || !draft.signature) {
      Toast.show({ type: 'error', text1: 'Customer signature and acknowledgement are required.' });
      return;
    }
    if (needsCheque && (!draft.front || !draft.back)) {
      Toast.show({ type: 'error', text1: 'Photograph the front and back of the cheque.' });
      return;
    }
    if (!cashRecorded) {
      Toast.show({ type: 'error', text1: 'Record the cash collection before confirming.' });
      return;
    }
    draft.setSubmitting(true);
    try {
      const fix = await getCurrentFix();
      const form = new FormData();
      form.append('idempotencyKey', draft.idempotencyKey);
      form.append('consent', 'true');
      form.append('signatureStrokes', String(draft.strokes));
      form.append('signatureData', draft.signature);
      form.append('paymentCollected', draft.collected ? 'true' : 'false');
      form.append('capturedAt', new Date().toISOString());
      if (fix?.coords) {
        form.append('latitude', String(fix.coords.latitude));
        form.append('longitude', String(fix.coords.longitude));
      }
      if (draft.front) form.append('chequeFront', draft.front);
      if (draft.back) form.append('chequeBack', draft.back);
      const response = await driverService.complete(stop.id, form);
      const data = response.data?.data;
      if (data?.route) useRouteStore.setState({ route: data.route, message: data.message || '' });
      await loadCurrent().catch(() => {});
      draft.reset();
      navigation.replace('ConfirmDelivery', {
        orderSerialNo: order.order_serial_no,
        orderDatetime: order.order_datetime,
      });
    } catch (error) {
      Toast.show({ type: 'error', text1: error?.response?.data?.message || 'Delivery was not confirmed.' });
    } finally {
      draft.setSubmitting(false);
    }
  };

  const fail = async (reason) => {
    if (!stop || draft.submitting) return;
    draft.setSubmitting(true);
    try {
      const response = await driverService.fail(stop.id, { reason, idempotencyKey: draft.failKey });
      const data = response.data?.data;
      if (data?.route) useRouteStore.setState({ route: data.route, message: data.message || '' });
      Toast.show({ type: 'success', text1: 'Attempt recorded. The shipment was not delivered.' });
      draft.reset();
      navigation.popToTop();
    } catch (error) {
      Toast.show({ type: 'error', text1: error?.response?.data?.message || 'Could not record the attempt.' });
    } finally {
      draft.setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Confirm Delivery</Text>
        <Text style={styles.ref}>{order?.order_serial_no}</Text>
        <Text style={styles.body}>{order?.user?.name}</Text>
        <Text style={styles.body}>{order?.order_address?.address}</Text>
        <Check ok={arrived} label="Arrival recorded, or continue after manual confirmation" />
        <Check ok={draft.strokes > 0 && Boolean(draft.signature)} label="Customer signature captured" />
        <Check ok={draft.consent} label="Customer acknowledgement ticked" />
        <Check ok={!needsCheque || Boolean(draft.front)} label={needsCheque ? 'Cheque front uploaded' : 'Cheque front not required'} />
        <Check ok={!needsCheque || Boolean(draft.back)} label={needsCheque ? 'Cheque back uploaded' : 'Cheque back not required'} />
        <Check ok={cashRecorded} label={paid ? 'Payment already recorded' : (draft.collected ? 'Cash collection noted' : 'Payment still needs to be recorded')} />
        <CustomButton title="Confirm Delivery" onPress={submit} loading={draft.submitting} disabled={!ready || draft.submitting} />
        <Text style={styles.section}>Could not deliver</Text>
        {REASONS.map(([code, label]) => (
          <TouchableOpacity key={code} style={styles.reason} onPress={() => fail(code)} disabled={draft.submitting}>
            <Text style={styles.reasonText}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgColor },
  content: { padding: Spacing.base, paddingBottom: 32 },
  title: { fontFamily: 'Rubik-Bold', fontSize: 24, color: Colors.font },
  ref: { fontFamily: 'Rubik-Bold', fontSize: 18, color: Colors.font, marginTop: 12 },
  body: { color: Colors.font, marginTop: 4 },
  check: { marginTop: 10, fontFamily: 'Rubik-Medium' },
  ok: { color: '#15803D' },
  missing: { color: Colors.textMuted },
  section: { marginTop: 24, marginBottom: 8, fontFamily: 'Rubik-Medium', color: Colors.font },
  reason: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: 14, marginBottom: 8 },
  reasonText: { color: Colors.error, fontFamily: 'Rubik-Medium' },
});

export default DeliveryReviewScreen;

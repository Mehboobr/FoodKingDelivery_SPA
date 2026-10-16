import React, { useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import CustomButton from '../../components/common/CustomButton';
import SvgIcon from '../../components/common/SvgIcon';
import useOrderStore from '../../store/orderStore';
import useRouteStore from '../../store/routeStore';
import { driverService } from '../../services/driverService';
import { getCurrentFix } from '../../utils/locationTracker';

const SIGNATURE_HTML = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
<style>
  html,body{margin:0;height:100%;background:#fff}
  canvas{width:100%;height:100%;touch-action:none}
</style></head><body><canvas id="pad"></canvas><script>
const canvas = document.getElementById('pad');
const ctx = canvas.getContext('2d');
let empty = true;
let strokes = 0;
function resize(){
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, rect.width * 2);
  canvas.height = Math.max(1, rect.height * 2);
  ctx.setTransform(2,0,0,2,0,0);
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#20243A';
}
resize();
let drawing = false;
function point(event){
  const touch = event.touches ? event.touches[0] : event;
  const rect = canvas.getBoundingClientRect();
  return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
}
canvas.addEventListener('touchstart', (event) => {
  drawing = true;
  const p = point(event);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  event.preventDefault();
}, {passive:false});
canvas.addEventListener('touchmove', (event) => {
  if (!drawing) return;
  const p = point(event);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  empty = false;
  event.preventDefault();
}, {passive:false});
canvas.addEventListener('touchend', () => { if (!empty) strokes += 1; drawing = false; });
window.saveSignature = function(){
  window.ReactNativeWebView.postMessage(JSON.stringify({
    ok: !empty && strokes > 0,
    strokes,
    data: empty ? '' : canvas.toDataURL('image/png')
  }));
};
window.clearSignature = function(){ empty = true; strokes = 0; resize(); };
</script></body></html>`;

function uuid() {
  if (global.crypto?.randomUUID) return global.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

const REASONS = [
  ['customer_unavailable', 'Customer unavailable'],
  ['inaccessible_address', 'Inaccessible address'],
  ['refused', 'Refused'],
  ['return_to_warehouse', 'Return to warehouse'],
];

const ProofOfDeliveryScreen = ({ navigation, route }) => {
  const order = useOrderStore((state) => state.orderDetails);
  const routeState = useRouteStore((state) => state.route);
  const loadCurrent = useRouteStore((state) => state.loadCurrent);
  const webRef = useRef(null);
  const signatureWait = useRef(null);
  const idempotencyKey = useRef(uuid());
  const failKey = useRef(uuid());
  const [signature, setSignature] = useState(null);
  const [strokes, setStrokes] = useState(0);
  const [consent, setConsent] = useState(false);
  const [collected, setCollected] = useState(false);
  const [front, setFront] = useState(null);
  const [back, setBack] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const stop = useMemo(
    () => routeState?.stops?.find((item) => item.orderId === order?.id),
    [routeState, order],
  );
  const needsCheque = order?.payment_method === 4 && order?.payment_status !== 5;
  const needsCash = order?.payment_method === 1 && order?.payment_status === 10;

  const capture = async (setter) => {
    const result = await launchCamera({ mediaType: 'photo', quality: 0.5, maxWidth: 1600, maxHeight: 1600 });
    const asset = result.assets?.[0] || (await launchImageLibrary({ mediaType: 'photo', quality: 0.5, maxWidth: 1600 })).assets?.[0];
    if (!asset?.uri) return;
    setter({ uri: asset.uri, type: asset.type || 'image/jpeg', name: asset.fileName || 'cheque.jpg' });
  };

  const onSignature = (event) => {
    let payload;
    try {
      payload = JSON.parse(event.nativeEvent.data);
    } catch {
      Toast.show({ type: 'error', text1: 'Could not read the signature.' });
      return;
    }
    if (payload.ok) {
      setSignature(payload.data);
      setStrokes(payload.strokes);
    } else if (!signatureWait.current) {
      Toast.show({ type: 'error', text1: 'Draw the customer signature before saving.' });
      setSignature(null);
      setStrokes(0);
    }
    if (signatureWait.current) {
      const resolve = signatureWait.current;
      signatureWait.current = null;
      resolve(payload);
    }
  };

  const readSignature = () => new Promise((resolve) => {
    if (signature && strokes > 0) {
      resolve({ ok: true, data: signature, strokes });
      return;
    }
    signatureWait.current = resolve;
    webRef.current?.injectJavaScript('window.saveSignature(); true;');
    setTimeout(() => {
      if (signatureWait.current) {
        signatureWait.current({ ok: false });
        signatureWait.current = null;
      }
    }, 1500);
  });

  const submit = async () => {
    if (!stop) {
      Toast.show({ type: 'error', text1: 'Start the route so this shipment has a stop.' });
      return;
    }
    if (!consent) {
      Toast.show({ type: 'error', text1: 'Tick the acknowledgement checkbox.' });
      return;
    }
    const saved = await readSignature();
    if (!saved.ok) {
      Toast.show({ type: 'error', text1: 'Draw the customer signature.' });
      return;
    }
    if (needsCheque && (!front || !back)) {
      Toast.show({ type: 'error', text1: 'Photograph the front and back of the cheque.' });
      return;
    }
    setSubmitting(true);
    try {
      const fix = await getCurrentFix();
      const form = new FormData();
      form.append('idempotencyKey', idempotencyKey.current);
      form.append('consent', 'true');
      form.append('signatureStrokes', String(saved.strokes));
      form.append('signatureData', saved.data);
      form.append('paymentCollected', collected ? 'true' : 'false');
      form.append('capturedAt', new Date().toISOString());
      if (fix?.coords) {
        form.append('latitude', String(fix.coords.latitude));
        form.append('longitude', String(fix.coords.longitude));
      }
      if (front) form.append('chequeFront', front);
      if (back) form.append('chequeBack', back);
      const response = await driverService.complete(stop.id, form);
      const data = response.data?.data;
      if (data?.route) useRouteStore.setState({ route: data.route, message: data.message || '' });
      await loadCurrent().catch(() => {});
      navigation.replace('ConfirmDelivery', {
        orderSerialNo: order.order_serial_no,
        orderDatetime: order.order_datetime,
      });
    } catch (error) {
      Toast.show({ type: 'error', text1: error?.response?.data?.message || 'Delivery was not confirmed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const fail = async (reason) => {
    if (!stop) return;
    setSubmitting(true);
    try {
      const response = await driverService.fail(stop.id, { reason, idempotencyKey: failKey.current });
      const data = response.data?.data;
      if (data?.route) useRouteStore.setState({ route: data.route, message: data.message || '' });
      Toast.show({ type: 'success', text1: 'Attempt recorded. The shipment was not delivered.' });
      navigation.popToTop();
    } catch (error) {
      Toast.show({ type: 'error', text1: error?.response?.data?.message || 'Could not record the attempt.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.brand}>Encore Driver</Text>
        <Text style={styles.title}>Proof of delivery</Text>
        <Text style={styles.ref}>{order?.order_serial_no} · {order?.user?.name}</Text>
        <Text style={styles.note}>
          {order?.payment_status === 5 ? 'This shipment is already paid.' : 'Collect payment only if it is still unpaid.'}
          {needsCheque ? ' Cheque photographs are evidence. They do not confirm the payment by themselves.' : ''}
        </Text>

        {needsCash ? (
          <TouchableOpacity
            style={styles.check}
            onPress={() => setCollected((value) => !value)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: collected }}
          >
            <SvgIcon
              name={collected ? 'ticked_yes_square' : 'ticked_no_square'}
              width={22}
              height={22}
              color={collected ? Colors.primary : Colors.textMuted}
            />
            <Text style={styles.checkText}>Cash collected · {order.total_currency_price}</Text>
          </TouchableOpacity>
        ) : null}

        {needsCheque ? (
          <View>
            <Text style={styles.section}>Cheque Front</Text>
            <TouchableOpacity style={styles.photo} onPress={() => capture(setFront)}>
              {front ? <Image source={{ uri: front.uri }} style={styles.preview} /> : <Text style={styles.photoText}>Capture cheque front</Text>}
            </TouchableOpacity>
            <Text style={styles.section}>Cheque Back</Text>
            <TouchableOpacity style={styles.photo} onPress={() => capture(setBack)}>
              {back ? <Image source={{ uri: back.uri }} style={styles.preview} /> : <Text style={styles.photoText}>Capture cheque back</Text>}
            </TouchableOpacity>
          </View>
        ) : null}

        <Text style={styles.section}>Customer Signature</Text>
        <View style={styles.pad}>
          <WebView
            ref={webRef}
            originWhitelist={['*']}
            source={{ html: SIGNATURE_HTML }}
            onMessage={onSignature}
            scrollEnabled={false}
            style={styles.web}
          />
        </View>
        <View style={styles.row}>
          <TouchableOpacity onPress={() => { webRef.current?.injectJavaScript('window.clearSignature(); true;'); setSignature(null); setStrokes(0); }}>
            <Text style={styles.link}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => webRef.current?.injectJavaScript('window.saveSignature(); true;')}>
            <Text style={styles.link}>Save Signature</Text>
          </TouchableOpacity>
        </View>
        {signature ? <Image source={{ uri: signature }} style={styles.signaturePreview} /> : null}

        <TouchableOpacity
          style={styles.check}
          onPress={() => setConsent((value) => !value)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: consent }}
          accessibilityLabel="The customer acknowledges receipt of this shipment."
        >
          <SvgIcon
            name={consent ? 'ticked_yes_square' : 'ticked_no_square'}
            width={22}
            height={22}
            color={consent ? Colors.primary : Colors.textMuted}
          />
          <Text style={styles.checkText}>The customer acknowledges receipt of this shipment.</Text>
        </TouchableOpacity>

        <CustomButton title="Confirm Delivery" onPress={submit} loading={submitting} disabled={submitting} />

        <Text style={styles.section}>Could not deliver</Text>
        {REASONS.map(([code, label]) => (
          <TouchableOpacity key={code} style={styles.reason} onPress={() => fail(code)} disabled={submitting}>
            <Text style={styles.reasonText}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgColor },
  content: { padding: Spacing.base, paddingBottom: 40 },
  brand: { color: Colors.primary, fontFamily: 'Rubik-Medium' },
  title: { fontFamily: 'Rubik-Bold', fontSize: 24, color: Colors.font, marginTop: 4 },
  ref: { ...Typography.body, color: Colors.font, marginTop: 4 },
  note: { ...Typography.body, color: Colors.textMuted, marginTop: 8, lineHeight: 20 },
  section: { fontFamily: 'Rubik-Medium', color: Colors.font, marginTop: Spacing.lg, marginBottom: 8 },
  pad: { height: 220, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.lg, overflow: 'hidden', backgroundColor: Colors.white },
  web: { flex: 1, backgroundColor: Colors.white },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  link: { color: Colors.primary, fontFamily: 'Rubik-Medium', fontSize: 16 },
  signaturePreview: { height: 80, marginTop: 8, resizeMode: 'contain', backgroundColor: Colors.white, borderRadius: BorderRadius.md },
  check: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.md, gap: 10, minHeight: 44 },
  checkText: { flex: 1, color: Colors.font, fontFamily: 'Rubik-Regular', fontSize: 15, lineHeight: 20 },
  photo: { height: 140, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoText: { color: Colors.primary, fontFamily: 'Rubik-Medium' },
  preview: { width: '100%', height: '100%', resizeMode: 'cover' },
  reason: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: 14, marginBottom: 8 },
  reasonText: { color: Colors.error, fontFamily: 'Rubik-Medium' },
});

export default ProofOfDeliveryScreen;

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import Toast from 'react-native-toast-message';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import CustomButton from '../../components/common/CustomButton';
import SvgIcon from '../../components/common/SvgIcon';
import useOrderStore from '../../store/orderStore';
import useProofDraftStore from '../../store/proofDraftStore';
import { SIGNATURE_HTML } from './signaturePad';

const CustomerSignatureScreen = ({ navigation }) => {
  const order = useOrderStore((state) => state.orderDetails);
  const begin = useProofDraftStore((state) => state.begin);
  const signature = useProofDraftStore((state) => state.signature);
  const strokes = useProofDraftStore((state) => state.strokes);
  const consent = useProofDraftStore((state) => state.consent);
  const setSignature = useProofDraftStore((state) => state.setSignature);
  const setConsent = useProofDraftStore((state) => state.setConsent);
  const webRef = useRef(null);
  const wait = useRef(null);

  useEffect(() => {
    begin(order?.id);
  }, [begin, order?.id]);

  const onMessage = (event) => {
    let payload;
    try {
      payload = JSON.parse(event.nativeEvent.data);
    } catch {
      Toast.show({ type: 'error', text1: 'Could not read the signature.' });
      return;
    }
    if (payload.ok) setSignature(payload.data, payload.strokes);
    else if (!wait.current) {
      Toast.show({ type: 'error', text1: 'Draw the customer signature before saving.' });
      setSignature(null, 0);
    }
    if (wait.current) {
      const resolve = wait.current;
      wait.current = null;
      resolve(payload);
    }
  };

  const readSignature = () => new Promise((resolve) => {
    if (signature && strokes > 0) {
      resolve({ ok: true, data: signature, strokes });
      return;
    }
    wait.current = resolve;
    webRef.current?.injectJavaScript('window.saveSignature(); true;');
    setTimeout(() => {
      if (wait.current) {
        wait.current({ ok: false });
        wait.current = null;
      }
    }, 1500);
  });

  const next = async () => {
    if (!consent) {
      Toast.show({ type: 'error', text1: 'Tick the acknowledgement checkbox.' });
      return;
    }
    const saved = await readSignature();
    if (!saved.ok) {
      Toast.show({ type: 'error', text1: 'Draw the customer signature.' });
      return;
    }
    setSignature(saved.data, saved.strokes);
    navigation.navigate('PaymentCollection');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Go back"><Text style={styles.back}>‹</Text></TouchableOpacity>
        <Text style={styles.title}>Customer Signature</Text>
      </View>
      <Text style={styles.note}>Ask the customer to sign to acknowledge receipt of this shipment.</Text>
      <Text style={styles.ref}>{order?.order_serial_no} · {order?.user?.name}</Text>
      <View style={styles.pad}>
        <WebView
          ref={webRef}
          originWhitelist={['*']}
          source={{ html: SIGNATURE_HTML }}
          onMessage={onMessage}
          scrollEnabled={false}
          style={styles.web}
        />
      </View>
      <View style={styles.row}>
        <TouchableOpacity onPress={() => { webRef.current?.injectJavaScript('window.clearSignature(); true;'); setSignature(null, 0); }}>
          <Text style={styles.link}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => webRef.current?.injectJavaScript('window.saveSignature(); true;')}>
          <Text style={styles.link}>Save Signature</Text>
        </TouchableOpacity>
      </View>
      {signature ? <Image source={{ uri: signature }} style={styles.preview} /> : null}
      <TouchableOpacity
        style={styles.check}
        onPress={() => setConsent(!consent)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: consent }}
        accessibilityLabel="The customer acknowledges receipt of this shipment."
      >
        <SvgIcon name={consent ? 'ticked_yes_square' : 'ticked_no_square'} width={22} height={22} color={consent ? Colors.primary : Colors.textMuted} />
        <Text style={styles.checkText}>The customer acknowledges receipt of this shipment.</Text>
      </TouchableOpacity>
      <CustomButton title="Next" onPress={next} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgColor, padding: Spacing.base },
  header: { flexDirection: 'row', alignItems: 'center' },
  back: { fontSize: 32, color: Colors.font, width: 36 },
  title: { flex: 1, textAlign: 'center', fontFamily: 'Rubik-Bold', fontSize: 18, color: Colors.font, marginRight: 36 },
  note: { color: Colors.textMuted, marginTop: 12, lineHeight: 20 },
  ref: { color: Colors.font, marginTop: 6, fontFamily: 'Rubik-Medium' },
  pad: { height: 220, marginTop: 12, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.lg, overflow: 'hidden', backgroundColor: Colors.white },
  web: { flex: 1, backgroundColor: Colors.white },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  link: { color: Colors.primary, fontFamily: 'Rubik-Medium', fontSize: 16 },
  preview: { height: 72, marginTop: 8, resizeMode: 'contain', backgroundColor: Colors.white, borderRadius: BorderRadius.md },
  check: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, marginVertical: 12 },
  checkText: { flex: 1, color: Colors.font, fontSize: 15, lineHeight: 20 },
});

export default CustomerSignatureScreen;

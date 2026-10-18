import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import CustomButton from '../../components/common/CustomButton';
import SvgIcon from '../../components/common/SvgIcon';
import useOrderStore from '../../store/orderStore';
import useProofDraftStore from '../../store/proofDraftStore';

function methodLabel(order) {
  if (order?.payment_method === 4) return 'Cheque';
  if (order?.payment_method === 1) return 'Cash';
  if (order?.payment_method === 2) return 'Card';
  if (order?.payment_method === 3) return 'Wallet';
  return 'Not specified';
}

const PaymentCollectionScreen = ({ navigation }) => {
  const order = useOrderStore((state) => state.orderDetails);
  const collected = useProofDraftStore((state) => state.collected);
  const setCollected = useProofDraftStore((state) => state.setCollected);
  const paid = order?.payment_status === 5;
  const needsCheque = order?.payment_method === 4 && !paid;
  const needsCash = order?.payment_method === 1 && !paid;

  const next = () => {
    navigation.navigate(needsCheque ? 'ChequeDetails' : 'DeliveryReview');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Go back"><Text style={styles.back}>‹</Text></TouchableOpacity>
        <Text style={styles.title}>Payment Collection</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.ref}>{order?.order_serial_no}</Text>
        <Text style={styles.amount}>{order?.total_currency_price || '—'}</Text>
        <Text style={styles.meta}>Amount on the shipment</Text>
        <Text style={styles.line}>Method: {methodLabel(order)}</Text>
        <Text style={styles.line}>Status: {paid ? 'Already paid' : 'Due'}</Text>
        {paid ? <Text style={styles.note}>Nothing further is collected. This step does not change the payment record.</Text> : null}
        {needsCheque ? <Text style={styles.note}>A cheque photo is evidence only. It does not mark the payment as cleared.</Text> : null}
      </View>
      {needsCash ? (
        <TouchableOpacity
          style={styles.check}
          onPress={() => setCollected(!collected)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: collected }}
        >
          <SvgIcon name={collected ? 'ticked_yes_square' : 'ticked_no_square'} width={22} height={22} color={collected ? Colors.primary : Colors.textMuted} />
          <Text style={styles.checkText}>Cash collected · {order?.total_currency_price}</Text>
        </TouchableOpacity>
      ) : null}
      <CustomButton title="Next" onPress={next} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgColor, padding: Spacing.base },
  header: { flexDirection: 'row', alignItems: 'center' },
  back: { fontSize: 32, color: Colors.font, width: 36 },
  title: { flex: 1, textAlign: 'center', fontFamily: 'Rubik-Bold', fontSize: 18, color: Colors.font, marginRight: 36 },
  card: { marginTop: 16, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg },
  ref: { color: Colors.textMuted, fontFamily: 'Rubik-Medium' },
  amount: { fontFamily: 'Rubik-Bold', fontSize: 36, color: Colors.font, marginTop: 8 },
  meta: { color: Colors.textMuted, marginTop: 4 },
  line: { color: Colors.font, marginTop: 12, fontFamily: 'Rubik-Medium' },
  note: { color: Colors.textMuted, marginTop: 12, lineHeight: 20 },
  check: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, marginVertical: 16 },
  checkText: { flex: 1, color: Colors.font, fontSize: 15 },
});

export default PaymentCollectionScreen;

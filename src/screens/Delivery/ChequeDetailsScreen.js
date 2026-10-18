import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import CustomButton from '../../components/common/CustomButton';
import useProofDraftStore from '../../store/proofDraftStore';
import { captureChequePhoto } from './captureCheque';

const Side = ({ label, photo, onCapture }) => (
  <View style={styles.side}>
    <Text style={styles.label}>{label} (Required)</Text>
    <TouchableOpacity style={styles.photo} onPress={onCapture} accessibilityLabel={`Capture ${label}`}>
      {photo ? <Image source={{ uri: photo.uri }} style={styles.image} /> : <Text style={styles.placeholder}>Capture</Text>}
    </TouchableOpacity>
    {photo ? <TouchableOpacity onPress={onCapture}><Text style={styles.retake}>Retake</Text></TouchableOpacity> : null}
  </View>
);

const ChequeDetailsScreen = ({ navigation }) => {
  const front = useProofDraftStore((state) => state.front);
  const back = useProofDraftStore((state) => state.back);
  const setFront = useProofDraftStore((state) => state.setFront);
  const setBack = useProofDraftStore((state) => state.setBack);

  const take = async (setter) => {
    try {
      const photo = await captureChequePhoto();
      if (photo) setter(photo);
    } catch {
      Toast.show({ type: 'error', text1: 'Camera permission is required to photograph the cheque.' });
    }
  };

  const next = () => {
    if (!front || !back) {
      Toast.show({ type: 'error', text1: 'Photograph the front and back of the cheque.' });
      return;
    }
    navigation.navigate('DeliveryReview');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Go back"><Text style={styles.back}>‹</Text></TouchableOpacity>
        <Text style={styles.title}>Cheque Details</Text>
      </View>
      <Text style={styles.note}>These photos are delivery evidence. Uploading them does not mark the cheque as cleared.</Text>
      <Side label="Front Side" photo={front} onCapture={() => take(setFront)} />
      <Side label="Back Side" photo={back} onCapture={() => take(setBack)} />
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
  side: { marginTop: 16 },
  label: { fontFamily: 'Rubik-Medium', color: Colors.font, marginBottom: 8 },
  photo: { height: 150, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholder: { color: Colors.primary, fontFamily: 'Rubik-Medium' },
  retake: { color: Colors.primary, fontFamily: 'Rubik-Medium', marginTop: 8 },
});

export default ChequeDetailsScreen;

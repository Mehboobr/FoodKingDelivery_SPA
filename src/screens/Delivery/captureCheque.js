import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

export async function captureChequePhoto() {
  const camera = await launchCamera({ mediaType: 'photo', quality: 0.5, maxWidth: 1600, maxHeight: 1600 });
  const asset = camera.assets?.[0]
    || (await launchImageLibrary({ mediaType: 'photo', quality: 0.5, maxWidth: 1600, maxHeight: 1600 })).assets?.[0];
  if (!asset?.uri) return null;
  return { uri: asset.uri, type: asset.type || 'image/jpeg', name: asset.fileName || 'cheque.jpg' };
}

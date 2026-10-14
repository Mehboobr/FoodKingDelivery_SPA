import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, StatusBar, ScrollView,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { BorderRadius, Spacing, Shadows } from '../../constants/spacing';
import { Strings } from '../../constants/strings';
import CustomInput from '../../components/common/CustomInput';
import CustomButton from '../../components/common/CustomButton';
import LoaderOverlay from '../../components/common/LoaderOverlay';
import SvgIcon from '../../components/common/SvgIcon';
import useProfileStore from '../../store/profileStore';
import useConfigStore from '../../store/configStore';
import { validateProfileForm } from '../../utils/validation';

const EditProfileScreen = ({ navigation }) => {
  const { profileData, loaders, updateProfile } = useProfileStore();
  const { countryInfo } = useConfigStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (profileData) {
      setFirstName(profileData.first_name || '');
      setLastName(profileData.last_name || '');
      setEmail(profileData.email || '');
      setPhone(profileData.phone || '');
    }
  }, [profileData]);

  const handleUpdate = async () => {
    const { isValid, errors: validationErrors } = validateProfileForm(
      firstName,
      lastName,
      email
    );

    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    try {
      await updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        country_code: countryInfo?.calling_code || '',
      });
      Toast.show({ type: 'success', text1: Strings.profileUpdatedSuccessfully });
      navigation.goBack();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message || Strings.somethingWrong,
      });
    }
  };

  const flagEmoji = countryInfo?.flag_emoji || '🌐';
  const callingCode = countryInfo?.calling_code || '+1';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgColor} />
      <LoaderOverlay visible={loaders.updateProfile} />

      {/* App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <SvgIcon name="back" width={24} height={24} color={Colors.font} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>{Strings.editProfile}</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <CustomInput
              label={Strings.firstName}
              value={firstName}
              onChangeText={(t) => {
                setFirstName(t);
                setErrors((e) => ({ ...e, firstName: '' }));
              }}
              error={errors.firstName}
              placeholder={Strings.pleaseTypeFirstName}
              returnKeyType="next"
            />

            <CustomInput
              label={Strings.lastName}
              value={lastName}
              onChangeText={(t) => {
                setLastName(t);
                setErrors((e) => ({ ...e, lastName: '' }));
              }}
              error={errors.lastName}
              placeholder={Strings.pleaseTypeLastName}
              returnKeyType="next"
            />

            <CustomInput
              label={Strings.email}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setErrors((e) => ({ ...e, email: '' }));
              }}
              error={errors.email}
              keyboardType="email-address"
              placeholder={Strings.pleaseTypeEmail}
              returnKeyType="next"
              autoComplete="email"
            />

            {/* Mobile Number with Country Prefix Box */}
            <View style={styles.phoneSection}>
              <Text style={styles.inputLabel}>{Strings.mobileNumber}</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.countryCodeBox}>
                  <Text style={styles.flagText}>{flagEmoji}</Text>
                  <Text style={styles.callingCodeText}>{callingCode}</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="Phone number"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            <CustomButton
              title={Strings.updateProfile}
              onPress={handleUpdate}
              loading={loaders.updateProfile}
              disabled={loaders.updateProfile}
              style={styles.btn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgColor },
  flex: { flex: 1 },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bgColor,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  appBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Rubik-Bold',
    fontSize: 18,
    color: Colors.font,
  },
  content: { padding: Spacing.base },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadows.card,
  },
  phoneSection: {
    marginBottom: Spacing.base,
  },
  inputLabel: {
    ...Typography.bodyMedium,
    color: Colors.font,
    marginBottom: Spacing.xs,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.itemBg,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    height: 50,
    gap: 4,
  },
  flagText: {
    fontSize: 18,
  },
  callingCodeText: {
    ...Typography.bodyMedium,
    color: Colors.font,
  },
  phoneInput: {
    flex: 1,
    height: 50,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.base,
    ...Typography.body,
    color: Colors.font,
  },
  btn: {
    marginTop: Spacing.md,
  },
});

export default EditProfileScreen;

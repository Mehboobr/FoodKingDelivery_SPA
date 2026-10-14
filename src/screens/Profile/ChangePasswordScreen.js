import React, { useState } from 'react';
import {
  View, Text, StyleSheet, StatusBar, ScrollView, KeyboardAvoidingView,
  Platform, TouchableOpacity,
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
import { validatePasswordChangeForm } from '../../utils/validation';

const ChangePasswordScreen = ({ navigation }) => {
  const { loaders, changePassword } = useProfileStore();
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});

  const handleUpdate = async () => {
    const { isValid, errors: validationErrors } = validatePasswordChangeForm(
      oldPass,
      newPass,
      confirmPass
    );

    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    try {
      await changePassword({
        old_password: oldPass,
        password: newPass,
        password_confirmation: confirmPass,
      });
      Toast.show({ type: 'success', text1: Strings.passwordUpdatedSuccessfully });
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
      navigation.goBack();
    } catch (err) {
      const msg =
        err?.response?.data?.errors?.password?.[0] ||
        err?.response?.data?.errors?.old_password?.[0] ||
        err?.response?.data?.message ||
        Strings.somethingWrong;
      Toast.show({ type: 'error', text1: msg });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgColor} />
      <LoaderOverlay visible={loaders.changePassword} />

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
        <Text style={styles.appBarTitle}>{Strings.changePassword}</Text>
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
              label={Strings.oldPassword}
              value={oldPass}
              onChangeText={(t) => {
                setOldPass(t);
                setErrors((e) => ({ ...e, oldPassword: '' }));
              }}
              error={errors.oldPassword}
              secureTextEntry={!showOld}
              onToggleSecure={() => setShowOld((v) => !v)}
              placeholder="Enter old password"
            />

            <CustomInput
              label={Strings.newPassword}
              value={newPass}
              onChangeText={(t) => {
                setNewPass(t);
                setErrors((e) => ({ ...e, newPassword: '' }));
              }}
              error={errors.newPassword}
              secureTextEntry={!showNew}
              onToggleSecure={() => setShowNew((v) => !v)}
              placeholder="Enter new password (min 6 characters)"
            />

            <CustomInput
              label={Strings.retypeNewPassword}
              value={confirmPass}
              onChangeText={(t) => {
                setConfirmPass(t);
                setErrors((e) => ({ ...e, confirmPassword: '' }));
              }}
              error={errors.confirmPassword}
              secureTextEntry={!showConfirm}
              onToggleSecure={() => setShowConfirm((v) => !v)}
              placeholder="Re-type new password"
            />

            <CustomButton
              title="Update"
              onPress={handleUpdate}
              loading={loaders.changePassword}
              disabled={loaders.changePassword}
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
  btn: {
    marginTop: Spacing.md,
  },
});

export default ChangePasswordScreen;

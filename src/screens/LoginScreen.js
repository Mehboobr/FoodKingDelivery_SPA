import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, ScrollView,
  Platform, StatusBar, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { BorderRadius, Spacing, Shadows } from '../constants/spacing';
import { Strings } from '../constants/strings';
import CustomInput from '../components/common/CustomInput';
import CustomButton from '../components/common/CustomButton';
import SvgIcon from '../components/common/SvgIcon';
import useAuthStore from '../store/authStore';
import useProfileStore from '../store/profileStore';
import storage from '../utils/storage';
import { registerFCMToken } from '../utils/notifications';
import { validateLoginForm } from '../utils/validation';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { login } = useAuthStore();
  const { getProfile } = useProfileStore();

  useEffect(() => {
    // Check if rememberMe credentials exist
    storage.getRememberMe().then((saved) => {
      if (saved?.email) {
        setEmail(saved.email);
        if (saved.password) setPassword(saved.password);
        setRememberMe(true);
      }
    });
  }, []);

  const handleLogin = async () => {
    const { isValid, errors: validationErrors } = validateLoginForm(email, password);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);

      // Save or remove Remember Me credentials
      if (rememberMe) {
        await storage.setRememberMe({ email: email.trim(), password });
      } else {
        await storage.removeRememberMe();
      }

      // Fire-and-forget: Register FCM Token and fetch profile
      registerFCMToken().catch(() => { });
      getProfile().catch(() => { });

      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (err) {
      const message =
        err?.response?.data?.errors?.validation?.[0] ||
        err?.response?.data?.message ||
        err?.message ||
        'Network error. Please check your connection.';
      Toast.show({ type: 'error', text1: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.primaryBackground} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoRow}>
            <View style={styles.brandMark}><Text style={styles.brandMarkText}>E</Text></View>
            <Text style={styles.brandName}>Encore Driver</Text>
          </View>

          {/* Headline */}
          <View style={styles.headlineSection}>
            <Text style={styles.welcomeText}>{Strings.welcomeBack}</Text>
            <Text style={styles.subText}>Sign in to manage your deliveries</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <CustomInput
              label={Strings.emailOrUsername}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setErrors((e) => ({ ...e, identifier: '' }));
              }}
              error={errors.identifier}
              keyboardType="email-address"
              placeholder="Enter email or username"
              returnKeyType="next"
              autoComplete="email"
            />

            <CustomInput
              label={Strings.password}
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setErrors((e) => ({ ...e, password: '' }));
              }}
              error={errors.password}
              secureTextEntry={!showPassword}
              onToggleSecure={() => setShowPassword((v) => !v)}
              placeholder="Enter your password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            {/* Remember Me with SVG check icons */}
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe((v) => !v)}
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityLabel={Strings.rememberMe}
              accessibilityState={{ checked: rememberMe }}
            >
              <View style={styles.checkboxWrapper}>
                <SvgIcon
                  name={rememberMe ? 'ticked_yes_square' : 'ticked_no_square'}
                  width={20}
                  height={20}
                />
              </View>
              <Text style={styles.rememberText}>{Strings.rememberMe}</Text>
            </TouchableOpacity>

            <CustomButton
              title="Login"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.loginBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.primaryBackground,
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: Spacing.base,
    paddingTop: Spacing.xl,
    justifyContent: 'center',
  },
  logoRow: {
    marginBottom: Spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  brandMarkText: {
    color: Colors.white,
    fontFamily: 'Rubik-Bold',
    fontSize: 22,
  },
  brandName: {
    fontFamily: 'Rubik-Bold',
    fontSize: 22,
    color: Colors.font,
  },
  headlineSection: {
    marginBottom: Spacing.xl,
  },
  welcomeText: {
    fontFamily: 'Rubik-Bold',
    fontSize: 28,
    color: Colors.font,
    marginBottom: Spacing.xs,
  },
  subText: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadows.card,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.xs,
  },
  checkboxWrapper: {
    marginRight: Spacing.sm,
  },
  rememberText: {
    ...Typography.regular,
    color: Colors.font,
    fontFamily: 'Rubik-Regular',
  },
  loginBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
  },
});

export default LoginScreen;

import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, StatusBar, TouchableOpacity,
  Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { launchImageLibrary } from 'react-native-image-picker';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { BorderRadius, Spacing, Shadows } from '../../constants/spacing';
import { Strings } from '../../constants/strings';
import ProfileMenuItem from '../../components/profile/ProfileMenuItem';
import LoaderOverlay from '../../components/common/LoaderOverlay';
import SvgIcon from '../../components/common/SvgIcon';
import Images from '../../assets/images/index';
import useProfileStore from '../../store/profileStore';
import useAuthStore from '../../store/authStore';
import useOrderStore from '../../store/orderStore';
import useConfigStore from '../../store/configStore';

const ProfileScreen = ({ navigation }) => {
  const { profileData, branchDataList, pageDataList, loaders, getProfile, updateProfileImage } =
    useProfileStore();
  const { branchId, logout } = useAuthStore();
  const { countryInfo } = useConfigStore();
  const resetOrders = useOrderStore((s) => s.reset);

  useFocusEffect(
    useCallback(() => {
      getProfile().catch(() => {});
    }, [getProfile])
  );

  const getBranchName = () => {
    if (branchId === 0) return Strings.allBranch;
    const branch = branchDataList.find((b) => b.id === branchId);
    return branch?.name || Strings.allBranch;
  };

  const handlePickImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.didCancel || !result.assets?.length) return;

    const asset = result.assets[0];
    const fileSize = asset.fileSize || 0;

    // Enforce < 2MB check (2 * 1024 * 1024 bytes)
    if (fileSize > 2 * 1024 * 1024) {
      Toast.show({ type: 'error', text1: Strings.imageShouldBeLess2MB });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || 'profile.jpg',
      });
      await updateProfileImage(formData);
      Toast.show({ type: 'success', text1: Strings.profileImageSaved });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message || Strings.somethingWrong,
      });
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (e) {
            console.warn('Logout error:', e);
          }

          try {
            if (typeof resetOrders === 'function') resetOrders();
            useProfileStore.getState().reset?.();
          } catch (e) {
            console.warn('Store reset error:', e);
          }

          try {
            const rootNav = navigation.getParent() || navigation;
            rootNav.reset({ index: 0, routes: [{ name: 'Login' }] });
          } catch (e) {
            console.warn('Navigation reset error:', e);
            navigation.navigate('Login');
          }
        },
      },
    ]);
  };

  const calling = countryInfo?.calling_code || '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgColor} />
      <LoaderOverlay visible={loaders.profile} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Title */}
        <Text style={styles.pageTitle}>{Strings.myProfile}</Text>

        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          {/* Avatar stack with dot_circle overlay & edit button */}
          <View style={styles.avatarWrapper}>
            <Image
              source={Images.dotCircle}
              style={styles.dotCircleOverlay}
              resizeMode="contain"
            />
            {profileData?.image ? (
              <Image
                source={{ uri: profileData.image }}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <Image
                source={Images.avatar}
                style={styles.avatar}
                resizeMode="cover"
              />
            )}
            <TouchableOpacity
              style={styles.editAvatarBtn}
              onPress={handlePickImage}
              accessibilityLabel="Edit profile photo"
              accessibilityRole="button"
              activeOpacity={0.8}
            >
              <SvgIcon name="icon_edit" width={14} height={14} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {/* Name & Info */}
          <Text style={styles.profileName}>{profileData?.name || '—'}</Text>
          {profileData?.email ? (
            <Text style={styles.profileEmail}>{profileData.email}</Text>
          ) : null}
          {profileData?.phone ? (
            <Text style={styles.profilePhone}>{calling}{profileData.phone}</Text>
          ) : null}

          {/* Branch Row */}
          <View style={styles.branchRow}>
            <View style={styles.branchIconWrapper}>
              <SvgIcon name="branch" width={18} height={18} color={Colors.primary} />
            </View>
            <Text style={styles.branchLabel}>{Strings.branch}: </Text>
            <Text style={styles.branchValue}>{getBranchName()}</Text>
          </View>
        </View>

        {/* Menu Items Card */}
        <View style={styles.menuCard}>
          <ProfileMenuItem
            icon="icon_edit"
            label={Strings.editProfile}
            onPress={() => navigation.navigate('EditProfile')}
          />
          <ProfileMenuItem.Divider />
          <ProfileMenuItem
            icon="key"
            label={Strings.changePassword}
            onPress={() => navigation.navigate('ChangePassword')}
          />
          <ProfileMenuItem.Divider />
          <ProfileMenuItem
            icon="lang"
            label={Strings.changeLanguage}
            onPress={() => navigation.navigate('ChangeLanguage')}
          />
          {pageDataList.map((page, idx) => (
            <React.Fragment key={String(page.id || idx)}>
              <ProfileMenuItem.Divider />
              <ProfileMenuItem
                icon="terms_condition"
                label={page.title}
                onPress={() =>
                  navigation.navigate('Pages', {
                    title: page.title,
                    description: page.description,
                  })
                }
              />
            </React.Fragment>
          ))}
          <ProfileMenuItem.Divider />
          <ProfileMenuItem
            icon="logout"
            label={Strings.logout}
            onPress={handleLogout}
            isDanger
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgColor },
  scroll: { paddingBottom: Spacing.xxl },
  pageTitle: {
    fontFamily: 'Rubik-Bold',
    fontSize: 18,
    color: Colors.font,
    textAlign: 'center',
    marginVertical: Spacing.base,
  },
  profileCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.base,
    ...Shadows.card,
  },
  avatarWrapper: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    position: 'relative',
  },
  dotCircleOverlay: {
    position: 'absolute',
    width: 105,
    height: 105,
    zIndex: 1,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.itemBg,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 2,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.darkGray,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  profileName: {
    fontFamily: 'Rubik-Bold',
    fontSize: 18,
    color: Colors.font,
    marginBottom: 4,
  },
  profileEmail: {
    ...Typography.bodyMedium,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  profilePhone: {
    ...Typography.bodyMedium,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgColor,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.pill,
    marginTop: Spacing.xs,
  },
  branchIconWrapper: {
    marginRight: 6,
  },
  branchLabel: {
    ...Typography.regular,
    color: Colors.textMuted,
  },
  branchValue: {
    ...Typography.bodyMedium,
    color: Colors.font,
    fontFamily: 'Rubik-Medium',
  },
  menuCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.card,
  },
});

export default ProfileScreen;

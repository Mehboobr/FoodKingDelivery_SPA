import React, { useCallback, useRef } from 'react';
import {
  View, Text, Image, FlatList, StyleSheet, StatusBar, RefreshControl,
  BackHandler, ToastAndroid, Platform, TouchableOpacity,
} from 'react-native';
import Images from '../../assets/images/index';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Strings } from '../../constants/strings';
import { StatsRow } from '../../components/home/StatCard';
import ActiveOrderCard from '../../components/home/ActiveOrderCard';
import EmptyState from '../../components/common/EmptyState';
import LoaderOverlay from '../../components/common/LoaderOverlay';
import { OrderCardSkeleton } from '../../components/common/SkeletonLoader';
import useOrderStore from '../../store/orderStore';

const HomeScreen = ({ navigation }) => {
  const {
    activeOrderList,
    countData,
    loaders,
    listError,
    getOrderList,
    getOrderCount,
    getOrderDetails,
  } = useOrderStore();

  const backPressCount = useRef(0);

  // Android back button handling
  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        if (backPressCount.current === 1) {
          BackHandler.exitApp();
          return true;
        }
        backPressCount.current = 1;
        if (Platform.OS === 'android') {
          ToastAndroid.show(Strings.pressBackToExit, ToastAndroid.SHORT);
        }
        setTimeout(() => { backPressCount.current = 0; }, 2000);
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, [])
  );

  const handleRefresh = useCallback(() => {
    getOrderList();
    getOrderCount();
  }, [getOrderList, getOrderCount]);

  const handleSeeDetails = useCallback(async (orderId) => {
    try {
      await getOrderDetails(orderId);
      navigation.navigate('OrderDetails', { orderId });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not load order details' });
    }
  }, [getOrderDetails, navigation]);

  const renderItem = useCallback(({ item }) => (
    <ActiveOrderCard
      order={item}
      onSeeDetails={() => handleSeeDetails(item.id)}
      loadingDetails={loaders.details}
    />
  ), [handleSeeDetails, loaders.details]);

  const keyExtractor = useCallback((item) => String(item.id), []);

  const ListHeader = () => (
    <View>
      {/* Stats Section */}
      <View style={styles.statsSection}>
        <StatsRow countData={countData} loading={loaders.count} />
      </View>

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{Strings.activeOrders}</Text>
        {activeOrderList.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{activeOrderList.length}</Text>
          </View>
        )}
      </View>

      {/* Loading skeletons */}
      {loaders.list && activeOrderList.length === 0 ? (
        <>
          <OrderCardSkeleton />
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </>
      ) : null}
    </View>
  );

  const ListEmpty = () => {
    if (loaders.list) return null;
    if (listError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{listError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <EmptyState
        image={Images.orderEmpty}
        title={Strings.noOrderForDelivery}
        subtitle={Strings.waitNote}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgColor} />
      <LoaderOverlay visible={loaders.details} />

      {/* App Bar */}
      <View style={styles.appBar}>
        <Image source={Images.logo} style={styles.logoImage} resizeMode="contain" />
      </View>

      <FlatList
        data={activeOrderList}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={<ListEmpty />}
        refreshControl={
          <RefreshControl
            refreshing={loaders.list && activeOrderList.length > 0}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        removeClippedSubviews={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgColor,
  },
  appBar: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bgColor,
  },
  logoImage: {
    height: 32,
    width: 140,
  },
  statsSection: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.large,
    color: Colors.font,
    fontFamily: 'Rubik-Medium',
  },
  countBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: {
    ...Typography.small,
    color: Colors.white,
    fontFamily: 'Rubik-Bold',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    paddingTop: Spacing.xxxl,
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.base,
  },
  retryBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
  },
  retryText: {
    ...Typography.bodyMedium,
    color: Colors.white,
  },
});

export default HomeScreen;

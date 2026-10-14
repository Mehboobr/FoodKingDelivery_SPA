import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/Home/HomeScreen';
import HistoryScreen from '../screens/History/HistoryScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { BorderRadius, Spacing } from '../constants/spacing';
import Images from '../assets/images/index';
import useOrderStore from '../store/orderStore';
import useProfileStore from '../store/profileStore';
import {
  requestNotificationPermission,
  registerFCMToken,
  setupNotificationListeners,
} from '../utils/notifications';

const Tab = createBottomTabNavigator();

const TabBarItem = ({ label, imageSource, focused }) => (
  <View style={[tabStyles.itemWrapper, focused && tabStyles.activeWrapper]}>
    <Image
      source={imageSource}
      style={[
        tabStyles.tabIcon,
        { tintColor: focused ? Colors.primary : Colors.textMuted },
      ]}
      resizeMode="contain"
    />
    <Text style={[tabStyles.label, focused && tabStyles.activeLabel]}>
      {label}
    </Text>
  </View>
);

const tabStyles = StyleSheet.create({
  itemWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.pill,
    minWidth: 72,
  },
  activeWrapper: {
    backgroundColor: Colors.primaryLight,
  },
  tabIcon: {
    width: 22,
    height: 22,
    marginBottom: 3,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Rubik-Regular',
    color: Colors.textMuted,
  },
  activeLabel: {
    color: Colors.primary,
    fontFamily: 'Rubik-Medium',
  },
});

const MainTabNavigator = () => {
  const insets = useSafeAreaInsets();
  const { getOrderList, getOrderCount } = useOrderStore();
  const { getPages, getBranches } = useProfileStore();

  useEffect(() => {
    // Call each exactly once on mount (fixes Flutter bug of duplicate calls)
    getOrderList();
    getOrderCount();
    getPages();
    getBranches();

    // Initialize push notifications
    requestNotificationPermission().then(() => {
      registerFCMToken();
    });
    const unsubscribeNotifications = setupNotificationListeners();

    return () => {
      if (typeof unsubscribeNotifications === 'function') {
        unsubscribeNotifications();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 64 + (insets.bottom > 0 ? insets.bottom : Spacing.sm),
          paddingTop: Spacing.sm,
          paddingBottom: insets.bottom > 0 ? insets.bottom : Spacing.sm,
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.divider,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
        },
        tabBarItemStyle: {
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarItem
              label="Home"
              imageSource={Images.homeTab}
              focused={focused}
            />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarItem
              label="History"
              imageSource={Images.historyTab}
              focused={focused}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarItem
              label="Profile"
              imageSource={Images.profileTab}
              focused={focused}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;

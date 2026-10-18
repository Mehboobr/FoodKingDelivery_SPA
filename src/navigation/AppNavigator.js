import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import OrderDetailsScreen from '../screens/OrderDetails/OrderDetailsScreen';
import ConfirmDeliveryScreen from '../screens/ConfirmDelivery/ConfirmDeliveryScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import ChangePasswordScreen from '../screens/Profile/ChangePasswordScreen';
import ChangeLanguageScreen from '../screens/Profile/ChangeLanguageScreen';
import PagesScreen from '../screens/Profile/PagesScreen';
import CustomerSignatureScreen from '../screens/Delivery/CustomerSignatureScreen';
import PaymentCollectionScreen from '../screens/Delivery/PaymentCollectionScreen';
import ChequeDetailsScreen from '../screens/Delivery/ChequeDetailsScreen';
import DeliveryReviewScreen from '../screens/Delivery/DeliveryReviewScreen';
import RouteMapScreen from '../screens/Route/RouteMapScreen';
import NavigationScreen from '../screens/Route/NavigationScreen';
import ArrivalScreen from '../screens/Delivery/ArrivalScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false, animation: 'fade' }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ConfirmDelivery"
        component={ConfirmDeliveryScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen
        name="ProofOfDelivery"
        component={CustomerSignatureScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="CustomerSignature"
        component={CustomerSignatureScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="PaymentCollection"
        component={PaymentCollectionScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ChequeDetails"
        component={ChequeDetailsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="DeliveryReview"
        component={DeliveryReviewScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="RouteMap"
        component={RouteMapScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="Navigation"
        component={NavigationScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="Arrival"
        component={ArrivalScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ChangeLanguage"
        component={ChangeLanguageScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Pages"
        component={PagesScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;

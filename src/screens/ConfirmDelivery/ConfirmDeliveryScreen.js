import React from 'react';
import { View, Text, Image, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Strings } from '../../constants/strings';
import CustomButton from '../../components/common/CustomButton';
import Images from '../../assets/images/index';

const ConfirmDeliveryScreen = ({ navigation, route }) => {
  const { orderSerialNo, orderDatetime } = route.params || {};

  const goHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <View style={styles.container}>
        {/* Success Illustration */}
        <Image source={Images.confirm} style={styles.illustration} resizeMode="contain" />

        <Text style={styles.successTitle}>{Strings.orderSuccessfullyDelivered}</Text>

        <Text style={styles.orderIdText}>
          {Strings.orderId}
          <Text style={styles.orderIdValue}>{orderSerialNo}</Text>
        </Text>

        {orderDatetime ? (
          <Text style={styles.datetimeText}>{orderDatetime}</Text>
        ) : null}

        <View style={styles.buttonWrapper}>
          <CustomButton
            title={Strings.backToHome}
            onPress={goHome}
            style={styles.button}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  illustration: {
    width: 200,
    height: 180,
    marginBottom: Spacing.xl,
  },
  successTitle: {
    ...Typography.large,
    color: Colors.font,
    textAlign: 'center',
    marginBottom: Spacing.base,
  },
  orderIdText: {
    ...Typography.bodyMedium,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  orderIdValue: {
    color: Colors.darkBlue,
    fontFamily: 'Rubik-Bold',
  },
  datetimeText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  buttonWrapper: {
    width: '100%',
    marginTop: Spacing.xxxl,
  },
  button: {
    width: '100%',
  },
});

export default ConfirmDeliveryScreen;

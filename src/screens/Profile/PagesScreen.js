import React from 'react';
import {
  View, Text, StyleSheet, StatusBar, TouchableOpacity, useWindowDimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RenderHtml from 'react-native-render-html';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';
import SvgIcon from '../../components/common/SvgIcon';

const PagesScreen = ({ navigation, route }) => {
  const { title, description } = route.params || {};
  const { width } = useWindowDimensions();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.appBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <SvgIcon name="back" width={24} height={24} color={Colors.font} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {description ? (
          <RenderHtml
            contentWidth={width - Spacing.base * 2}
            source={{ html: description }}
            tagsStyles={{
              p: { ...Typography.body, color: Colors.font, marginBottom: Spacing.sm, lineHeight: 22 },
              h1: { fontFamily: 'Rubik-Bold', fontSize: 22, color: Colors.font, marginBottom: Spacing.sm },
              h2: { fontFamily: 'Rubik-Bold', fontSize: 18, color: Colors.font, marginBottom: Spacing.xs },
              h3: { fontFamily: 'Rubik-Medium', fontSize: 16, color: Colors.font, marginBottom: Spacing.xs },
              a: { color: Colors.primary },
              li: { ...Typography.body, color: Colors.font, lineHeight: 22 },
            }}
          />
        ) : (
          <Text style={styles.emptyText}>No content available.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
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
    marginHorizontal: Spacing.sm,
  },
  content: {
    padding: Spacing.base,
    paddingBottom: Spacing.xxl,
  },
  emptyText: { ...Typography.body, color: Colors.textMuted },
});

export default PagesScreen;

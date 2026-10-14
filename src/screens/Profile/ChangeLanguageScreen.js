import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, StatusBar, TouchableOpacity, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { BorderRadius, Spacing, Shadows } from '../../constants/spacing';
import { Strings } from '../../constants/strings';
import SvgIcon from '../../components/common/SvgIcon';
import useConfigStore from '../../store/configStore';
import { changeLanguage } from '../../localization/i18n';

const ChangeLanguageScreen = ({ navigation }) => {
  const { languageList, fetchLanguages } = useConfigStore();
  const [selectedCode, setSelectedCode] = useState('en');

  useEffect(() => {
    fetchLanguages();
    AsyncStorage.getItem('languageCode').then((code) => {
      if (code) setSelectedCode(code);
    });
  }, [fetchLanguages]);

  const handleSelect = async (code) => {
    setSelectedCode(code);
    await changeLanguage(code);
  };

  const renderItem = ({ item }) => {
    const isSelected = item.code === selectedCode;
    return (
      <TouchableOpacity
        style={[styles.row, isSelected && styles.selectedRow]}
        onPress={() => handleSelect(item.code)}
        activeOpacity={0.8}
        accessibilityRole="radio"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={item.name}
      >
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.flagImage} resizeMode="cover" />
        ) : (
          <View style={styles.flagPlaceholder}>
            <Text style={styles.flagEmoji}>🌐</Text>
          </View>
        )}
        <Text style={[styles.langName, isSelected && styles.selectedLangName]}>
          {item.name}
        </Text>
        {isSelected ? (
          <SvgIcon name="tick_circle" width={22} height={22} color={Colors.primary} />
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgColor} />

      <View style={styles.appBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <SvgIcon name="back" width={24} height={24} color={Colors.font} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>{Strings.changeLanguage}</Text>
        <View style={styles.backBtn} />
      </View>

      <FlatList
        data={languageList}
        renderItem={renderItem}
        keyExtractor={(item) => item.code}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgColor },
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
    fontSize: 20,
    color: Colors.font,
  },
  list: { padding: Spacing.base },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    ...Shadows.card,
  },
  selectedRow: {
    backgroundColor: 'rgba(255,0,107,0.06)',
    borderColor: Colors.primary,
  },
  flagImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: Spacing.md,
  },
  flagPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.itemBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  flagEmoji: { fontSize: 16 },
  langName: {
    ...Typography.bodyMedium,
    color: Colors.font,
    flex: 1,
    fontFamily: 'Rubik-Medium',
  },
  selectedLangName: {
    color: Colors.primary,
    fontFamily: 'Rubik-Bold',
  },
  separator: { height: Spacing.sm },
});

export default ChangeLanguageScreen;

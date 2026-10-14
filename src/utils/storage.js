import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  TOKEN: 'token',
  JUST_TOKEN: 'justToken',
  IS_LOGGED_IN: 'isLoggedIn',
  BRANCH_ID: 'branchId',
  LANGUAGE_CODE: 'languageCode',
  REMEMBER_ME: 'rememberMe',
};

// Compatibility helpers for AsyncStorage v3 vs v1/v2
export const removeManySafe = async (keys) => {
  try {
    if (typeof AsyncStorage.removeMany === 'function') {
      await AsyncStorage.removeMany(keys);
    } else if (typeof AsyncStorage.multiRemove === 'function') {
      await AsyncStorage.multiRemove(keys);
    } else {
      await Promise.all(keys.map((k) => AsyncStorage.removeItem(k)));
    }
  } catch (e) {
    await Promise.all(keys.map((k) => AsyncStorage.removeItem(k).catch(() => {})));
  }
};

export const setManySafe = async (entries) => {
  const obj = Array.isArray(entries) ? Object.fromEntries(entries) : entries;
  const pairs = Array.isArray(entries) ? entries : Object.entries(entries);
  try {
    if (typeof AsyncStorage.setMany === 'function') {
      await AsyncStorage.setMany(obj);
    } else if (typeof AsyncStorage.multiSet === 'function') {
      await AsyncStorage.multiSet(pairs);
    } else {
      await Promise.all(pairs.map(([k, v]) => AsyncStorage.setItem(k, String(v))));
    }
  } catch (e) {
    await Promise.all(pairs.map(([k, v]) => AsyncStorage.setItem(k, String(v)).catch(() => {})));
  }
};

export const getManySafe = async (keys) => {
  try {
    if (typeof AsyncStorage.getMany === 'function') {
      return await AsyncStorage.getMany(keys);
    } else if (typeof AsyncStorage.multiGet === 'function') {
      const pairs = await AsyncStorage.multiGet(keys);
      return Object.fromEntries(pairs);
    } else {
      const results = {};
      await Promise.all(
        keys.map(async (k) => {
          results[k] = await AsyncStorage.getItem(k);
        })
      );
      return results;
    }
  } catch (e) {
    const results = {};
    for (const k of keys) {
      results[k] = await AsyncStorage.getItem(k).catch(() => null);
    }
    return results;
  }
};

export const storage = {
  // Token
  getToken: () => AsyncStorage.getItem(StorageKeys.TOKEN),
  setToken: (token) => AsyncStorage.setItem(StorageKeys.TOKEN, token),

  // Raw Token
  getJustToken: () => AsyncStorage.getItem(StorageKeys.JUST_TOKEN),
  setJustToken: (token) => AsyncStorage.setItem(StorageKeys.JUST_TOKEN, token),

  // Logged in flag
  getIsLoggedIn: async () => {
    const val = await AsyncStorage.getItem(StorageKeys.IS_LOGGED_IN);
    return val === 'true';
  },
  setIsLoggedIn: (isLoggedIn) =>
    AsyncStorage.setItem(StorageKeys.IS_LOGGED_IN, isLoggedIn ? 'true' : 'false'),

  // Branch ID
  getBranchId: async () => {
    const id = await AsyncStorage.getItem(StorageKeys.BRANCH_ID);
    return id ? parseInt(id, 10) : null;
  },
  setBranchId: (id) =>
    AsyncStorage.setItem(StorageKeys.BRANCH_ID, String(id ?? '')),

  // Language
  getLanguage: () => AsyncStorage.getItem(StorageKeys.LANGUAGE_CODE),
  setLanguage: (code) => AsyncStorage.setItem(StorageKeys.LANGUAGE_CODE, code),

  // Remember credentials
  getRememberMe: async () => {
    try {
      const data = await AsyncStorage.getItem(StorageKeys.REMEMBER_ME);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setRememberMe: (data) =>
    AsyncStorage.setItem(StorageKeys.REMEMBER_ME, JSON.stringify(data)),
  removeRememberMe: () => AsyncStorage.removeItem(StorageKeys.REMEMBER_ME),

  // Clear all auth state
  clearAuth: () =>
    removeManySafe([
      StorageKeys.TOKEN,
      StorageKeys.JUST_TOKEN,
      StorageKeys.IS_LOGGED_IN,
      StorageKeys.BRANCH_ID,
    ]),

  // Multi-get for app bootstrap
  getAuthState: async () => {
    const map = await getManySafe([
      StorageKeys.TOKEN,
      StorageKeys.JUST_TOKEN,
      StorageKeys.IS_LOGGED_IN,
      StorageKeys.BRANCH_ID,
    ]);
    return {
      token: map[StorageKeys.TOKEN],
      justToken: map[StorageKeys.JUST_TOKEN],
      isLoggedIn: map[StorageKeys.IS_LOGGED_IN] === 'true',
      branchId: map[StorageKeys.BRANCH_ID]
        ? parseInt(map[StorageKeys.BRANCH_ID], 10)
        : null,
    };
  },
};

export default storage;

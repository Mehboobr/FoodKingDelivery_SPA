import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';
import { setManySafe, getManySafe } from '../utils/storage';

const useAuthStore = create((set, get) => ({
  token: null,
  justToken: null,
  isLoggedIn: false,
  branchId: null,
  user: null,

  login: async (email, password) => {
    const res = await authService.login(email, password);
    if (res.status === 201) {
      const { token, branch_id, user } = res.data;
      if (user.role_id !== 3) {
        throw new Error('Only delivery boy can login to this app');
      }
      const bearerToken = 'Bearer ' + token;
      await setManySafe([
        ['token', bearerToken],
        ['justToken', token],
        ['branchId', String(branch_id)],
        ['isLoggedIn', 'true'],
      ]);
      set({ token: bearerToken, justToken: token, branchId: branch_id, user, isLoggedIn: true });
      return { token: bearerToken, branchId: branch_id, user };
    }
    throw new Error(res.data?.message || 'Login failed');
  },

  refreshToken: async () => {
    const justToken = await AsyncStorage.getItem('justToken');
    if (!justToken) throw new Error('No token');
    const res = await authService.refreshToken(justToken);
    if (res.status === 201) {
      const { token } = res.data;
      const bearerToken = 'Bearer ' + token;
      await setManySafe([
        ['token', bearerToken],
        ['justToken', token],
        ['isLoggedIn', 'true'],
      ]);
      const branchIdStr = await AsyncStorage.getItem('branchId');
      set({
        token: bearerToken,
        justToken: token,
        isLoggedIn: true,
        branchId: branchIdStr ? parseInt(branchIdStr, 10) : null,
      });
      return true;
    }
    throw new Error('Token refresh failed');
  },

  logout: async () => {
    try {
      await authService.clearAuth();
    } catch (e) {
      console.warn('Error clearing auth storage during logout:', e);
    } finally {
      set({ token: null, justToken: null, isLoggedIn: false, branchId: null, user: null });
    }
  },

  loadFromStorage: async () => {
    try {
      const data = await getManySafe(['token', 'justToken', 'isLoggedIn', 'branchId']);
      const token = data?.token ?? null;
      const justToken = data?.justToken ?? null;
      const isLoggedIn = data?.isLoggedIn === 'true';
      const branchId = data?.branchId ? parseInt(data.branchId, 10) : null;
      set({
        token,
        justToken,
        isLoggedIn,
        branchId,
      });
      return isLoggedIn;
    } catch (_) {
      return false;
    }
  },
}));

export default useAuthStore;

import publicClient from '../api/publicClient';
import client from '../api/client';
import { removeManySafe } from '../utils/storage';

export const authService = {
  login: (email, password) =>
    publicClient.post('/api/auth/login', { email, password }),

  refreshToken: (rawToken) =>
    publicClient.get(`/api/refresh-token?token=${rawToken}`),

  registerDeviceToken: (fcmToken) =>
    client.post('/api/frontend/device-token/mobile', { token: fcmToken }),

  clearAuth: async () => {
    await removeManySafe(['token', 'justToken', 'isLoggedIn', 'branchId']);
  },
};

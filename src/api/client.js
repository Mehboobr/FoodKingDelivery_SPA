import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_LICENSE_CODE } from './config';

const client = axios.create({ baseURL: API_BASE_URL, timeout: 30000 });

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers['Authorization'] = token;
  config.headers['x-api-key'] = API_LICENSE_CODE;
  const isForm = typeof FormData !== 'undefined' && config.data instanceof FormData;
  if (isForm) {
    delete config.headers['content-type'];
    delete config.headers['Content-Type'];
  } else if (!config.headers['content-type'] && !config.headers['Content-Type']) {
    config.headers['content-type'] = 'application/json';
  }
  return config;
});

let refreshPromise = null;

function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = import('../store/authStore')
      .then(({ default: useAuthStore }) => useAuthStore.getState().refreshToken())
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const expired = err.response?.status === 401 && original && !original._retry;
    if (!expired) return Promise.reject(err);

    original._retry = true;
    try {
      await refreshSession();
      return client(original);
    } catch (_) {
      return Promise.reject(err);
    }
  }
);

export default client;
export { API_BASE_URL as BASE_URL, API_LICENSE_CODE as LICENSE_CODE };

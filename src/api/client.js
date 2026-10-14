import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_LICENSE_CODE } from './config';

const client = axios.create({ baseURL: API_BASE_URL, timeout: 30000 });

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers['Authorization'] = token;
  config.headers['x-api-key'] = API_LICENSE_CODE;
  config.headers['content-type'] = 'application/json';
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export default client;
export { API_BASE_URL as BASE_URL, API_LICENSE_CODE as LICENSE_CODE };

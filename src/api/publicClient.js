import axios from 'axios';
import { API_BASE_URL, API_LICENSE_CODE } from './config';

const publicClient = axios.create({ baseURL: API_BASE_URL, timeout: 30000 });

publicClient.interceptors.request.use((config) => {
  config.headers['x-api-key'] = API_LICENSE_CODE;
  config.headers['content-type'] = 'application/json';
  return config;
});

publicClient.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export default publicClient;
export { API_BASE_URL as BASE_URL, API_LICENSE_CODE as LICENSE_CODE };

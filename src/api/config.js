// iOS Simulator can use localhost. Android emulator should use http://10.0.2.2:5000.
// A physical device needs this machine's LAN IP, or the deployed HTTPS URL.
//
// The app already requests paths such as /api/auth/login, so neither base URL
// should end with /api. The hosted address from the server is
// https://orchid-shrew-461512.hostingersite.com/api/
export const LOCAL_API_BASE_URL = 'http://localhost:5000';
export const HOSTED_API_BASE_URL = 'https://orchid-shrew-461512.hostingersite.com';

export const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.API_BASE_URL) ||
  HOSTED_API_BASE_URL;

export const API_LICENSE_CODE =
  (typeof process !== 'undefined' && process.env?.API_LICENSE_CODE) ||
  'b6d68vy2-m7g5-20r0-5275-h103w73453q120';
// export const API_LICENSE_CODE =
//   (typeof process !== 'undefined' && process.env?.API_LICENSE_CODE) ||
//   '5bd5a99a8655501b38246840e5c1af89c2b12eae9454cd0984badac3b452068e';

export default {
  API_BASE_URL,
  LOCAL_API_BASE_URL,
  HOSTED_API_BASE_URL,
  API_LICENSE_CODE,
};

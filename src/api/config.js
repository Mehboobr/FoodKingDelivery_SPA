export const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.API_BASE_URL) ||
  'https://demo.foodking.dev';

export const API_LICENSE_CODE =
  (typeof process !== 'undefined' && process.env?.API_LICENSE_CODE) ||
  'b6d68vy2-m7g5-20r0-5275-h103w73453q120';

export default {
  API_BASE_URL,
  API_LICENSE_CODE,
};

import publicClient from '../api/publicClient';

export const configService = {
  getConfig: () =>
    publicClient.get('/api/frontend/setting'),

  getCountryInfo: (countryCode) =>
    publicClient.get(`/api/frontend/country-code/show/${countryCode}`),

  getLanguages: () =>
    publicClient.get('/api/frontend/language'),
};

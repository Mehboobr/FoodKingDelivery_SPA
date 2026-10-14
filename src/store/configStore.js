import { create } from 'zustand';
import { configService } from '../services/configService';

const useConfigStore = create((set) => ({
  configData: null,
  countryInfo: { calling_code: '', flag_emoji: '' },
  languageList: [],

  fetchConfig: async () => {
    try {
      const res = await configService.getConfig();
      const data = res.data?.data ?? res.data;
      set({ configData: data });
      // Auto-fetch country info if company_country_code is available
      if (data?.company_country_code) {
        const ciRes = await configService.getCountryInfo(data.company_country_code);
        const ci = ciRes.data?.data ?? ciRes.data;
        if (ci) {
          set({ countryInfo: { calling_code: ci.calling_code || '', flag_emoji: ci.flag_emoji || '' } });
        }
      }
    } catch (_) {}
  },

  fetchLanguages: async () => {
    try {
      const res = await configService.getLanguages();
      const data = res.data?.data ?? res.data ?? [];
      set({ languageList: Array.isArray(data) ? data : [] });
    } catch (_) {}
  },
}));

export default useConfigStore;

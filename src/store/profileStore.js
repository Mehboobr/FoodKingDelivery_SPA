import { create } from 'zustand';
import { profileService } from '../services/profileService';

const useProfileStore = create((set, get) => ({
  profileData: null,
  pageDataList: [],
  branchDataList: [],
  loaders: { profile: false, updateProfile: false, changePassword: false },

  getProfile: async () => {
    set((s) => ({ loaders: { ...s.loaders, profile: true } }));
    try {
      const res = await profileService.getProfile();
      const data = res.data?.data ?? res.data;
      set({ profileData: data });
      return data;
    } catch (err) {
      throw err;
    } finally {
      set((s) => ({ loaders: { ...s.loaders, profile: false } }));
    }
  },

  updateProfile: async (payload) => {
    set((s) => ({ loaders: { ...s.loaders, updateProfile: true } }));
    try {
      const res = await profileService.updateProfile(payload);
      if (res.status === 200) {
        await get().getProfile();
        return true;
      }
      throw new Error(res.data?.message || 'Update failed');
    } catch (err) {
      throw err;
    } finally {
      set((s) => ({ loaders: { ...s.loaders, updateProfile: false } }));
    }
  },

  changePassword: async (payload) => {
    set((s) => ({ loaders: { ...s.loaders, changePassword: true } }));
    try {
      const res = await profileService.changePassword(payload);
      if (res.status === 200) return true;
      throw new Error(res.data?.message || 'Password change failed');
    } catch (err) {
      throw err;
    } finally {
      set((s) => ({ loaders: { ...s.loaders, changePassword: false } }));
    }
  },

  updateProfileImage: async (formData) => {
    set((s) => ({ loaders: { ...s.loaders, profile: true } }));
    try {
      await profileService.changeProfileImage(formData);
      await get().getProfile();
      return true;
    } catch (err) {
      throw err;
    } finally {
      set((s) => ({ loaders: { ...s.loaders, profile: false } }));
    }
  },

  getPages: async () => {
    try {
      const res = await profileService.getPages();
      const data = res.data?.data ?? res.data ?? [];
      set({ pageDataList: Array.isArray(data) ? data : [] });
    } catch (_) {}
  },

  getBranches: async () => {
    try {
      const res = await profileService.getBranches();
      const data = res.data?.data ?? res.data ?? [];
      set({ branchDataList: Array.isArray(data) ? data : [] });
    } catch (_) {}
  },

  reset: () =>
    set({ profileData: null, pageDataList: [], branchDataList: [] }),
}));

export default useProfileStore;

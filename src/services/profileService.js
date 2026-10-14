import client from '../api/client';

export const profileService = {
  getProfile: () =>
    client.get('/api/profile'),

  updateProfile: (data) =>
    client.put('/api/profile', data),

  changePassword: (data) =>
    client.put('/api/profile/change-password', data),

  changeProfileImage: (formData) =>
    client.post('/api/profile/change-image', formData, {
      headers: { 'content-type': 'multipart/form-data' },
    }),

  getBranches: () =>
    client.get('/api/frontend/branch'),

  getPages: () =>
    client.get('/api/frontend/page'),
};

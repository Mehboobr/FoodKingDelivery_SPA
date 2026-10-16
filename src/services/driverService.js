import client from '../api/client';

export const driverService = {
  currentRoute: () => client.get('/api/driver/routes/current'),
  optimize: (body) => client.post('/api/driver/routes/optimize', body || {}),
  start: (routeId) => client.post(`/api/driver/routes/${routeId}/start`, {}),
  recalculate: (routeId, body) => client.post(`/api/driver/routes/${routeId}/recalculate`, body || {}),
  arrive: (stopId) => client.post(`/api/driver/stops/${stopId}/arrive`, {}),
  fail: (stopId, body) => client.post(`/api/driver/stops/${stopId}/fail`, body),
  complete: (stopId, formData) => client.post(`/api/driver/stops/${stopId}/complete`, formData, {
    timeout: 60000,
  }),
  postLocation: (body) => client.post('/api/driver/location', body),
  postLocationBatch: (locations) => client.post('/api/driver/location/batch', { locations }),
  stopTracking: () => client.post('/api/driver/tracking/stop', {}),
};

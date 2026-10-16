import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { driverService } from '../services/driverService';
import { getCurrentFix, startLocationTracking, stopLocationTracking } from '../utils/locationTracker';

const DUTY_KEY = 'encore_on_duty';

function unwrap(response) {
  return response?.data?.data ?? response?.data;
}

function distanceMeters(from, to) {
  if (!from || !to || from.latitude == null || to.latitude == null) return null;
  const toRad = (value) => (value * Math.PI) / 180;
  const earth = 6371000;
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * earth * Math.asin(Math.sqrt(a));
}

const useRouteStore = create((set, get) => ({
  route: null,
  summary: null,
  tracking: null,
  message: '',
  onDuty: false,
  arrival: null,
  nearbyHits: 0,
  loading: false,
  error: '',

  loadDuty: async () => {
    const stored = await AsyncStorage.getItem(DUTY_KEY);
    set({ onDuty: stored === 'true' });
  },

  setOnDuty: async (onDuty) => {
    await AsyncStorage.setItem(DUTY_KEY, onDuty ? 'true' : 'false');
    set({ onDuty });
    if (!onDuty) {
      await stopLocationTracking();
      get().loadCurrent().catch(() => {});
    } else if (get().route?.status === 'active') {
      await get().resumeTracking();
    }
  },

  loadCurrent: async () => {
    set({ loading: true, error: '' });
    try {
      const data = unwrap(await driverService.currentRoute());
      set({
        route: data?.route || null,
        summary: data?.summary || null,
        tracking: data?.tracking || null,
        message: data?.message || '',
      });
      return data;
    } catch (error) {
      set({ error: error?.response?.data?.message || 'Could not load the route' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  planRoute: async () => {
    set({ loading: true, error: '' });
    try {
      const fix = await getCurrentFix();
      const body = fix?.coords
        ? { latitude: fix.coords.latitude, longitude: fix.coords.longitude }
        : {};
      const data = unwrap(await driverService.optimize(body));
      set({
        route: data.route,
        summary: data.summary,
        tracking: data.tracking,
        message: data.message || '',
      });
      return data;
    } catch (error) {
      const message = error?.response?.data?.message || 'Could not plan a road route';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  startRoute: async () => {
    const routeId = get().route?.id;
    if (!routeId) return null;
    const data = unwrap(await driverService.start(routeId));
    set({
      route: data.route,
      summary: data.summary,
      tracking: data.tracking,
      message: data.message || '',
      onDuty: true,
    });
    await AsyncStorage.setItem(DUTY_KEY, 'true');
    await get().resumeTracking();
    return data;
  },

  recalculate: async () => {
    const routeId = get().route?.id;
    if (!routeId) return null;
    const fix = await getCurrentFix();
    const body = fix?.coords
      ? { latitude: fix.coords.latitude, longitude: fix.coords.longitude }
      : {};
    const data = unwrap(await driverService.recalculate(routeId, body));
    set({
      route: data.route,
      summary: data.summary,
      tracking: data.tracking,
      message: data.message || '',
      nearbyHits: 0,
      arrival: null,
    });
    return data;
  },

  markArrived: async (stopId) => {
    const data = unwrap(await driverService.arrive(stopId));
    await get().loadCurrent();
    set({ arrival: { stopId, manual: true } });
    return data;
  },

  resumeTracking: async () => {
    const route = get().route;
    if (!route || route.status !== 'active' || !get().onDuty) return { ok: false };
    return startLocationTracking({
      getContext: () => {
        const current = get().route;
        return {
          routeId: current?.status === 'active' ? current.id : null,
          stopId: current?.nextStop?.id || null,
        };
      },
      onUpdate: (event) => get().considerArrival(event),
    });
  },

  considerArrival: (event) => {
    const route = get().route;
    const next = route?.nextStop;
    if (!next || next.status === 'arrived' || next.status === 'completed') return;
    const radius = route.arrivalRadiusMeters || 120;
    const meters = distanceMeters(event, next);
    const accurate = event.accuracyMeters == null || event.accuracyMeters <= 80;
    if (meters == null || meters > radius || !accurate) {
      set({ nearbyHits: 0 });
      return;
    }
    const hits = get().nearbyHits + 1;
    set({ nearbyHits: hits });
    if (hits < 2 || get().arrival?.stopId === next.id) return;
    set({ arrival: { stopId: next.id, shipmentReference: next.shipmentReference, meters } });
    driverService.arrive(next.id).then(() => get().loadCurrent()).catch(() => {});
  },
}));

export default useRouteStore;

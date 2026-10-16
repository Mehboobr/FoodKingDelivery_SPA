import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { driverService } from '../services/driverService';
import { requestLocationPermission } from './permissions';

const QUEUE_KEY = 'encore_location_queue';
const MAX_QUEUE = 80;

let watchId = null;
let flushTimer = null;
let flushing = false;
let contextProvider = () => ({ routeId: null, stopId: null });
let onPosition = () => {};
let lastError = '';

function uuid() {
  if (global.crypto?.randomUUID) return global.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function loadGeolocation() {
  try {
    return require('@react-native-community/geolocation').default;
  } catch {
    return null;
  }
}

async function readQueue() {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(-MAX_QUEUE) : [];
  } catch {
    return [];
  }
}

async function writeQueue(events) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(events.slice(-MAX_QUEUE)));
}

export function locationStatus() {
  return {
    watching: watchId != null,
    nativeAvailable: Boolean(loadGeolocation()),
    lastError,
  };
}

export async function flushLocations() {
  if (flushing) return;
  flushing = true;
  try {
    let queue = await readQueue();
    if (!queue.length) return;
    const batch = queue.slice(0, 50);
    await driverService.postLocationBatch(batch);
    const sent = new Set(batch.map((event) => event.eventId));
    queue = (await readQueue()).filter((event) => !sent.has(event.eventId));
    await writeQueue(queue);
    lastError = '';
  } catch (error) {
    lastError = 'Location updates are waiting for a connection.';
  } finally {
    flushing = false;
  }
}

async function enqueue(position) {
  const context = contextProvider() || {};
  if (!context.routeId) return;
  const coords = position.coords || {};
  const event = {
    eventId: uuid(),
    capturedAt: new Date(position.timestamp || Date.now()).toISOString(),
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracyMeters: coords.accuracy ?? null,
    altitudeMeters: coords.altitude ?? null,
    speedMps: coords.speed != null && coords.speed >= 0 ? coords.speed : null,
    headingDegrees: coords.heading != null && coords.heading >= 0 && coords.heading < 360 ? coords.heading : null,
    isMocked: position.mocked ?? null,
    routeId: context.routeId,
    currentStopId: context.stopId || null,
  };
  const queue = await readQueue();
  queue.push(event);
  await writeQueue(queue);
  onPosition(event);
  if (queue.length >= 8) flushLocations();
}

async function requestBackgroundPermission() {
  if (Platform.OS !== 'android') return;
  try {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION);
  } catch {
    // Foreground tracking can continue if background access is denied.
  }
}

export async function startLocationTracking({ getContext, onUpdate } = {}) {
  contextProvider = getContext || contextProvider;
  onPosition = onUpdate || onPosition;
  const allowed = await requestLocationPermission();
  if (!allowed) {
    lastError = 'Location permission is off.';
    return { ok: false, reason: lastError };
  }
  await requestBackgroundPermission();
  const Geolocation = loadGeolocation();
  if (!Geolocation) {
    lastError = 'This build does not include the location module yet. Rebuild the app after installing it.';
    return { ok: false, reason: lastError };
  }
  if (Platform.OS === 'ios' && Geolocation.requestAuthorization) {
    try {
      Geolocation.requestAuthorization('whenInUse');
    } catch {
      // The system prompt is shown by the location request itself when available.
    }
  }
  if (watchId != null) Geolocation.clearWatch(watchId);
  try {
  watchId = Geolocation.watchPosition(
    (position) => {
      enqueue(position).catch(() => {});
    },
    () => {
      lastError = 'Location is unavailable.';
    },
    {
      enableHighAccuracy: true,
      distanceFilter: 20,
      interval: 10000,
      fastestInterval: 5000,
      useSignificantChanges: false,
    },
  );
  if (flushTimer) clearInterval(flushTimer);
  flushTimer = setInterval(flushLocations, 15000);
  flushLocations();
  return { ok: true };
  } catch {
    lastError = 'Location tracking is not available until the app is rebuilt with the location module.';
    return { ok: false, reason: lastError };
  }
}

export function getCurrentFix() {
  const Geolocation = loadGeolocation();
  if (!Geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    Geolocation.getCurrentPosition(
      (position) => resolve(position),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 15000 },
    );
  });
}

export async function stopLocationTracking() {
  const Geolocation = loadGeolocation();
  if (Geolocation && watchId != null) Geolocation.clearWatch(watchId);
  watchId = null;
  if (flushTimer) clearInterval(flushTimer);
  flushTimer = null;
  try {
    await flushLocations();
    await driverService.stopTracking();
  } catch {
    lastError = 'Location sharing stopped on this phone. The server may still show the last update.';
  }
}

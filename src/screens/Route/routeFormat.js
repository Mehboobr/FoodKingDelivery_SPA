export function formatDistance(meters) {
  if (meters == null || Number.isNaN(Number(meters))) return null;
  const value = Number(meters);
  if (value < 1000) return `${Math.round(value)} m`;
  return `${(value / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds) {
  if (seconds == null || Number.isNaN(Number(seconds))) return null;
  const minutes = Math.max(1, Math.round(Number(seconds) / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}

export function formatEta(secondsFromNow) {
  if (secondsFromNow == null) return null;
  const time = new Date(Date.now() + Number(secondsFromNow) * 1000);
  return time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function routeStatusLabel(status) {
  if (status === 'active') return 'In Progress';
  if (status === 'planned') return 'Planned';
  if (status === 'completed') return 'Completed';
  if (status === 'canceled') return 'Canceled';
  return status || 'Route';
}

export function stopStatusLabel(stop, isNext) {
  if (stop.status === 'completed') return 'Delivered';
  if (stop.status === 'failed') return 'Returned';
  if (stop.status === 'arrived') return 'Arrived';
  if (isNext) return 'Next Stop';
  return 'Upcoming';
}

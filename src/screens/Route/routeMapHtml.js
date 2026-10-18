export function routeMapHtml(route, tracking, { focusStopId } = {}) {
  const geometry = route?.geometry?.type === 'LineString' ? route.geometry : null;
  const payload = JSON.stringify({
    geometry,
    focusStopId: focusStopId || null,
    tracking: tracking?.latitude != null
      ? { latitude: tracking.latitude, longitude: tracking.longitude, stale: Boolean(tracking.stale) }
      : null,
    stops: (route?.stops || []).filter((stop) => stop.latitude != null && stop.longitude != null).map((stop) => ({
      id: stop.id,
      sequence: stop.sequence,
      latitude: stop.latitude,
      longitude: stop.longitude,
      status: stop.status,
      label: stop.shipmentReference,
      next: route?.nextStop?.id === stop.id,
    })),
  }).replace(/</g, '\\u003c');

  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
  html,body,#map{height:100%;margin:0;background:#e7eef2}
  .leaflet-control-attribution{font-size:10px}
  .pin{width:28px;height:28px;border-radius:14px;display:flex;align-items:center;justify-content:center;font:700 13px sans-serif;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25)}
  .next{background:#0092a1;color:#fff}
  .done{background:#22C55E;color:#fff}
  .wait{background:#fff;color:#0092a1;border-color:#0092a1}
  .fail{background:#EF4444;color:#fff}
  .you{width:16px;height:16px;border-radius:8px;background:#1d4ed8;border:3px solid #fff;box-shadow:0 0 0 6px rgba(29,78,216,.25)}
</style></head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
const data = ${payload};
const map = L.map('map', { zoomControl: false });
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
const bounds = [];
if (data.geometry && Array.isArray(data.geometry.coordinates) && data.geometry.coordinates.length > 1) {
  const line = data.geometry.coordinates.map((pair) => [pair[1], pair[0]]);
  L.polyline(line, { color: '#0092a1', weight: 5, opacity: 0.9 }).addTo(map);
  line.forEach((point) => bounds.push(point));
}
function icon(stop) {
  const kind = stop.status === 'completed' ? 'done' : (stop.status === 'failed' ? 'fail' : (stop.next ? 'next' : 'wait'));
  const text = stop.status === 'completed' ? '✓' : String(stop.sequence);
  return L.divIcon({ className: '', html: '<div class="pin ' + kind + '">' + text + '</div>', iconSize: [28, 28], iconAnchor: [14, 14] });
}
(data.stops || []).forEach((stop) => {
  const point = [stop.latitude, stop.longitude];
  bounds.push(point);
  const marker = L.marker(point, { icon: icon(stop) }).addTo(map);
  marker.on('click', () => {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'stop', id: stop.id }));
    }
  });
});
if (data.tracking) {
  const here = [data.tracking.latitude, data.tracking.longitude];
  bounds.push(here);
  L.marker(here, { icon: L.divIcon({ className: '', html: '<div class="you"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }) }).addTo(map);
}
function fit() {
  if (!bounds.length) { map.setView([20, 0], 2); return; }
  map.fitBounds(bounds, { paddingTopLeft: [24, 24], paddingBottomRight: [24, 150] });
}
window.recenterMap = fit;
fit();
</script></body></html>`;
}

// Carte des voyages : Leaflet (inclus dans vendor/), fonds de carte CARTO /
// OpenStreetMap, recherche de lieux avec Nominatim (OpenStreetMap).

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}
function loadCss(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = href;
  document.head.appendChild(l);
}

let loading = null;
export function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  loadCss('vendor/leaflet/leaflet.css');
  loading ||= loadScript('vendor/leaflet/leaflet.js').then(() => window.L);
  return loading;
}

const NOMINATIM = 'https://nominatim.openstreetmap.org';

export async function geocode(query) {
  try {
    const r = await fetch(`${NOMINATIM}/search?format=jsonv2&limit=1&addressdetails=1&accept-language=fr&q=${encodeURIComponent(query)}`);
    if (!r.ok) return null;
    const [hit] = await r.json();
    if (!hit) return null;
    return { lat: Number(hit.lat), lng: Number(hit.lon), country: (hit.address?.country_code || '').toUpperCase(), countryName: hit.address?.country || '' };
  } catch {
    return null;
  }
}

export async function reverseGeocode(lat, lng) {
  try {
    const r = await fetch(`${NOMINATIM}/reverse?format=jsonv2&zoom=10&addressdetails=1&accept-language=fr&lat=${lat}&lon=${lng}`);
    if (!r.ok) return null;
    const j = await r.json();
    const a = j.address || {};
    return { name: a.city || a.town || a.village || a.municipality || a.county || a.state || a.country || '', country: (a.country_code || '').toUpperCase(), countryName: a.country || '' };
  } catch {
    return null;
  }
}

// Drapeau emoji à partir du code pays (FR → 🇫🇷).
export const flagOf = (cc) => (cc && cc.length === 2 ? String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)) : '');

let map = null;
let layer = null;

export async function mountMap(el, { pins, route, view, onClick, onMove }) {
  const L = await loadLeaflet();
  if (!el.isConnected) return null;
  map?.remove();
  map = L.map(el, { zoomControl: false, worldCopyJump: true, attributionControl: true });
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 18,
    subdomains: 'abcd',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
  }).addTo(map);
  layer = L.layerGroup().addTo(map);

  const markers = {};
  for (const p of pins) {
    const icon = L.divIcon({ className: '', html: `<div class="pin ${p.cls}"><span>${p.emoji}</span></div>`, iconSize: [44, 52], iconAnchor: [22, 50], popupAnchor: [0, -46] });
    markers[p.id] = L.marker([p.lat, p.lng], { icon, title: p.title }).addTo(layer).bindPopup(p.popup, { className: 'trip-popup', maxWidth: 240 });
  }
  if (route.length > 1) {
    L.polyline(route, { color: '#ff2e8a', weight: 2.5, opacity: 0.8, dashArray: '6 8' }).addTo(layer);
  }
  if (view) map.setView(view.center, view.zoom);
  else if (pins.length) map.fitBounds(L.latLngBounds(pins.map((p) => [p.lat, p.lng])).pad(0.35), { maxZoom: 6 });
  else map.setView([30, 10], 2);

  map.on('click', (e) => onClick?.(e.latlng.lat, e.latlng.lng));
  map.on('moveend', () => onMove?.({ center: [map.getCenter().lat, map.getCenter().lng], zoom: map.getZoom() }));
  return {
    focus(id) {
      const m = markers[id];
      if (!m) return false;
      map.flyTo(m.getLatLng(), Math.max(map.getZoom(), 5), { duration: 0.8 });
      setTimeout(() => m.openPopup(), 850);
      return true;
    },
  };
}

export function unmountMap() {
  map?.remove();
  map = null;
}

// Leaflet Map Service & Browser Geolocation

import { CONFIG } from './config.js';

let map = null;
let markersLayer = null;
let userLocationMarker = null;
let selectedLocationMarker = null;

// Category Icon Mapping
const CATEGORY_ICONS = {
  pothole: { icon: 'fa-road', colorClass: 'pin-pothole' },
  sanitation: { icon: 'fa-trash-can', colorClass: 'pin-sanitation' },
  water: { icon: 'fa-droplet', colorClass: 'pin-water' },
  power: { icon: 'fa-lightbulb', colorClass: 'pin-power' },
  safety: { icon: 'fa-shield-halved', colorClass: 'pin-safety' },
  traffic: { icon: 'fa-traffic-light', colorClass: 'pin-traffic' }
};

/**
 * Initializes Leaflet Map instance
 */
export function initMap(elementId, onMapClick, onMarkerSelect) {
  if (map) return map;

  const defaultCenter = [CONFIG.DEFAULT_LOCATION.lat, CONFIG.DEFAULT_LOCATION.lng];
  
  // Create map instance
  map = L.map(elementId, {
    center: defaultCenter,
    zoom: CONFIG.DEFAULT_LOCATION.zoom,
    zoomControl: false
  });

  // Add CartoDB Dark Matter tiles for sleek modern dark theme
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  // Add zoom control at bottom right
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // Markers layer group
  markersLayer = L.layerGroup().addTo(map);

  // Handle map click for pin placement
  map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    placeTemporarySelectedPin(lat, lng);
    if (onMapClick) onMapClick(lat, lng);
  });

  return map;
}

/**
 * Places temporary blue pin when user clicks map to pick issue location
 */
export function placeTemporarySelectedPin(lat, lng) {
  if (selectedLocationMarker) {
    map.removeLayer(selectedLocationMarker);
  }

  const customIcon = L.divIcon({
    className: 'custom-leaflet-marker pin-water spin-slow',
    html: `<i class="fa-solid fa-location-dot"></i>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  selectedLocationMarker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
}

export function clearTemporaryPin() {
  if (selectedLocationMarker && map) {
    map.removeLayer(selectedLocationMarker);
    selectedLocationMarker = null;
  }
}

/**
 * Render all issue pins on the map
 */
export function renderIssueMarkers(issuesList, onMarkerSelect) {
  if (!markersLayer) return;
  markersLayer.clearLayers();

  issuesList.forEach(issue => {
    const catConfig = CATEGORY_ICONS[issue.category] || { icon: 'fa-circle-exclamation', colorClass: 'pin-pothole' };

    const customIcon = L.divIcon({
      className: `custom-leaflet-marker ${catConfig.colorClass}`,
      html: `<i class="fa-solid ${catConfig.icon}"></i>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const marker = L.marker([issue.lat, issue.lng], { icon: customIcon });

    // Popup summary
    const popupContent = `
      <div style="font-family: sans-serif; color: #111; padding: 4px;">
        <strong style="font-size: 14px;">${issue.title}</strong><br>
        <span style="font-size: 12px; color: #666;">📍 ${issue.address || 'Reported Location'}</span><br>
        <span style="font-size: 11px; font-weight: bold; color: #6366f1;">Upvotes: ${issue.upvotes}</span>
      </div>
    `;

    marker.bindPopup(popupContent);
    
    marker.on('click', () => {
      if (onMarkerSelect) onMarkerSelect(issue);
    });

    markersLayer.addLayer(marker);
  });
}

/**
 * Centering Map on user GPS position
 */
export function centerOnUserLocation(onSuccess, onError) {
  if (!navigator.geolocation) {
    if (onError) onError('Geolocation is not supported by your browser');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      map.setView([latitude, longitude], 15);

      // User location pulsing marker
      if (userLocationMarker) map.removeLayer(userLocationMarker);

      const userIcon = L.divIcon({
        className: 'custom-leaflet-marker pin-safety',
        html: `<i class="fa-solid fa-street-view"></i>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });

      userLocationMarker = L.marker([latitude, longitude], { icon: userIcon })
        .addTo(map)
        .bindPopup('<b>You are here!</b>')
        .openPopup();

      if (onSuccess) onSuccess(latitude, longitude);
    },
    (err) => {
      console.warn('GPS position error:', err.message);
      if (onError) onError(err.message);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

/**
 * Reverse Geocode lat/lng to readable address string via OpenStreetMap Nominatim API
 */
export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
    if (!res.ok) throw new Error('Geocoding failed');
    const data = await res.json();
    if (data && data.display_name) {
      // Shorten display name for UI brevity
      const parts = data.display_name.split(',');
      return parts.slice(0, 3).join(',');
    }
  } catch (err) {
    console.warn('Reverse geocode error:', err);
  }
  return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
}

export function resetMapView() {
  if (map) {
    map.setView([CONFIG.DEFAULT_LOCATION.lat, CONFIG.DEFAULT_LOCATION.lng], CONFIG.DEFAULT_LOCATION.zoom);
  }
}

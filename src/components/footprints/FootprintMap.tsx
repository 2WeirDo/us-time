import { useEffect, useRef, useCallback } from 'react';
import type { Footprint } from '../../types';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon (broken in bundlers)
import L from 'leaflet';

// Use CDN for marker icons to avoid bundler issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Pink marker for footprints
const pinkIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-pink.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface FootprintMapProps {
  footprints: Footprint[];
  focusLat?: number | null;
  focusLng?: number | null;
  onMapClick?: (lat: number, lng: number) => void;
}

export default function FootprintMap({
  footprints,
  focusLat,
  focusLng,
  onMapClick,
}: FootprintMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [35.86, 104.19], // China center
      zoom: 5,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Click to add
    if (onMapClick) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    // Invalidate size after render
    setTimeout(() => map.invalidateSize(), 100);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add markers for each footprint
    footprints.forEach((fp) => {
      const marker = L.marker([fp.lat, fp.lng], { icon: pinkIcon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:system-ui,sans-serif;font-size:13px;padding:2px 0">
            <strong>${fp.name}</strong>
            ${fp.date ? `<br/><span style="color:#999;font-size:11px">${fp.date}</span>` : ''}
            ${fp.note ? `<br/><span style="color:#666;font-size:12px">${fp.note}</span>` : ''}
          </div>`,
        );
      markersRef.current.push(marker);
    });

    // Fit bounds if there are markers
    if (footprints.length > 0) {
      const bounds = L.latLngBounds(footprints.map((fp) => [fp.lat, fp.lng]));
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    }
  }, [footprints]);

  // Focus on specific coordinates
  const focusMap = useCallback(
    (lat: number, lng: number) => {
      const map = mapInstanceRef.current;
      if (!map) return;
      map.setView([lat, lng], 15, { animate: true });
    },
    [],
  );

  // Handle external focus requests
  useEffect(() => {
    if (focusLat != null && focusLng != null) {
      focusMap(focusLat, focusLng);
    }
  }, [focusLat, focusLng, focusMap]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full rounded-2xl overflow-hidden border border-pink/10"
      style={{ height: '320px' }}
    />
  );
}

export type { FootprintMapProps };

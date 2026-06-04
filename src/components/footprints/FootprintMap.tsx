import { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import L from 'leaflet';
import { Maximize2, Minimize2, MapPin, Calendar } from 'lucide-react';
import type { Footprint } from '../../types';

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// ─── Emoji markers (no external CDN needed) ────────────────────────────────

function createEmojiIcon(emoji: string, label: string) {
  return L.divIcon({
    html: `<div style="
      font-size:32px;
      text-align:center;
      line-height:1;
      filter:drop-shadow(0 3px 6px rgba(0,0,0,0.25));
      display:flex;
      flex-direction:column;
      align-items:center;
    "><span>${emoji}</span><span style="
      font-size:9px;
      font-family:'Inter','PingFang SC',sans-serif;
      font-weight:600;
      color:#fff;
      background:rgba(0,0,0,0.4);
      border-radius:6px;
      padding:1px 7px;
      margin-top:1px;
      white-space:nowrap;
      line-height:1.5;
    ">${label}</span></div>`,
    iconSize: [40, 54],
    iconAnchor: [20, 54],
    popupAnchor: [0, -54],
    className: '',
  });
}

const partnerIcon = createEmojiIcon('❤️', 'TA');
const myIcon = createEmojiIcon('💙', '我');

// ─── Map sub-controllers ────────────────────────────────────────────────────

function FocusController({ lat, lng }: { lat?: number | null; lng?: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) {
      map.flyTo([lat, lng], 15, { duration: 0.8 });
    }
  }, [lat, lng, map]);
  return null;
}

function ClickController({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function ResizeController({ trigger }: { trigger: number }) {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 50);
  }, [trigger, map]);
  return null;
}

// ─── Popup content ──────────────────────────────────────────────────────────

function FootprintPopup({ fp, dark }: { fp: Footprint; dark: boolean }) {
  const dateStr = fp.date
    ? new Date(fp.date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const bg = dark ? '#3D2B3E' : '#fff';
  const text = dark ? '#F5E6F0' : '#1a1a2e';
  const muted = dark ? '#C495A8' : '#8e8e93';
  const border = dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,105,180,0.08)';
  const tagBg = dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,105,180,0.08)';
  const tagColor = fp.createdBy === 'partner' ? '#FF69B4' : '#4B9CD3';

  return (
    <div
      style={{
        fontFamily: "'Inter','PingFang SC',sans-serif",
        fontSize: 13,
        minWidth: 200,
        maxWidth: 280,
        background: bg,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {fp.photo && (
        <div
          style={{
            width: '100%',
            height: 130,
            overflow: 'hidden',
            borderBottom: `1px solid ${border}`,
          }}
        >
          <img
            src={fp.photo}
            alt={fp.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}
      <div style={{ padding: '12px 14px' }}>
        {/* Name + author badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <strong style={{ fontSize: 14, color: text }}>{fp.name}</strong>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: 8,
              background: tagBg,
              color: tagColor,
            }}
          >
            {fp.createdBy === 'partner' ? 'TA' : '我'}
          </span>
        </div>

        {/* Date */}
        {dateStr && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              color: muted,
              marginBottom: 4,
            }}
          >
            <Calendar size={10} style={{ flexShrink: 0 }} />
            <span>{dateStr}</span>
          </div>
        )}

        {/* Note */}
        {fp.note && (
          <p style={{ fontSize: 12, color: muted, margin: '6px 0 0', lineHeight: 1.6 }}>
            {fp.note}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

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
  const [fullscreen, setFullscreen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [resizeTrigger, setResizeTrigger] = useState(0);

  // Watch body.dark class so popup inline styles stay in sync
  useEffect(() => {
    const check = () => setDarkMode(document.body.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const toggleFullscreen = useCallback(() => {
    setFullscreen(prev => !prev);
    setResizeTrigger(n => n + 1);
  }, []);

  // Chronological route — connect footprints with a dashed pink line
  const routePositions = useMemo(() => {
    return [...footprints]
      .filter(f => f.date)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .map(f => [f.lat, f.lng] as L.LatLngTuple);
  }, [footprints]);

  const getIcon = useCallback(
    (createdBy: 'me' | 'partner') => (createdBy === 'partner' ? partnerIcon : myIcon),
    [],
  );

  const mapContent = (
    <MapContainer
      center={[35.86, 104.19]}
      zoom={5}
      zoomControl={false}
      style={{ height: '100%', width: '100%', borderRadius: fullscreen ? 0 : 16 }}
      attributionControl={!fullscreen}
    >
      {/* CartoDB Voyager — free, clean, modern tiles (no API key) */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
      />

      <ZoomControl position="bottomright" />

      <FocusController lat={focusLat} lng={focusLng} />
      {onMapClick && <ClickController onClick={onMapClick} />}
      <ResizeController trigger={resizeTrigger} />

      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={50}
        spiderfyOnMaxZoom
        showCoverageOnHover={false}
        disableClusteringAtZoom={16}
      >
        {footprints.map(fp => (
          <Marker
            key={fp.id}
            position={[fp.lat, fp.lng]}
            icon={getIcon(fp.createdBy)}
          >
            <Popup>
              <FootprintPopup fp={fp} dark={darkMode} />
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>

      {/* Chronological route line */}
      {routePositions.length > 1 && (
        <Polyline
          positions={routePositions}
          color="#FF69B4"
          dashArray="8 12"
          weight={2.5}
          opacity={0.5}
        />
      )}
    </MapContainer>
  );

  // ── Fullscreen mode ────────────────────────────────────────────────

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[1100] flex flex-col">
        {/* Top bar */}
        <div className="absolute top-4 left-4 right-4 z-[1101] flex items-center justify-between pointer-events-none">
          <div className="bg-white/90 dark:bg-[#3D2B3E]/90 backdrop-blur-xl rounded-2xl px-4 py-2.5 shadow-lg pointer-events-auto">
            <span className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <MapPin size={15} className="text-pink" />
              足迹地图 · {footprints.length} 个地点
            </span>
          </div>
          <button
            onClick={toggleFullscreen}
            className="w-10 h-10 bg-white/90 dark:bg-[#3D2B3E]/90 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg pointer-events-auto hover:bg-pink/5 transition-colors"
          >
            <Minimize2 size={18} className="text-text-primary" />
          </button>
        </div>

        <div className="flex-1">{mapContent}</div>
      </div>
    );
  }

  // ── Inline mode ────────────────────────────────────────────────────

  return (
    <div className="relative">
      {/* Fullscreen toggle */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 z-[500] w-8 h-8 bg-white/90 dark:bg-[#3D2B3E]/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm hover:bg-pink/5 transition-colors"
        title="全屏地图"
      >
        <Maximize2 size={14} className="text-text-muted" />
      </button>

      {/* Count badge */}
      <div className="absolute bottom-3 left-3 z-[500] bg-white/90 dark:bg-[#3D2B3E]/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm pointer-events-none">
        <span className="text-xs text-text-muted font-medium">
          📍 {footprints.length} 个地点
        </span>
      </div>

      {/* Map container */}
      <div
        className="w-full rounded-2xl overflow-hidden border border-pink/10 dark:border-white/[0.06]"
        style={{ height: 420 }}
      >
        {mapContent}
      </div>
    </div>
  );
}

export type { FootprintMapProps };

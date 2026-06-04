import { useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Plus, MapPin, Loader2 } from 'lucide-react';
import { useSharedAppState } from '../../hooks/AppStateContext';
import FootprintCard from './FootprintCard';
import FootprintAddDrawer from './FootprintAddDrawer';

// Lazy-load the map (Leaflet is ~80KB — only load when footprint tab is active)
const FootprintMap = lazy(() => import('./FootprintMap'));

export default function FootprintList() {
  const { state, deleteFootprint } = useSharedAppState();
  const [addOpen, setAddOpen] = useState(false);
  const [focusLat, setFocusLat] = useState<number | null>(null);
  const [focusLng, setFocusLng] = useState<number | null>(null);
  const [mapClickLat, setMapClickLat] = useState<number | undefined>();
  const [mapClickLng, setMapClickLng] = useState<number | undefined>();

  const footprints = state.footprints;

  const handleMapClick = (lat: number, lng: number) => {
    setMapClickLat(lat);
    setMapClickLng(lng);
    setAddOpen(true);
  };

  const handleFocus = (lat: number, lng: number) => {
    setFocusLat(lat);
    setFocusLng(lng);
    // Reset after animation
    setTimeout(() => {
      setFocusLat(null);
      setFocusLng(null);
    }, 300);
  };

  const handleOpenAdd = () => {
    setMapClickLat(undefined);
    setMapClickLng(undefined);
    setAddOpen(true);
  };

  if (footprints.length === 0) {
    return (
      <>
        <motion.div
          className="flex flex-col items-center justify-center py-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-20 h-20 rounded-full bg-warm-cream flex items-center justify-center mb-4">
            <MapPin size={32} className="text-text-muted/30" />
          </div>
          <h3 className="font-semibold text-text-primary mb-1">
            还没有足迹
          </h3>
          <p className="text-text-muted text-sm mb-6">
            记录你们一起去过的地方 🗺️
          </p>
          <button
            onClick={handleOpenAdd}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <Plus size={16} />
            记录第一个足迹
          </button>
        </motion.div>

        <FootprintAddDrawer
          open={addOpen}
          onClose={() => setAddOpen(false)}
        />
      </>
    );
  }

  return (
    <div>
      {/* Map — lazy loaded (Leaflet is heavy) */}
      <div className="mb-4">
        <Suspense
          fallback={
            <div className="w-full h-[420px] rounded-2xl bg-warm-cream flex items-center justify-center">
              <Loader2 size={24} className="text-pink/40 animate-spin" />
            </div>
          }
        >
          <FootprintMap
            footprints={footprints}
            focusLat={focusLat}
            focusLng={focusLng}
            onMapClick={handleMapClick}
          />
        </Suspense>
        <p className="text-[10px] text-text-muted/30 text-center mt-1.5">
          点击地图标记足迹
        </p>
      </div>

      {/* Count */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
          <MapPin size={14} className="text-pink" />
          足迹列表
        </span>
        <span className="text-xs text-text-muted/40">
          共 {footprints.length} 个地点
        </span>
      </div>

      {/* List */}
      <div className="space-y-2 mb-4">
        {footprints.map((fp, i) => (
          <FootprintCard
            key={fp.id}
            footprint={fp}
            onDelete={deleteFootprint}
            onFocus={handleFocus}
            index={i}
          />
        ))}
      </div>

      {/* Add button */}
      <button
        onClick={handleOpenAdd}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-pink/15 text-pink/50 hover:text-pink hover:border-pink/30 transition-all text-sm font-medium flex items-center justify-center gap-2 mb-8"
      >
        <Plus size={16} />
        记录足迹
      </button>

      {/* Add drawer */}
      <FootprintAddDrawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        defaultLat={mapClickLat}
        defaultLng={mapClickLng}
      />
    </div>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Crosshair } from 'lucide-react';
import { useSharedAppState } from '../../hooks/AppStateContext';

interface FootprintAddDrawerProps {
  open: boolean;
  onClose: () => void;
  defaultLat?: number;
  defaultLng?: number;
}

export default function FootprintAddDrawer({
  open,
  onClose,
  defaultLat,
  defaultLng,
}: FootprintAddDrawerProps) {
  const { identity, addFootprint } = useSharedAppState();
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');

  const handleOpen = () => {
    setName('');
    setNote('');
    setLat(defaultLat?.toString() || '');
    setLng(defaultLng?.toString() || '');
    setDate('');
    setSaving(false);
    setLocError('');
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setLocError('浏览器不支持定位功能');
      return;
    }
    setLocating(true);
    setLocError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => {
        setLocError('定位失败，请手动输入坐标');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSubmit = async () => {
    if (!name.trim() || !lat || !lng || !identity) return;
    setSaving(true);
    await addFootprint({
      name: name.trim(),
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      date: date || undefined,
      note: note.trim(),
      createdBy: identity,
    });
    setSaving(false);
    onClose();
  };

  const canSubmit = name.trim().length > 0 && lat && lng && !saving;

  return (
    <AnimatePresence onExitComplete={() => {}}>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-[28px] shadow-lift max-w-lg mx-auto overflow-hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onAnimationStart={handleOpen}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-pink/15" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <h3 className="font-semibold text-text-primary text-base">
                记录足迹
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-warm-cream flex items-center justify-center"
              >
                <X size={16} className="text-text-muted" />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 pb-6 space-y-4 max-h-[65vh] overflow-y-auto">
              {/* Location button */}
              <button
                onClick={handleLocate}
                disabled={locating}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-pink/5 border border-pink/10 text-pink text-sm font-medium hover:bg-pink/10 transition-colors disabled:opacity-50"
              >
                <Crosshair size={16} className={locating ? 'animate-pulse' : ''} />
                {locating ? '定位中...' : '使用当前位置'}
              </button>
              {locError && (
                <p className="text-xs text-red-400 text-center -mt-2">{locError}</p>
              )}

              {/* Place name */}
              <div>
                <label className="text-xs font-medium text-text-muted mb-2 block">
                  地点名称
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：外滩、故宫..."
                  className="input-field"
                  autoFocus
                  maxLength={50}
                />
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-text-muted mb-2 block">
                    纬度
                  </label>
                  <input
                    type="text"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="31.2304"
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted mb-2 block">
                    经度
                  </label>
                  <input
                    type="text"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    placeholder="121.4737"
                    className="input-field text-sm"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-medium text-text-muted mb-2 block">
                  日期（可选）
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-field"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Note */}
              <div>
                <label className="text-xs font-medium text-text-muted mb-2 block">
                  备注（可选）
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="记录一下在这里的故事..."
                  className="input-field min-h-[60px] resize-none"
                  rows={2}
                  maxLength={200}
                />
              </div>
            </div>

            {/* Submit button */}
            <div className="px-5 pb-8 pt-2">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`w-full py-3.5 rounded-[20px] font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  canSubmit
                    ? 'btn-primary'
                    : 'bg-pink/10 text-pink/40 cursor-not-allowed'
                }`}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    保存中...
                  </span>
                ) : (
                  <>
                    <Send size={16} />
                    记录足迹
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

import { useState, useRef } from 'react';
import { Send, Crosshair, Camera, X } from 'lucide-react';
import { useSharedAppState } from '../../hooks/AppStateContext';
import { uploadPhoto } from '../../lib/storage';
import BottomDrawer from '../ui/BottomDrawer';
import DatePicker from '../ui/DatePicker';

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
  const [photo, setPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    setName('');
    setNote('');
    setLat(defaultLat?.toString() || '');
    setLng(defaultLng?.toString() || '');
    setDate('');
    setPhoto(null);
    setSaving(false);
    setLocError('');
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
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

    let photoUrl: string | undefined;
    if (photo) {
      if (photo.startsWith('http')) {
        photoUrl = photo;
      } else {
        const uploaded = await uploadPhoto(photo, `footprint-${Date.now()}.jpg`);
        photoUrl = uploaded || photo;
      }
    }

    await addFootprint({
      name: name.trim(),
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      date: date || undefined,
      photo: photoUrl,
      note: note.trim(),
      createdBy: identity,
    });
    setSaving(false);
    onClose();
  };

  const canSubmit = name.trim().length > 0 && lat && lng && !saving;

  return (
    <BottomDrawer
      open={open}
      onClose={onClose}
      title="记录足迹"
      onOpen={handleOpen}
      onSubmit={handleSubmit}
      submitLabel="记录足迹"
      submitDisabled={!canSubmit}
      submitLoading={saving}
      submitIcon={<Send size={16} />}
    >
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
        <label className="text-xs font-medium text-text-muted mb-2 block">地点名称</label>
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
          <label className="text-xs font-medium text-text-muted mb-2 block">纬度</label>
          <input
            type="text"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="31.2304"
            className="input-field text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-text-muted mb-2 block">经度</label>
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
        <DatePicker
          value={date}
          onChange={setDate}
          max={new Date().toISOString().split('T')[0]}
          label="日期（可选）"
        />
      </div>

      {/* Note */}
      <div>
        <label className="text-xs font-medium text-text-muted mb-2 block">备注（可选）</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="记录一下在这里的故事..."
          className="input-field min-h-[60px] resize-none"
          rows={2}
          maxLength={200}
        />
      </div>

      {/* Photo upload */}
      <div>
        <label className="text-xs font-medium text-text-muted mb-2 block">照片（可选）</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoSelect}
          className="hidden"
        />
        {photo ? (
          <div className="relative inline-block">
            <img
              src={photo}
              alt="足迹照片"
              className="w-24 h-24 object-cover rounded-xl border border-pink/10"
            />
            <button
              onClick={() => setPhoto(null)}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white shadow border border-pink/10 flex items-center justify-center hover:bg-red-50 transition-colors"
            >
              <X size={12} className="text-red-400" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 rounded-xl border-2 border-dashed border-pink/15 text-pink/40 hover:text-pink hover:border-pink/30 transition-all flex flex-col items-center justify-center gap-1"
          >
            <Camera size={20} />
            <span className="text-[10px]">添加照片</span>
          </button>
        )}
      </div>
    </BottomDrawer>
  );
}

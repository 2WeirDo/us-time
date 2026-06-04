import { useState } from 'react';
import { Send } from 'lucide-react';
import { useSharedAppState } from '../../hooks/AppStateContext';
import { BUCKET_CATEGORIES } from '../../types';
import BottomDrawer from '../ui/BottomDrawer';

interface BucketListAddDrawerProps {
  open: boolean;
  onClose: () => void;
}

const DEFAULT_EMOJIS = ['✨', '💕', '🎯', '🌟', '🎨', '🎵', '📸', '🌍', '🍜', '🏃', '💪', '🎮'];

export default function BucketListAddDrawer({ open, onClose }: BucketListAddDrawerProps) {
  const { identity, addBucketItem } = useSharedAppState();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('other');
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [notes, setNotes] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [saving, setSaving] = useState(false);

  const handleOpen = () => {
    setTitle('');
    setCategory('other');
    setCustomCategory('');
    setShowCustomCategory(false);
    setNotes('');
    setEmoji('✨');
    setSaving(false);
  };

  const finalCategory = showCustomCategory ? customCategory.trim() : category;

  const handleSubmit = async () => {
    if (!title.trim() || !identity) return;
    if (showCustomCategory && !customCategory.trim()) return;
    setSaving(true);
    await addBucketItem({
      title: title.trim(),
      category: finalCategory || 'other',
      notes: notes.trim(),
      emoji,
      createdBy: identity,
    });
    setSaving(false);
    onClose();
  };

  const canSubmit = title.trim().length > 0 && !saving && (!showCustomCategory || customCategory.trim().length > 0);

  return (
    <BottomDrawer
      open={open}
      onClose={onClose}
      title="添加心愿"
      onOpen={handleOpen}
      onSubmit={handleSubmit}
      submitLabel="添加到清单"
      submitDisabled={!canSubmit}
      submitLoading={saving}
      submitIcon={<Send size={16} />}
    >
      {/* Emoji picker */}
      <div>
        <label className="text-xs font-medium text-text-muted mb-2 block">图标</label>
        <div className="flex gap-2 flex-wrap">
          {DEFAULT_EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${
                emoji === e
                  ? 'bg-pink/15 ring-2 ring-pink/30 scale-110'
                  : 'bg-warm-cream hover:bg-pink/5'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="text-xs font-medium text-text-muted mb-2 block">心愿内容</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如：一起看极光..."
          className="input-field"
          autoFocus
          maxLength={100}
        />
      </div>

      {/* Category */}
      <div>
        <label className="text-xs font-medium text-text-muted mb-2 block">分类</label>
        <div className="grid grid-cols-3 gap-2">
          {BUCKET_CATEGORIES.map(({ key, label, emoji: catEmoji }) => (
            <button
              key={key}
              onClick={() => { setCategory(key); setShowCustomCategory(false); }}
              className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 justify-center ${
                !showCustomCategory && category === key
                  ? 'bg-pink/15 text-pink ring-1 ring-pink/30'
                  : 'bg-warm-cream text-text-muted hover:bg-pink/5'
              }`}
            >
              <span>{catEmoji}</span>
              <span>{label}</span>
            </button>
          ))}
          <button
            onClick={() => { setShowCustomCategory(true); setCustomCategory(''); }}
            className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 justify-center ${
              showCustomCategory
                ? 'bg-pink/15 text-pink ring-1 ring-pink/30'
                : 'bg-warm-cream text-text-muted hover:bg-pink/5'
            }`}
          >
            <span>✏️</span>
            <span>自定义</span>
          </button>
        </div>
        {showCustomCategory && (
          <input
            type="text"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            placeholder="输入自定义分类名称..."
            className="input-field mt-2 text-sm"
            autoFocus
            maxLength={20}
          />
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs font-medium text-text-muted mb-2 block">备注（可选）</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="记录一下细节..."
          className="input-field min-h-[60px] resize-none"
          rows={2}
          maxLength={200}
        />
      </div>
    </BottomDrawer>
  );
}

import { useState, useMemo } from 'react';
import { Plus, ListTodo, CheckCircle2 } from 'lucide-react';
import { useSharedAppState } from '../../hooks/AppStateContext';
import { BUCKET_CATEGORIES } from '../../types';
import BucketListItemComponent from './BucketListItem';
import BucketListAddDrawer from './BucketListAddDrawer';
import type { BucketCategory } from '../../types';

export default function BucketListView() {
  const { state, toggleBucketCompletion, deleteBucketItem } = useSharedAppState();
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<BucketCategory | 'all'>('all');

  // Merge preset categories with custom categories from existing data
  const allCategories = useMemo(() => {
    const presetKeys = new Set(BUCKET_CATEGORIES.map((c) => c.key));
    const customCategories: { key: string; label: string; emoji: string }[] = [];
    const seen = new Set<string>();
    state.bucketListItems.forEach((item) => {
      if (!presetKeys.has(item.category) && !seen.has(item.category)) {
        seen.add(item.category);
        customCategories.push({ key: item.category, label: item.category, emoji: '🏷️' });
      }
    });
    return [...BUCKET_CATEGORIES, ...customCategories];
  }, [state.bucketListItems]);

  const filtered = useMemo(() => {
    const source = state.bucketListItems;
    if (filterCategory === 'all') return source;
    return source.filter((item) => item.category === filterCategory);
  }, [state.bucketListItems, filterCategory]);

  const activeItems = useMemo(
    () => state.bucketListItems.filter((i) => !i.completed),
    [state.bucketListItems],
  );
  const completedItems = useMemo(
    () => state.bucketListItems.filter((i) => i.completed),
    [state.bucketListItems],
  );

  const progress =
    state.bucketListItems.length > 0
      ? Math.round((completedItems.length / state.bucketListItems.length) * 100)
      : 0;

  if (state.bucketListItems.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-warm-cream flex items-center justify-center mb-4">
            <ListTodo size={32} className="text-text-muted/30" />
          </div>
          <h3 className="font-semibold text-text-primary mb-1">
            还没有心愿清单
          </h3>
          <p className="text-text-muted text-sm mb-6">
            一起写下想一起完成的事吧 💕
          </p>
          <button
            onClick={() => setAddDrawerOpen(true)}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <Plus size={16} />
            添加第一个心愿
          </button>
        </div>

        <BucketListAddDrawer
          open={addDrawerOpen}
          onClose={() => setAddDrawerOpen(false)}
          customCategories={allCategories.filter((c) => !BUCKET_CATEGORIES.some((p) => p.key === c.key))}
        />
      </>
    );
  }

  return (
    <div>
      {/* Progress bar */}
      <div className="card border-pink/10 mb-4 animate-slide-up">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-pink" />
            <span className="text-sm font-semibold text-text-primary">
              完成进度
            </span>
          </div>
          <span className="text-xs font-medium text-pink">
            {completedItems.length}/{state.bucketListItems.length}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-warm-cream overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink to-pink-dark rounded-full transition-[width] duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-text-muted/40 mt-1.5">
          还有 {activeItems.length} 个心愿等待实现
        </p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        <button
          onClick={() => setFilterCategory('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            filterCategory === 'all'
              ? 'bg-pink text-white'
              : 'bg-warm-cream text-text-muted hover:text-text-primary'
          }`}
        >
          全部
        </button>
        {allCategories.map(({ key, label, emoji }) => (
          <button
            key={key}
            onClick={() => setFilterCategory(filterCategory === key ? 'all' : key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
              filterCategory === key
                ? 'bg-pink text-white'
                : 'bg-warm-cream text-text-muted hover:text-text-primary'
            }`}
          >
            <span>{emoji}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Item list */}
      <div className="space-y-2.5 mb-4">
        {filtered.length === 0 ? (
          <p className="text-center text-text-muted/40 text-sm py-8">
            这个分类下还没有心愿
          </p>
        ) : (
          filtered.map((item, i) => (
            <BucketListItemComponent
              key={item.id}
              item={item}
              onToggle={toggleBucketCompletion}
              onDelete={deleteBucketItem}
              index={i}
            />
          ))
        )}
      </div>

      {/* Add button */}
      <button
        onClick={() => setAddDrawerOpen(true)}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-pink/15 text-pink/50 hover:text-pink hover:border-pink/30 transition-all text-sm font-medium flex items-center justify-center gap-2 mb-8"
      >
        <Plus size={16} />
        添加心愿
      </button>

      {/* Add drawer */}
      <BucketListAddDrawer
        open={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
        customCategories={allCategories.filter((c) => !BUCKET_CATEGORIES.some((p) => p.key === c.key))}
      />
    </div>
  );
}

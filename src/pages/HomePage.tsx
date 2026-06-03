import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import DashboardGrid from '../components/dashboard/DashboardGrid';
import Timeline from '../components/timeline/Timeline';
import Fab from '../components/ui/Fab';
import NewPostDrawer from '../components/post/NewPostDrawer';
import { useSharedAppState } from '../hooks/AppStateContext';
import { useMilestoneNotifications } from '../hooks/useMilestoneNotifications';
import { MOOD_OPTIONS } from '../types';
import type { Post } from '../types';

export default function HomePage() {
  const { state } = useSharedAppState();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  // Milestone notifications (within 3 days)
  useMilestoneNotifications(state.coupleInfo?.startDate, state.milestones, 3);

  const handleNewPost = useCallback(() => {
    setEditingPost(null);
    setDrawerOpen(true);
  }, []);

  const handleEditPost = useCallback((post: Post) => {
    setEditingPost(post);
    setDrawerOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setDrawerOpen(false);
    setEditingPost(null);
  }, []);

  const activeFilters = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (moodFilter) count++;
    return count;
  }, [searchQuery, moodFilter]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Dashboard Cards */}
      <DashboardGrid />

      {/* Timeline section */}
      <section className="mt-6">
        {/* Header with search toggle */}
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="font-display text-base font-semibold text-text-muted">
            我们的时光
          </h2>
          <button
            onClick={() => {
              setShowSearch(!showSearch);
              if (showSearch) {
                setSearchQuery('');
                setMoodFilter(null);
              }
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              showSearch || activeFilters > 0
                ? 'bg-pink/10 text-pink'
                : 'text-text-muted/40 hover:text-text-muted'
            }`}
          >
            <Search size={16} />
          </button>
        </div>

        {/* Search bar + mood filter */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="space-y-3 pb-3">
                {/* Search input */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索记录..."
                    className="w-full pl-9 pr-8 py-2 text-sm bg-white rounded-xl border border-pink/10 focus:outline-none focus:ring-2 focus:ring-pink/20 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted/40 hover:text-text-muted"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Mood filter chips */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => setMoodFilter(null)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      !moodFilter
                        ? 'bg-pink text-white'
                        : 'bg-warm-cream text-text-muted hover:text-text-primary'
                    }`}
                  >
                    全部
                  </button>
                  {MOOD_OPTIONS.map(({ emoji, label }) => (
                    <button
                      key={emoji}
                      onClick={() => setMoodFilter(moodFilter === emoji ? null : emoji)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                        moodFilter === emoji
                          ? 'bg-pink text-white'
                          : 'bg-warm-cream text-text-muted hover:text-text-primary'
                      }`}
                    >
                      <span>{emoji}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Timeline
          onEditPost={handleEditPost}
          searchQuery={searchQuery}
          moodFilter={moodFilter}
        />
      </section>

      {/* Floating Action Button */}
      <Fab onNewPost={handleNewPost} />

      {/* New / Edit Post Drawer */}
      <NewPostDrawer
        open={drawerOpen}
        onClose={handleClose}
        editingPost={editingPost}
      />
    </motion.div>
  );
}

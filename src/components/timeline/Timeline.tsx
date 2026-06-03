import { useMemo } from 'react';
import { useSharedAppState } from '../../hooks/AppStateContext';
import TimelinePost from './TimelinePost';
import EmptyTimeline from './EmptyTimeline';
import OnThisDay from './OnThisDay';
import type { Post } from '../../types';

interface TimelineProps {
  onEditPost?: (post: Post) => void;
  searchQuery?: string;
  moodFilter?: string | null;
}

export default function Timeline({ onEditPost, searchQuery = '', moodFilter = null }: TimelineProps) {
  const { state } = useSharedAppState();

  const posts = useMemo(() => {
    const source = state.posts;
    if (source.length === 0) return [];

    let filtered = source;

    // Search by content
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((p) => p.content.toLowerCase().includes(q));
    }

    // Filter by mood
    if (moodFilter) {
      filtered = filtered.filter((p) => p.mood === moodFilter);
    }

    return filtered;
  }, [state.posts, searchQuery, moodFilter]);

  if (state.posts.length === 0) {
    return <EmptyTimeline />;
  }

  return (
    <div>
      {/* On This Day — only show when there's no active filter */}
      {!searchQuery.trim() && !moodFilter && (
        <OnThisDay posts={state.posts} />
      )}

      {posts.length === 0 ? (
        <p className="text-center text-text-muted/50 text-sm py-8">
          {searchQuery.trim() ? '没有匹配的记录' : '没有符合心情的记录'}
        </p>
      ) : (
        posts.map((post, index) => (
          <TimelinePost key={post.id} post={post} index={index} onEdit={onEditPost} />
        ))
      )}
    </div>
  );
}

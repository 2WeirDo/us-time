import { useState } from 'react';
import { MessageCircle, Send, Trash2 } from 'lucide-react';
import { useSharedAppState } from '../../hooks/AppStateContext';
import type { PostComment } from '../../types';

interface CommentSectionProps {
  postId: string;
}

function formatCommentTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} 小时前`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} 天前`;

  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  });
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const { state, identity, getCommentsForPost, addComment, removeComment } =
    useSharedAppState();
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState('');

  const comments = getCommentsForPost(postId);
  const commentCount = comments.length;

  const handleSubmit = async () => {
    if (!input.trim()) return;
    await addComment(postId, input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const authorName = (author: 'me' | 'partner') =>
    author === 'me'
      ? state.coupleInfo?.myName || '我'
      : state.coupleInfo?.partnerName || 'TA';

  const avatarUrl = (author: 'me' | 'partner') =>
    author === 'me'
      ? state.coupleInfo?.avatarMe
      : state.coupleInfo?.avatarPartner;

  const fallbackEmoji = (author: 'me' | 'partner') =>
    author === 'me' ? '🙋' : '💁';

  return (
    <div className="mt-2">
      {/* Toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-1.5 text-xs transition-colors ${
          expanded || commentCount > 0
            ? 'text-pink font-medium'
            : 'text-text-muted/40 hover:text-pink/60'
        }`}
      >
        <MessageCircle size={13} />
        {commentCount > 0 ? (
          <span>
            评论 <span className="font-semibold">{commentCount}</span>
          </span>
        ) : (
          <span>评论</span>
        )}
      </button>

      {/* Expanded section */}
      {expanded && (
        <div className="mt-2 pl-1 border-l-2 border-pink/10 ml-1">
          {/* Comment list */}
          {comments.length > 0 && (
            <div className="space-y-2 mb-2 max-h-48 overflow-y-auto">
              {comments.map((c) => (
                <CommentBubble
                  key={c.id}
                  comment={c}
                  isOwn={c.author === identity}
                  authorName={authorName(c.author)}
                  avatarUrl={avatarUrl(c.author)}
                  fallbackEmoji={fallbackEmoji(c.author)}
                  onDelete={() => removeComment(c.id)}
                />
              ))}
            </div>
          )}

          {/* No comments yet */}
          {comments.length === 0 && (
            <p className="text-xs text-text-muted/40 py-2 ml-3">
              还没有评论，说点什么吧 💕
            </p>
          )}

          {/* Input row */}
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="说点什么..."
              maxLength={200}
              className="flex-1 text-xs bg-warm-cream dark:bg-[#3D2B3E] rounded-xl px-3 py-2 text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:ring-1 focus:ring-pink/30 transition-all"
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-pink/10 hover:bg-pink text-pink hover:text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Single comment bubble */
function CommentBubble({
  comment,
  isOwn,
  authorName,
  avatarUrl,
  fallbackEmoji,
  onDelete,
}: {
  comment: PostComment;
  isOwn: boolean;
  authorName: string;
  avatarUrl?: string;
  fallbackEmoji: string;
  onDelete: () => void;
}) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div
      className="flex gap-2 items-start group"
      onPointerDown={() => {
        if (isOwn) {
          const timer = setTimeout(() => setShowDelete(true), 500);
          (comment as any).__timer = timer;
        }
      }}
      onPointerUp={() => {
        clearTimeout((comment as any).__timer);
      }}
      onPointerLeave={() => {
        clearTimeout((comment as any).__timer);
      }}
    >
      {/* Avatar */}
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={authorName}
          className="w-6 h-6 rounded-full object-cover flex-shrink-0 ring-1 ring-pink/10"
        />
      ) : (
        <span className="text-base flex-shrink-0 mt-0.5">{fallbackEmoji}</span>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[11px] font-semibold text-text-primary">
            {authorName}
          </span>
          <span className="text-[10px] text-text-muted/40">
            {formatCommentTime(comment.createdAt)}
          </span>
        </div>
        <p className="text-xs text-text-primary leading-relaxed break-words">
          {comment.content}
        </p>

        {/* Delete button (own comments, long press) */}
        {showDelete && isOwn && (
          <button
            onClick={onDelete}
            className="mt-0.5 flex items-center gap-1 text-[10px] text-red/50 hover:text-red transition-colors"
          >
            <Trash2 size={10} />
            删除
          </button>
        )}
      </div>
    </div>
  );
}

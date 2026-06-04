import { useState, useCallback, useEffect } from 'react';
import type { PostComment } from '../types';
import {
  fetchComments,
  createComment as createCommentDB,
  deleteComment as deleteCommentDB,
  subscribeToComments,
} from '../lib/db';

interface UseCommentsDeps {
  unlocked: boolean;
  identity: 'me' | 'partner' | null;
  toast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function useComments({ unlocked, identity, toast }: UseCommentsDeps) {
  const [comments, setComments] = useState<PostComment[]>([]);

  // ---- Fetch all comments on unlock ----
  useEffect(() => {
    if (!unlocked) return;
    fetchComments().then(setComments).catch(console.error);
  }, [unlocked]);

  // ---- Real-time subscription ----
  useEffect(() => {
    if (!unlocked) return;
    const cleanup = subscribeToComments(
      (newComment) =>
        setComments((prev) => {
          if (prev.some((c) => c.id === newComment.id)) return prev;
          return [...prev, newComment];
        }),
      (commentId) =>
        setComments((prev) => prev.filter((c) => c.id !== commentId))
    );
    return cleanup;
  }, [unlocked]);

  // ---- Actions ----

  const addComment = useCallback(
    async (postId: string, content: string) => {
      if (!identity || !content.trim()) return;
      const result = await createCommentDB({
        postId,
        author: identity,
        content: content.trim(),
      });
      if (!result) {
        toast('评论失败，请重试', 'error');
      }
    },
    [identity, toast]
  );

  const removeComment = useCallback(
    async (commentId: string) => {
      // Optimistic removal
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      const success = await deleteCommentDB(commentId);
      if (!success) {
        toast('删除失败，请重试', 'error');
        // Reload on failure
        fetchComments().then(setComments).catch(console.error);
      }
    },
    [toast]
  );

  /** Get comments for a specific post */
  const getCommentsForPost = useCallback(
    (postId: string): PostComment[] =>
      comments.filter((c) => c.postId === postId),
    [comments]
  );

  return { comments, addComment, removeComment, getCommentsForPost };
}

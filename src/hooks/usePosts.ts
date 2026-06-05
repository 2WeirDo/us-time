import { useCallback } from 'react';
import type { AppState, Post } from '../types';
import {
  createPost as createPostDB,
  updatePostInDB,
  deletePostFromDB,
  updatePostReactions,
} from '../lib/db';

interface UsePostsDeps {
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  identity: 'me' | 'partner' | null;
  toast: (msg: string, type?: 'success' | 'error') => void;
  loadData: () => Promise<void>;
}

export function usePosts({ setState, identity, toast, loadData }: UsePostsDeps) {
  // ---- Actions ----

  const addPost = useCallback(
    async (post: Omit<Post, 'id' | 'createdAt'>) => {
      const result = await createPostDB(post);
      if (result) {
        setState((prev) => ({ ...prev, posts: [result, ...prev.posts] }));
      } else {
        toast('发布失败，请重试', 'error');
      }
    },
    [setState, toast]
  );

  const editPost = useCallback(
    async (
      postId: string,
      updates: { content?: string; photos?: string[]; audio?: string | null; mood?: string | null }
    ) => {
      setState((prev) => ({
        ...prev,
        posts: prev.posts.map((p) => {
          if (p.id !== postId) return p;
          const { audio: updAudio, mood: updMood, ...rest } = updates;
          return {
            ...p,
            ...rest,
            mood: updMood ?? p.mood,
            audio: updAudio !== undefined ? (updAudio ?? undefined) : p.audio,
          };
        }),
      }));
      const result = await updatePostInDB(postId, updates);
      if (!result) {
        toast('保存失败，请重试', 'error');
        loadData();
      }
    },
    [setState, toast, loadData]
  );

  const deletePost = useCallback(
    async (postId: string) => {
      setState((prev) => ({
        ...prev,
        posts: prev.posts.filter((p) => p.id !== postId),
      }));
      const success = await deletePostFromDB(postId);
      if (!success) {
        toast('删除失败，请重试', 'error');
        loadData();
      }
    },
    [setState, toast, loadData]
  );

  const toggleReaction = useCallback(
    async (postId: string, emoji: string) => {
      const ident = identity;
      if (!ident) return;

      setState((prev) => {
        const post = prev.posts.find((p) => p.id === postId);
        if (!post) return prev;

        const reactions = { ...post.reactions };
        const current = reactions[emoji] || [];
        if (current.includes(ident)) {
          reactions[emoji] = current.filter((a) => a !== ident);
          if (reactions[emoji].length === 0) delete reactions[emoji];
        } else {
          reactions[emoji] = [...current, ident];
        }

        updatePostReactions(postId, reactions).catch((e) =>
          console.error('toggleReaction persist error:', e)
        );

        return {
          ...prev,
          posts: prev.posts.map((p) =>
            p.id === postId ? { ...p, reactions } : p
          ),
        };
      });
    },
    [identity, setState]
  );

  return { addPost, editPost, deletePost, toggleReaction };
}

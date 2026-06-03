import { getSupabase } from './supabase';
import type { Post, Milestone, CoupleInfo } from '../types';

// ====== Posts ======

export async function fetchPosts(): Promise<Post[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchPosts error:', error);
    return [];
  }

  return (data || []).map(mapPost);
}

export async function createPost(
  post: Omit<Post, 'id' | 'createdAt'>
): Promise<Post | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from('posts')
    .insert({
      author: post.author,
      content: post.content,
      photos: post.photos,
      audio: post.audio || null,
      mood: post.mood || null,
    })
    .select()
    .single();

  if (error) {
    console.error('createPost error:', error);
    return null;
  }

  return mapPost(data);
}

export async function updatePostInDB(
  postId: string,
  updates: { content?: string; photos?: string[]; audio?: string | null; mood?: string | null }
): Promise<Post | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from('posts')
    .update(updates)
    .eq('id', postId)
    .select()
    .single();

  if (error) {
    console.error('updatePost error:', error);
    return null;
  }

  return mapPost(data);
}

export async function deletePostFromDB(postId: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb.from('posts').delete().eq('id', postId);
  return !error;
}

/**
 * Subscribe to real-time post changes.
 * Returns an unsubscribe function.
 */
export function subscribeToPosts(
  onInsert: (post: Post) => void,
  onUpdate: (post: Post) => void,
  onDelete: (postId: string) => void
): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};

  const channel = sb
    .channel('posts-changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'posts' },
      (payload) => {
        onInsert(mapPost(payload.new as any));
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'posts' },
      (payload) => {
        onUpdate(mapPost(payload.new as any));
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'posts' },
      (payload) => {
        onDelete((payload.old as any).id);
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

// ====== Couple Settings ======

export async function fetchCoupleSettings(): Promise<{
  coupleInfo: CoupleInfo;
  passcode: string;
} | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from('couple_settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error || !data) return null;

  return {
    coupleInfo: {
      myName: data.my_name,
      partnerName: data.partner_name,
      startDate: data.start_date,
      coupleEmoji: data.couple_emoji,
      avatarMe: data.avatar_me || undefined,
      avatarPartner: data.avatar_partner || undefined,
    },
    passcode: data.passcode,
  };
}

export async function saveCoupleSettings(
  coupleInfo: CoupleInfo,
  passcode: string
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb.from('couple_settings').upsert({
    id: 1,
    my_name: coupleInfo.myName,
    partner_name: coupleInfo.partnerName,
    start_date: coupleInfo.startDate,
    couple_emoji: coupleInfo.coupleEmoji || '👫',
    avatar_me: coupleInfo.avatarMe || null,
    avatar_partner: coupleInfo.avatarPartner || null,
    passcode,
  });

  return !error;
}

export async function verifyPasscode(passcode: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const { data, error } = await sb
    .from('couple_settings')
    .select('passcode')
    .eq('id', 1)
    .single();

  if (error || !data) return false;
  return data.passcode === passcode;
}

// ====== Milestones ======

export async function fetchMilestones(): Promise<Milestone[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from('milestones')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error('fetchMilestones error:', error);
    return [];
  }

  return (data || []).map((m) => ({
    id: m.id,
    title: m.title,
    date: m.date,
    type: m.type,
    icon: m.icon || undefined,
  }));
}

export async function createMilestone(
  ms: Omit<Milestone, 'id'>
): Promise<Milestone | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from('milestones')
    .insert({
      title: ms.title,
      date: ms.date,
      type: ms.type,
      icon: ms.icon || '💝',
    })
    .select()
    .single();

  if (error) {
    console.error('createMilestone error:', error);
    return null;
  }

  return {
    id: data.id,
    title: data.title,
    date: data.date,
    type: data.type,
    icon: data.icon,
  };
}

export async function deleteMilestoneFromDB(
  msId: string
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb.from('milestones').delete().eq('id', msId);
  return !error;
}

// ====== Helpers ======

function mapPost(db: any): Post {
  return {
    id: db.id,
    author: db.author,
    content: db.content || '',
    photos: db.photos || [],
    audio: db.audio || undefined,
    mood: db.mood || undefined,
    createdAt: db.created_at,
    reactions: db.reactions || {},
  };
}

// ====== Reactions ======

export async function updatePostReactions(
  postId: string,
  reactions: Record<string, string[]>
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb
    .from('posts')
    .update({ reactions })
    .eq('id', postId);

  return !error;
}

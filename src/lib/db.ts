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

// ====== Love Letters ======
import type { LoveLetter, BucketListItem, Footprint, PetState } from '../types';

export async function fetchLoveLetters(): Promise<LoveLetter[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('love_letters')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchLoveLetters error:', error); return []; }
  return (data || []).map(mapLetter);
}

export async function createLoveLetter(letter: Omit<LoveLetter, 'id' | 'createdAt'>): Promise<LoveLetter | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('love_letters')
    .insert({
      author: letter.author,
      image_url: letter.imageUrl || null,
      title: letter.title || null,
      message: letter.message || null,
      read: letter.read,
    })
    .select()
    .single();
  if (error) { console.error('createLoveLetter error:', error); return null; }
  return mapLetter(data);
}

export async function markLetterAsRead(letterId: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from('love_letters').update({ read: true }).eq('id', letterId);
  return !error;
}

export async function deleteLoveLetter(letterId: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from('love_letters').delete().eq('id', letterId);
  return !error;
}

export function subscribeToLetters(
  onInsert: (letter: LoveLetter) => void,
  onUpdate: (letter: LoveLetter) => void,
  onDelete: (id: string) => void
): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};
  const channel = sb
    .channel('letters-changes')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'love_letters' }, (p) => onInsert(mapLetter(p.new as any)))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'love_letters' }, (p) => onUpdate(mapLetter(p.new as any)))
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'love_letters' }, (p) => onDelete((p.old as any).id))
    .subscribe();
  return () => { channel.unsubscribe(); };
}

// ====== Bucket List Items ======

export async function fetchBucketItems(): Promise<BucketListItem[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('bucket_list_items')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchBucketItems error:', error); return []; }
  return (data || []).map(mapBucketItem);
}

export async function createBucketItem(item: Omit<BucketListItem, 'id' | 'createdAt'>): Promise<BucketListItem | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('bucket_list_items')
    .insert({
      title: item.title,
      category: item.category,
      notes: item.notes,
      emoji: item.emoji,
      completed: item.completed,
      completed_by: item.completedBy || null,
      completed_at: item.completedAt || null,
      created_by: item.createdBy,
    })
    .select()
    .single();
  if (error) { console.error('createBucketItem error:', error); return null; }
  return mapBucketItem(data);
}

export async function updateBucketItem(
  itemId: string,
  updates: { title?: string; category?: string; notes?: string; emoji?: string; completed?: boolean; completedBy?: string | null; completedAt?: string | null }
): Promise<BucketListItem | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const dbUpdates: Record<string, any> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
  if (updates.emoji !== undefined) dbUpdates.emoji = updates.emoji;
  if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
  if (updates.completedBy !== undefined) dbUpdates.completed_by = updates.completedBy;
  if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;
  const { data, error } = await sb.from('bucket_list_items').update(dbUpdates).eq('id', itemId).select().single();
  if (error) { console.error('updateBucketItem error:', error); return null; }
  return mapBucketItem(data);
}

export async function deleteBucketItem(itemId: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from('bucket_list_items').delete().eq('id', itemId);
  return !error;
}

export function subscribeToBucketItems(
  onInsert: (item: BucketListItem) => void,
  onUpdate: (item: BucketListItem) => void,
  onDelete: (id: string) => void
): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};
  const channel = sb
    .channel('bucket-changes')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bucket_list_items' }, (p) => onInsert(mapBucketItem(p.new as any)))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bucket_list_items' }, (p) => onUpdate(mapBucketItem(p.new as any)))
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'bucket_list_items' }, (p) => onDelete((p.old as any).id))
    .subscribe();
  return () => { channel.unsubscribe(); };
}

// ====== Footprints ======

export async function fetchFootprints(): Promise<Footprint[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('footprints')
    .select('*')
    .order('date', { ascending: false });
  if (error) { console.error('fetchFootprints error:', error); return []; }
  return (data || []).map(mapFootprint);
}

export async function createFootprint(fp: Omit<Footprint, 'id' | 'createdAt'>): Promise<Footprint | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('footprints')
    .insert({
      name: fp.name,
      lat: fp.lat,
      lng: fp.lng,
      date: fp.date || null,
      photo: fp.photo || null,
      note: fp.note,
      created_by: fp.createdBy,
    })
    .select()
    .single();
  if (error) { console.error('createFootprint error:', error); return null; }
  return mapFootprint(data);
}

export async function deleteFootprint(fpId: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from('footprints').delete().eq('id', fpId);
  return !error;
}

export function subscribeToFootprints(
  onInsert: (fp: Footprint) => void,
  onDelete: (id: string) => void
): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};
  const channel = sb
    .channel('footprints-changes')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'footprints' }, (p) => onInsert(mapFootprint(p.new as any)))
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'footprints' }, (p) => onDelete((p.old as any).id))
    .subscribe();
  return () => { channel.unsubscribe(); };
}

// ====== Pet State ======

export async function fetchPetState(): Promise<PetState | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('pet_state')
    .select('*')
    .eq('id', 1)
    .single();
  if (error || !data) return null;
  return mapPetState(data);
}

export async function savePetState(pet: PetState): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from('pet_state').upsert({
    id: 1,
    pet_type: pet.petType,
    name: pet.name,
    happiness: pet.happiness,
    last_fed_at: pet.lastFedAt,
    last_interaction_at: pet.lastInteractionAt,
  });
  return !error;
}

// ====== Helpers (extended) ======

function mapLetter(db: any): LoveLetter {
  return {
    id: db.id,
    author: db.author,
    imageUrl: db.image_url || undefined,
    title: db.title || undefined,
    message: db.message || undefined,
    read: db.read || false,
    createdAt: db.created_at,
  };
}

function mapBucketItem(db: any): BucketListItem {
  return {
    id: db.id,
    title: db.title,
    category: db.category || 'other',
    notes: db.notes || '',
    emoji: db.emoji || '✨',
    completed: db.completed || false,
    completedBy: db.completed_by || undefined,
    completedAt: db.completed_at || undefined,
    createdBy: db.created_by,
    createdAt: db.created_at,
  };
}

function mapFootprint(db: any): Footprint {
  return {
    id: db.id,
    name: db.name,
    lat: db.lat,
    lng: db.lng,
    date: db.date || undefined,
    photo: db.photo || undefined,
    note: db.note || '',
    createdBy: db.created_by,
    createdAt: db.created_at,
  };
}

function mapPetState(db: any): PetState {
  return {
    petType: db.pet_type || 'cat',
    name: db.name || '小可爱',
    happiness: db.happiness ?? 50,
    lastFedAt: db.last_fed_at,
    lastInteractionAt: db.last_interaction_at,
  };
}

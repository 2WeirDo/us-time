import { getSupabase } from './supabase';
import { isString, isStringArray, isAuthor, sha256 } from './utils';
import type { Post, Milestone, CoupleInfo, PostComment, LoveLetter, BucketListItem, Footprint, PetState, TodayMood } from '../types';

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
 * Single unified Realtime channel — all tables, one WebSocket connection.
 * Returns an unsubscribe function.
 */
export function subscribeToAll(handlers: {
  onPostInsert?: (post: Post) => void;
  onPostUpdate?: (post: Post) => void;
  onPostDelete?: (postId: string) => void;
  onLetterInsert?: (letter: LoveLetter) => void;
  onLetterUpdate?: (letter: LoveLetter) => void;
  onLetterDelete?: (id: string) => void;
  onBucketInsert?: (item: BucketListItem) => void;
  onBucketUpdate?: (item: BucketListItem) => void;
  onBucketDelete?: (id: string) => void;
  onFootprintInsert?: (fp: Footprint) => void;
  onFootprintDelete?: (id: string) => void;
  onMoodInsert?: (mood: TodayMood) => void;
  onMoodUpdate?: (mood: TodayMood) => void;
  onMoodDelete?: (mood: { date: string; author: string }) => void;
}): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};

  const channel = sb.channel('us-time-all-changes');

  // Posts
  channel
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (p) =>
      handlers.onPostInsert?.(mapPost(p.new as any))
    )
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' }, (p) =>
      handlers.onPostUpdate?.(mapPost(p.new as any))
    )
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, (p) =>
      handlers.onPostDelete?.((p.old as any).id)
    );

  // Letters
  channel
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'love_letters' }, (p) =>
      handlers.onLetterInsert?.(mapLetter(p.new as any))
    )
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'love_letters' }, (p) =>
      handlers.onLetterUpdate?.(mapLetter(p.new as any))
    )
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'love_letters' }, (p) =>
      handlers.onLetterDelete?.((p.old as any).id)
    );

  // Bucket list
  channel
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bucket_list_items' }, (p) =>
      handlers.onBucketInsert?.(mapBucketItem(p.new as any))
    )
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bucket_list_items' }, (p) =>
      handlers.onBucketUpdate?.(mapBucketItem(p.new as any))
    )
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'bucket_list_items' }, (p) =>
      handlers.onBucketDelete?.((p.old as any).id)
    );

  // Footprints
  channel
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'footprints' }, (p) =>
      handlers.onFootprintInsert?.(mapFootprint(p.new as any))
    )
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'footprints' }, (p) =>
      handlers.onFootprintDelete?.((p.old as any).id)
    );

  // Today moods
  channel
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'today_moods' }, (p) =>
      handlers.onMoodInsert?.(mapTodayMood(p.new as any))
    )
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'today_moods' }, (p) =>
      handlers.onMoodUpdate?.(mapTodayMood(p.new as any))
    )
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'today_moods' }, (p) =>
      handlers.onMoodDelete?.({ date: (p.old as any).date, author: (p.old as any).author })
    );

  channel.subscribe();
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

  // Hash passcode with SHA-256 before storing
  const hashed = await sha256(passcode);

  const { error } = await sb.from('couple_settings').upsert({
    id: 1,
    my_name: coupleInfo.myName,
    partner_name: coupleInfo.partnerName,
    start_date: coupleInfo.startDate,
    couple_emoji: coupleInfo.coupleEmoji || '👫',
    avatar_me: coupleInfo.avatarMe || null,
    avatar_partner: coupleInfo.avatarPartner || null,
    passcode: hashed, // stored as SHA-256 hash
  });

  return !error;
}

/**
 * Verify a passcode against the stored SHA-256 hash.
 * Includes rate-limiting: max 5 failed attempts before 30s cooldown.
 */
const FAILED_LOGIN_KEY = 'us-time-failed-logins';
const MAX_FAILED_ATTEMPTS = 5;
const COOLDOWN_MS = 30_000;

function checkLoginRateLimit(): boolean {
  try {
    const stored = localStorage.getItem(FAILED_LOGIN_KEY);
    if (!stored) return true;
    const record = JSON.parse(stored);
    if (record.count >= MAX_FAILED_ATTEMPTS) {
      const elapsed = Date.now() - record.firstFailedAt;
      if (elapsed < COOLDOWN_MS) return false;
      // Cooldown expired — reset
      localStorage.removeItem(FAILED_LOGIN_KEY);
    }
    return true;
  } catch {
    return true;
  }
}

function recordFailedLogin(): void {
  try {
    const stored = localStorage.getItem(FAILED_LOGIN_KEY);
    const record = stored ? JSON.parse(stored) : null;
    if (record && record.count < MAX_FAILED_ATTEMPTS) {
      record.count++;
      localStorage.setItem(FAILED_LOGIN_KEY, JSON.stringify(record));
    } else {
      localStorage.setItem(
        FAILED_LOGIN_KEY,
        JSON.stringify({ count: 1, firstFailedAt: Date.now() })
      );
    }
  } catch {
    // localStorage full — ignore
  }
}

export async function verifyPasscode(passcode: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  // Check rate limit
  if (!checkLoginRateLimit()) {
    throw new Error('尝试次数过多，请30秒后再试');
  }

  const { data, error } = await sb
    .from('couple_settings')
    .select('passcode')
    .eq('id', 1)
    .single();

  if (error || !data) return false;

  // Compare against stored SHA-256 hash
  const hashed = await sha256(passcode);
  const valid = data.passcode === hashed;

  if (!valid) {
    recordFailedLogin();
  } else {
    // Clear failed attempts on success
    localStorage.removeItem(FAILED_LOGIN_KEY);
  }

  return valid;
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

function mapPost(db: unknown): Post {
  const row = db as Record<string, unknown>;
  return {
    id: isString(row.id) ? row.id : crypto.randomUUID(),
    author: isAuthor(row.author) ? row.author : 'me',
    content: isString(row.content) ? row.content : '',
    photos: isStringArray(row.photos) ? row.photos : [],
    audio: isString(row.audio) ? row.audio : undefined,
    mood: isString(row.mood) ? row.mood : undefined,
    createdAt: isString(row.created_at) ? row.created_at : new Date().toISOString(),
    reactions: typeof row.reactions === 'object' && row.reactions !== null
      ? (row.reactions as Record<string, string[]>)
      : {},
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

function mapLetter(db: unknown): LoveLetter {
  const row = db as Record<string, unknown>;
  return {
    id: isString(row.id) ? row.id : crypto.randomUUID(),
    author: isAuthor(row.author) ? row.author : 'me',
    imageUrl: isString(row.image_url) ? row.image_url : undefined,
    title: isString(row.title) ? row.title : undefined,
    message: isString(row.message) ? row.message : undefined,
    read: row.read === true,
    createdAt: isString(row.created_at) ? row.created_at : new Date().toISOString(),
  };
}

function mapBucketItem(db: unknown): BucketListItem {
  const row = db as Record<string, unknown>;
  return {
    id: isString(row.id) ? row.id : crypto.randomUUID(),
    title: isString(row.title) ? row.title : '',
    category: isString(row.category) ? row.category : 'other',
    notes: isString(row.notes) ? row.notes : '',
    emoji: isString(row.emoji) ? row.emoji : '✨',
    completed: row.completed === true,
    completedBy: isAuthor(row.completed_by) ? row.completed_by : undefined,
    completedAt: isString(row.completed_at) ? row.completed_at : undefined,
    createdBy: isAuthor(row.created_by) ? row.created_by : 'me',
    createdAt: isString(row.created_at) ? row.created_at : new Date().toISOString(),
  };
}

function mapFootprint(db: unknown): Footprint {
  const row = db as Record<string, unknown>;
  return {
    id: isString(row.id) ? row.id : crypto.randomUUID(),
    name: isString(row.name) ? row.name : '',
    lat: typeof row.lat === 'number' ? row.lat : 0,
    lng: typeof row.lng === 'number' ? row.lng : 0,
    date: isString(row.date) ? row.date : undefined,
    photo: isString(row.photo) ? row.photo : undefined,
    note: isString(row.note) ? row.note : '',
    createdBy: isAuthor(row.created_by) ? row.created_by : 'me',
    createdAt: isString(row.created_at) ? row.created_at : new Date().toISOString(),
  };
}

function mapPetState(db: unknown): PetState {
  const row = db as Record<string, unknown>;
  return {
    petType: row.pet_type === 'cat' || row.pet_type === 'bunny' || row.pet_type === 'bear' || row.pet_type === 'dog'
      ? row.pet_type : 'cat',
    name: isString(row.name) ? row.name : '小可爱',
    happiness: typeof row.happiness === 'number' ? row.happiness : 50,
    lastFedAt: isString(row.last_fed_at) ? row.last_fed_at : new Date().toISOString(),
    lastInteractionAt: isString(row.last_interaction_at) ? row.last_interaction_at : new Date().toISOString(),
  };
}

// ====== Comments ======

export async function fetchComments(postId?: string): Promise<PostComment[]> {
  const sb = getSupabase();
  if (!sb) return [];

  let query = sb
    .from('comments')
    .select('*')
    .order('created_at', { ascending: true });

  if (postId) {
    query = query.eq('post_id', postId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('fetchComments error:', error);
    return [];
  }

  return (data || []).map(mapComment);
}

export async function createComment(
  comment: Omit<PostComment, 'id' | 'createdAt'>
): Promise<PostComment | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from('comments')
    .insert({
      post_id: comment.postId,
      author: comment.author,
      content: comment.content,
    })
    .select()
    .single();

  if (error) {
    console.error('createComment error:', error);
    return null;
  }

  return mapComment(data);
}

export async function deleteComment(commentId: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from('comments').delete().eq('id', commentId);
  return !error;
}

export function subscribeToComments(
  onInsert: (comment: PostComment) => void,
  onDelete: (commentId: string) => void
): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};
  const channel = sb
    .channel('comments-changes')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, (p) => onInsert(mapComment(p.new as any)))
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'comments' }, (p) => onDelete((p.old as any).id))
    .subscribe();
  return () => { channel.unsubscribe(); };
}

function mapComment(db: unknown): PostComment {
  const row = db as Record<string, unknown>;
  return {
    id: isString(row.id) ? row.id : crypto.randomUUID(),
    postId: isString(row.post_id) ? row.post_id : '',
    author: isAuthor(row.author) ? row.author : 'me',
    content: isString(row.content) ? row.content : '',
    createdAt: isString(row.created_at) ? row.created_at : new Date().toISOString(),
  };
}

// ====== Today Moods ======

export async function fetchTodayMoods(): Promise<TodayMood[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from('today_moods')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('fetchTodayMoods error:', error);
    return [];
  }

  return (data || []).map(mapTodayMood);
}

export async function saveTodayMood(
  mood: TodayMood
): Promise<TodayMood | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from('today_moods')
    .upsert(
      { date: mood.date, author: mood.author, mood: mood.mood },
      { onConflict: 'date,author' }
    )
    .select()
    .single();

  if (error) {
    console.error('saveTodayMood error:', error);
    return null;
  }

  return mapTodayMood(data);
}

export async function deleteTodayMood(
  date: string,
  author: 'me' | 'partner'
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb
    .from('today_moods')
    .delete()
    .eq('date', date)
    .eq('author', author);
  return !error;
}

function mapTodayMood(db: unknown): TodayMood {
  const row = db as Record<string, unknown>;
  return {
    date: isString(row.date) ? row.date : new Date().toISOString().split('T')[0],
    author: isAuthor(row.author) ? row.author : 'me',
    mood: isString(row.mood) ? row.mood : '😊',
  };
}

/**
 * Delete ALL data from every table — used by full app reset.
 * Separates UUID-keyed tables from integer-keyed tables. */
export async function clearAllSupabaseData(): Promise<number> {
  const sb = getSupabase();
  if (!sb) return -1;

  const uuidTables = ['posts', 'milestones', 'love_letters', 'bucket_list_items', 'footprints', 'comments', 'today_moods'];
  const intTables = ['pet_state', 'couple_settings'];

  let failures = 0;

  for (const table of uuidTables) {
    try {
      const { error } = await sb.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) failures++;
    } catch { failures++; }
  }

  for (const table of intTables) {
    try {
      const { error } = await sb.from(table).delete().neq('id', -1);
      if (error) failures++;
    } catch { failures++; }
  }

  return failures;
}

// ====== Data Models for UsTime ======

export interface CoupleInfo {
  myName: string;
  partnerName: string;
  startDate: string; // ISO date e.g. "2023-06-15"
  avatarMe?: string; // base64 data URL
  avatarPartner?: string; // base64 data URL
  coupleEmoji?: string; // e.g. "👫"
}

export interface Post {
  id: string; // crypto.randomUUID()
  author: 'me' | 'partner';
  content: string;
  photos: string[]; // base64 data URLs
  audio?: string; // base64 data URL for voice recording
  mood?: string; // emoji e.g. "😊"
  createdAt: string; // ISO datetime
  reactions: Record<string, string[]>; // { "❤️": ["me", "partner"] }
}

export const REACTION_EMOJIS = ['❤️', '😍', '😂', '😢', '😮', '🎉', '👍', '🔥'];

export interface Milestone {
  id: string;
  title: string;
  date: string; // ISO date
  type: 'anniversary' | 'birthday' | 'first-time' | 'custom';
  icon?: string; // emoji
}

export interface AppState {
  coupleInfo: CoupleInfo | null;
  posts: Post[];
  milestones: Milestone[];
  loveLetters: LoveLetter[];
  bucketListItems: BucketListItem[];
  footprints: Footprint[];
  petState: PetState | null;
  theme: 'light' | 'dark' | 'auto';
  setupComplete: boolean;
  todayMoods: TodayMood[];
}

export interface TodayMood {
  date: string; // ISO date
  author: 'me' | 'partner';
  mood: string; // emoji
}

export const MOOD_OPTIONS = [
  { emoji: '😊', label: '开心' },
  { emoji: '🥰', label: '幸福' },
  { emoji: '😌', label: '平静' },
  { emoji: '😢', label: '难过' },
  { emoji: '😤', label: '生气' },
  { emoji: '😴', label: '疲惫' },
  { emoji: '🤩', label: '兴奋' },
  { emoji: '😋', label: '满足' },
];

// ====== 手写信 ======

export interface LoveLetter {
  id: string;
  author: 'me' | 'partner';
  imageUrl?: string;
  title?: string;
  message?: string;
  read: boolean;
  createdAt: string;
}

// ====== 情侣清单 ======

export type BucketCategory = string;

export const BUCKET_CATEGORIES: { key: BucketCategory; label: string; emoji: string }[] = [
  { key: 'travel', label: '旅行', emoji: '✈️' },
  { key: 'food', label: '美食', emoji: '🍽️' },
  { key: 'adventure', label: '冒险', emoji: '🏔️' },
  { key: 'learn', label: '学习', emoji: '📚' },
  { key: 'life', label: '生活', emoji: '🏠' },
  { key: 'other', label: '其他', emoji: '✨' },
];

export interface BucketListItem {
  id: string;
  title: string;
  category: BucketCategory;
  notes: string;
  emoji: string;
  completed: boolean;
  completedBy?: 'me' | 'partner';
  completedAt?: string;
  createdBy: 'me' | 'partner';
  createdAt: string;
}

// ====== 足迹地图 ======

export interface Footprint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  date?: string;
  photo?: string;
  note: string;
  createdBy: 'me' | 'partner';
  createdAt: string;
}

// ====== 虚拟宠物 ======

export type PetType = 'cat' | 'bunny' | 'bear' | 'dog';

export const PET_TYPES: { key: PetType; label: string; emoji: string }[] = [
  { key: 'cat', label: '小猫咪', emoji: '🐱' },
  { key: 'bunny', label: '小兔子', emoji: '🐰' },
  { key: 'bear', label: '小熊', emoji: '🐻' },
  { key: 'dog', label: '小狗', emoji: '🐶' },
];

export interface PetState {
  petType: PetType;
  name: string;
  happiness: number; // 0-100
  lastFedAt: string;
  lastInteractionAt: string;
}

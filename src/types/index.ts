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

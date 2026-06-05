/** Generate a UUID v4, with fallback for browsers without crypto.randomUUID */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for Safari < 15.4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Day key that shifts at 6am instead of midnight.
 *  Used for per-day mood tracking so late-night entries count for the same day. */
export function getDayKey(): string {
  const now = new Date();
  if (now.getHours() < 6) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }
  return now.toISOString().split('T')[0];
}

/** Format an ISO date string to a human-readable relative time (Chinese).
 *  Used by TimelinePost and CommentSection. */
export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    if (hours === 0) {
      const mins = Math.floor(diffMs / (1000 * 60));
      return mins <= 1 ? '刚刚' : `${mins} 分钟前`;
    }
    return `${hours} 小时前`;
  }
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays} 天前`;

  return date.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Runtime type guard — assert a value is a string.
 */
export function isString(v: unknown): v is string {
  return typeof v === 'string';
}

/**
 * Runtime type guard — assert a value is a string array.
 */
export function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((i) => typeof i === 'string');
}

/**
 * Runtime type guard — assert a value is 'me' | 'partner'.
 */
export function isAuthor(v: unknown): v is 'me' | 'partner' {
  return v === 'me' || v === 'partner';
}

/**
 * Hash a string using SHA-256 (Web Crypto API).
 * Returns hex-encoded hash string.
 */
export async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

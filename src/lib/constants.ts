/** App-wide constants — single source of truth for magic numbers */

/** Number of digits in the unlock passcode */
export const PASSCODE_LENGTH = 4;

/** Toast notification auto-dismiss duration (ms) */
export const TOAST_DURATION_MS = 3000;

/** Long-press threshold for edit/delete on mobile (ms) */
export const LONG_PRESS_THRESHOLD_MS = 500;

/** Pet happiness decay per hour when unattended */
export const PET_HAPPINESS_DECAY_PER_HOUR = 1.5;

/** Pet happiness gained from feeding */
export const PET_FEED_HAPPINESS = 15;

/** Pet happiness gained from interaction */
export const PET_INTERACT_HAPPINESS = 5;

/** Max pet happiness value */
export const PET_MAX_HAPPINESS = 100;

/** Photo compression: max width in pixels */
export const PHOTO_MAX_WIDTH_PX = 1200;

/** Photo compression: JPEG quality (0.0–1.0) */
export const PHOTO_JPEG_QUALITY = 0.75;

/** Supabase Storage bucket name for photos */
export const STORAGE_BUCKET_PHOTOS = 'photos';

/** Max number of photos per post */
export const MAX_PHOTOS_PER_POST = 4;

/** localStorage keys (read/written by multiple modules) */
export const LOCAL_KEYS = {
  identity: 'us-time-identity',
  passcode: 'us-time-passcode',
  theme: 'us-time-theme',
  moods: 'us-time-moods',
  remembered: 'us-time-remembered',
  supabaseUrl: 'us-time-supabase-url',
  supabaseKey: 'us-time-supabase-key',
} as const;

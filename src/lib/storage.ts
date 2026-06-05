import { getSupabase } from './supabase';

const BUCKET_NAME = 'photos';

/**
 * Ensure the photos bucket exists. Call once on app init.
 */
export async function ensurePhotosBucket(): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const { data: buckets } = await sb.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET_NAME);
  if (exists) return true;

  const { error } = await sb.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
  });

  return !error;
}

/**
 * Upload a compressed Blob directly to Supabase Storage.
 * Prefer this over base64 uploads — ~33% smaller payload.
 */
export async function uploadPhotoBlob(
  blob: Blob,
  filename?: string
): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const ext = blob.type.split('/')[1] || 'jpg';
  const name = filename || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await sb.storage
    .from(BUCKET_NAME)
    .upload(name, blob, {
      contentType: blob.type,
      upsert: true,
    });

  if (error) {
    console.error('uploadPhotoBlob error:', error);
    return null;
  }

  const { data: urlData } = sb.storage.from(BUCKET_NAME).getPublicUrl(name);
  return urlData.publicUrl;
}

/**
 * Upload a base64 image to Supabase Storage.
 * Returns the public URL, or null on failure.
 */
export async function uploadPhoto(
  base64Data: string,
  filename?: string
): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const mime = base64Data.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
  const ext = mime.split('/')[1] || 'jpg';
  const name = filename || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const base64 = base64Data.split(',')[1] || base64Data;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mime });

  const { error } = await sb.storage
    .from(BUCKET_NAME)
    .upload(name, blob, {
      contentType: mime,
      upsert: true,
    });

  if (error) {
    console.error('uploadPhoto error:', error);
    return null;
  }

  const { data: urlData } = sb.storage.from(BUCKET_NAME).getPublicUrl(name);
  return urlData.publicUrl;
}

/**
 * Delete a photo from storage by URL.
 */
export async function deletePhoto(url: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  let filename: string | undefined;
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    filename = pathParts[pathParts.length - 1];
  } catch {
    const parts = url.split('/');
    filename = parts[parts.length - 1]?.split('?')[0];
  }
  if (!filename) return false;

  const { error } = await sb.storage.from(BUCKET_NAME).remove([filename]);
  return !error;
}

/**
 * Upload multiple base64 photos to Supabase Storage.
 */
export async function uploadPhotos(
  photos: string[],
  prefix: string = ''
): Promise<string[]> {
  const results: string[] = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    if (photo.startsWith('http')) {
      results.push(photo);
      continue;
    }

    const filename = prefix ? `${prefix}-${i}-${Date.now()}.jpg` : undefined;
    const url = await uploadPhoto(photo, filename);
    results.push(url || photo); // fallback to base64
  }

  return results;
}

/**
 * Delete all photos from a post.
 */
export async function deletePostPhotos(photoUrls: string[]): Promise<void> {
  for (const url of photoUrls) {
    if (url.startsWith('http')) {
      await deletePhoto(url);
    }
  }
}

/**
 * Upload a base64 audio to Supabase Storage.
 */
export async function uploadAudio(
  base64Data: string,
  filename?: string
): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const name = filename || `voice-${Date.now()}.webm`;

  const base64 = base64Data.split(',')[1] || base64Data;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'audio/webm' });

  const { error } = await sb.storage
    .from(BUCKET_NAME)
    .upload(name, blob, {
      contentType: 'audio/webm',
      upsert: true,
    });

  if (error) {
    console.error('uploadAudio error:', error);
    return null;
  }

  const { data: urlData } = sb.storage.from(BUCKET_NAME).getPublicUrl(name);
  return urlData.publicUrl;
}

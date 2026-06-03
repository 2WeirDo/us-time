import { getSupabase } from './supabase';

const BUCKET_NAME = 'photos';

/**
 * Ensure the photos bucket exists. Call once on app init.
 */
export async function ensurePhotosBucket(): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  // Check if bucket exists
  const { data: buckets } = await sb.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET_NAME);
  if (exists) return true;

  // Try to create it
  const { error } = await sb.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
  });

  return !error;
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

  // Decode base64 to Blob
  const mime = base64Data.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
  const ext = mime.split('/')[1] || 'jpg';
  const name = filename || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  // Convert base64 to binary
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

  // Get public URL
  const { data: urlData } = sb.storage
    .from(BUCKET_NAME)
    .getPublicUrl(name);

  return urlData.publicUrl;
}

/**
 * Delete a photo from storage by URL.
 */
export async function deletePhoto(url: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  // Extract filename from URL
  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split('/');
  const filename = pathParts[pathParts.length - 1];
  if (!filename) return false;

  const { error } = await sb.storage
    .from(BUCKET_NAME)
    .remove([filename]);

  return !error;
}

/**
 * Upload multiple photos to Supabase Storage.
 * Returns array of URLs (null for failed uploads).
 */
export async function uploadPhotos(
  photos: string[],
  prefix: string = ''
): Promise<string[]> {
  const results: string[] = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    // Skip if already a URL (not base64)
    if (photo.startsWith('http')) {
      results.push(photo);
      continue;
    }

    const filename = prefix
      ? `${prefix}-${i}-${Date.now()}.jpg`
      : undefined;

    const url = await uploadPhoto(photo, filename);
    if (url) {
      results.push(url);
    } else {
      // Fallback: keep base64 if upload fails
      results.push(photo);
    }
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

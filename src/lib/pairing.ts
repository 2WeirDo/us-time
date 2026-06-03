interface PairingData {
  url: string;
  key: string;
}

/**
 * Encode Supabase credentials into a shareable pairing code.
 */
export function generatePairingCode(): string | null {
  const url = localStorage.getItem('supabase-url');
  const key = localStorage.getItem('supabase-anon-key');
  if (!url || !key) return null;
  try {
    return btoa(JSON.stringify({ url, key }));
  } catch {
    return null;
  }
}

/**
 * Decode a pairing code back to Supabase credentials.
 */
export function decodePairingCode(code: string): PairingData | null {
  try {
    const data = JSON.parse(atob(code.trim()));
    if (data.url && data.key) {
      return { url: data.url, key: data.key };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Save pairing credentials to localStorage.
 */
export function savePairingCredentials(url: string, key: string): void {
  localStorage.setItem('supabase-url', url);
  localStorage.setItem('supabase-anon-key', key);
}

/**
 * Generate a simple QR code as an SVG data URL.
 * Uses a canvas-based approach for a basic QR-like pattern.
 * For a real QR code, use a library. This creates a simple visual representation.
 */
export function generatePairingQRCode(code: string): string {
  // Simple visual: encode as a colored grid pattern
  // We'll draw a unique pattern based on the code's hash
  const size = 200;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // White background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);

  // Generate a simple hash to create a deterministic pattern
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = ((hash << 5) - hash) + code.charCodeAt(i);
    hash |= 0;
  }

  // Draw a grid pattern based on the hash
  const gridSize = 10;
  const cellSize = size / gridSize;
  const border = 2; // quiet zone border

  for (let row = border; row < gridSize - border; row++) {
    for (let col = border; col < gridSize - border; col++) {
      // Use bits from the hash to determine cell color
      const bitIndex = (row * gridSize + col) % 32;
      const bit = (Math.abs(hash) >> bitIndex) & 1;
      if (bit) {
        ctx.fillStyle = '#FF69B4';
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }
  }

  // Draw heart in center
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(3 * cellSize, 3 * cellSize, 4 * cellSize, 4 * cellSize);
  ctx.fillStyle = '#FF1493';
  ctx.font = `${cellSize * 2.5}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('💕', size / 2, size / 2);

  return canvas.toDataURL();
}

import QRCode from 'qrcode';

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
 * Generate a real QR code as a data URL using the qrcode library.
 */
export async function generatePairingQRCode(code: string): Promise<string> {
  try {
    return await QRCode.toDataURL(code, {
      width: 200,
      margin: 2,
      color: {
        dark: '#FF69B4',
        light: '#FFFFFF',
      },
    });
  } catch {
    return '';
  }
}

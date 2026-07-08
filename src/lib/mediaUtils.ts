/**
 * Utility functions for processing and normalizing media URLs, 
 * specifically converting cloud storage sharing links (Google Drive, Dropbox) 
 * into direct, HTML5-compatible raw media streams.
 */

export function isGoogleDriveUrl(url: string): boolean {
  if (!url) return false;
  const trimmedUrl = url.trim();
  return trimmedUrl.includes('drive.google.com') || trimmedUrl.includes('docs.google.com');
}

export function getGoogleDriveFileId(url: string): string | null {
  if (!url) return null;
  const trimmedUrl = url.trim();

  // Try /file/d/ format
  if (trimmedUrl.includes('/file/d/')) {
    const parts = trimmedUrl.split('/file/d/');
    if (parts[1]) {
      return parts[1].split('/')[0].split('?')[0];
    }
  }

  // Try id= query parameter
  if (trimmedUrl.includes('id=')) {
    try {
      const match = trimmedUrl.match(/[?&]id=([^&/]+)/);
      if (match && match[1]) {
        return match[1];
      }
    } catch (e) {
      // ignore parsing errors
    }
  }

  return null;
}

export function getGoogleDrivePreviewUrl(url: string): string | null {
  const fileId = getGoogleDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  return null;
}

// Cache Object URLs to avoid generating new ones on every render cycle for the same base64 string
const base64BlobUrlCache = new Map<string, string>();

/**
 * Converts a base64 Data URL (e.g. data:video/mp4;base64,...) into a temporary Object URL (blob:)
 * which is natively and reliably supported by all HTML5 video players (including iOS Safari and mobile Chrome).
 */
export function getSafePlayableVideoUrl(url: string): string {
  if (!url) return '';
  const trimmedUrl = url.trim();

  if (trimmedUrl.startsWith('data:video/')) {
    if (base64BlobUrlCache.has(trimmedUrl)) {
      return base64BlobUrlCache.get(trimmedUrl)!;
    }
    try {
      const parts = trimmedUrl.split(';base64,');
      if (parts.length === 2) {
        const contentType = parts[0].split(':')[1];
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        
        const blob = new Blob([uInt8Array], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        base64BlobUrlCache.set(trimmedUrl, blobUrl);
        return blobUrl;
      }
    } catch (e) {
      console.error('Failed to convert base64 video to Blob URL:', e);
    }
  }

  // Handle standard URL conversions (Dropbox, Google Drive uc link etc)
  return convertCloudStorageUrl(trimmedUrl);
}

export function convertCloudStorageUrl(url: string): string {
  if (!url) return '';
  const trimmedUrl = url.trim();

  // 1. Google Drive Link Conversion
  if (isGoogleDriveUrl(trimmedUrl)) {
    const fileId = getGoogleDriveFileId(trimmedUrl);
    if (fileId) {
      // Return direct stream/download URL (used as fallback or for reference)
      return `https://docs.google.com/uc?export=download&id=${fileId}`;
    }
  }

  // 2. Dropbox Link Conversion
  // Format: https://www.dropbox.com/s/abcdef123456/video.mp4?dl=0
  if (trimmedUrl.includes('dropbox.com')) {
    // Replace dl=0 with raw=1 or dl=1 to get the direct stream
    if (trimmedUrl.includes('dl=0')) {
      return trimmedUrl.replace('dl=0', 'raw=1');
    } else if (!trimmedUrl.includes('dl=1') && !trimmedUrl.includes('raw=1')) {
      const separator = trimmedUrl.includes('?') ? '&' : '?';
      return `${trimmedUrl}${separator}raw=1`;
    }
  }

  return trimmedUrl;
}

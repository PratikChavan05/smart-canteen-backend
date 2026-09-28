/**
 * Resolve menu image URLs so private S3 objects still render via the backend proxy.
 * Also returns null for missing/invalid values so UI can show a neutral placeholder.
 */
export function resolveMenuImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return null;

  const url = imageUrl.trim();
  if (!url || url === '[object Object]') return null;

  // Already an app media / local path
  if (url.startsWith('/api/storage/media/') || url.startsWith('/uploads/')) {
    return url;
  }

  // Legacy direct S3 URL → proxy through backend (works with private buckets)
  const s3Marker = '.amazonaws.com/';
  const s3Idx = url.indexOf(s3Marker);
  if (s3Idx !== -1) {
    const key = url.substring(s3Idx + s3Marker.length).split('?')[0];
    if (key) return `/api/storage/media/${key}`;
  }

  // External http(s) URL (e.g. pasted Unsplash) — use as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Bare storage key
  return `/api/storage/media/${url.replace(/^\/+/, '')}`;
}

/** Neutral SVG placeholder (not a fake food photo). */
export const MENU_IMAGE_PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect fill="#e8eef1" width="400" height="300"/>
      <rect x="150" y="95" width="100" height="80" rx="12" fill="#c5d4d3"/>
      <circle cx="200" cy="120" r="18" fill="#0f6e6a" opacity="0.35"/>
      <text x="200" y="220" text-anchor="middle" fill="#5a6a78" font-family="system-ui,sans-serif" font-size="14">No image</text>
    </svg>`
  );

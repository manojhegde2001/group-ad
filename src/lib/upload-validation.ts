const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
  'video/3gpp',
]);

export function isAllowedImageType(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.has(mimeType);
}

export function isAllowedVideoType(mimeType: string): boolean {
  return ALLOWED_VIDEO_TYPES.has(mimeType);
}

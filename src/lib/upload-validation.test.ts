import { describe, it, expect } from 'vitest';
import { isAllowedImageType, isAllowedVideoType } from './upload-validation';

describe('isAllowedImageType', () => {
  it('allows common raster/animated image types', () => {
    expect(isAllowedImageType('image/jpeg')).toBe(true);
    expect(isAllowedImageType('image/png')).toBe(true);
    expect(isAllowedImageType('image/webp')).toBe(true);
    expect(isAllowedImageType('image/gif')).toBe(true);
  });

  it('rejects SVG (stored-XSS risk) and non-image types', () => {
    expect(isAllowedImageType('image/svg+xml')).toBe(false);
    expect(isAllowedImageType('text/html')).toBe(false);
    expect(isAllowedImageType('application/javascript')).toBe(false);
    expect(isAllowedImageType('')).toBe(false);
  });
});

describe('isAllowedVideoType', () => {
  it('allows common video container types', () => {
    expect(isAllowedVideoType('video/mp4')).toBe(true);
    expect(isAllowedVideoType('video/quicktime')).toBe(true);
    expect(isAllowedVideoType('video/webm')).toBe(true);
  });

  it('rejects non-video types', () => {
    expect(isAllowedVideoType('image/png')).toBe(false);
    expect(isAllowedVideoType('application/octet-stream')).toBe(false);
  });
});

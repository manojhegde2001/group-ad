import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/s3', () => ({
  isS3Configured: vi.fn(() => true),
  getMissingS3Config: vi.fn(() => []),
  uploadToS3: vi.fn(() => Promise.resolve('https://cdn.example.com/file.jpg')),
}));
vi.mock('@/lib/media-optimize', () => ({
  optimizeImage: vi.fn(() => Promise.resolve({ buffer: Buffer.from('img'), contentType: 'image/webp', extension: 'webp', width: 800, height: 600 })),
  optimizeVideo: vi.fn(() => Promise.resolve({ buffer: Buffer.from('vid'), contentType: 'video/mp4', extension: 'mp4' })),
}));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => ({ success: true, resetAt: 0 })),
  rateLimitResponse: vi.fn(() => NextResponse.json({ error: 'Too many requests' }, { status: 429 })),
}));

import { POST } from './route';
import { auth } from '@/lib/auth';
import { isS3Configured, uploadToS3 } from '@/lib/s3';
import { rateLimit } from '@/lib/rate-limit';

const reqWithFile = (file: File | null, resourceType?: string) => {
  const formData = new FormData();
  if (file) formData.set('file', file);
  if (resourceType) formData.set('resource_type', resourceType);
  return { formData: () => Promise.resolve(formData) } as any;
};

beforeEach(() => {
  vi.clearAllMocks();
  (isS3Configured as any).mockReturnValue(true);
  (rateLimit as any).mockReturnValue({ success: true, resetAt: 0 });
});

describe('POST /api/upload', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(reqWithFile(null));
    expect(res.status).toBe(401);
  });

  it('429 when rate-limited', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (rateLimit as any).mockReturnValue({ success: false, resetAt: Date.now() + 1000 });
    const res = await POST(reqWithFile(null));
    expect(res.status).toBe(429);
  });

  it('400 when no file is provided', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    const res = await POST(reqWithFile(null));
    expect(res.status).toBe(400);
  });

  it('400 for an unsupported image type', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    const file = new File(['data'], 'x.svg', { type: 'image/svg+xml' });
    const res = await POST(reqWithFile(file));
    expect(res.status).toBe(400);
  });

  it('200 uploads an image and returns dimensions', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    const file = new File(['data'], 'x.jpg', { type: 'image/jpeg' });
    const res = await POST(reqWithFile(file));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.resourceType).toBe('image');
    expect(json.width).toBe(800);
    expect(uploadToS3).toHaveBeenCalled();
  });

  it('200 uploads a video when resource_type=video', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    const file = new File(['data'], 'x.mp4', { type: 'video/mp4' });
    const res = await POST(reqWithFile(file, 'video'));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.resourceType).toBe('video');
  });

  it('400 when the video exceeds the 100MB cap', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    const big = new Uint8Array(100 * 1024 * 1024 + 1);
    const file = new File([big], 'x.mp4', { type: 'video/mp4' });
    const res = await POST(reqWithFile(file, 'video'));
    expect(res.status).toBe(400);
  });
});

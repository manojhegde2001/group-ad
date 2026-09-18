import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/s3', () => ({
  isS3Configured: vi.fn(() => true),
  getMissingS3Config: vi.fn(() => []),
  uploadToS3: vi.fn(() => Promise.resolve('https://cdn.example.com/banner.jpg')),
}));
vi.mock('@/lib/media-optimize', () => ({
  optimizeImage: vi.fn(() => Promise.resolve({ buffer: Buffer.from('optimized'), contentType: 'image/webp', extension: 'webp' })),
}));

import { POST } from './route';
import { auth } from '@/lib/auth';
import { isS3Configured, getMissingS3Config, uploadToS3 } from '@/lib/s3';

const reqWithFile = (file: File | null) => {
  const formData = new FormData();
  if (file) formData.set('image', file);
  return { formData: () => Promise.resolve(formData) } as any;
};

beforeEach(() => {
  vi.clearAllMocks();
  (isS3Configured as any).mockReturnValue(true);
});

describe('POST /api/admin/categories/upload-banner', () => {
  it('403 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(reqWithFile(null));
    expect(res.status).toBe(403);
  });

  it('403 for a non-ADMIN user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', userType: 'BUSINESS' } });
    const res = await POST(reqWithFile(null));
    expect(res.status).toBe(403);
  });

  it('500 when S3 is not configured', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (isS3Configured as any).mockReturnValue(false);
    (getMissingS3Config as any).mockReturnValue(['S3_BUCKET']);
    const res = await POST(reqWithFile(null));
    expect(res.status).toBe(500);
  });

  it('400 when no file is uploaded', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    const res = await POST(reqWithFile(null));
    expect(res.status).toBe(400);
  });

  it('400 for an unsupported file type', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    const file = new File(['data'], 'banner.svg', { type: 'image/svg+xml' });
    const res = await POST(reqWithFile(file));
    expect(res.status).toBe(400);
  });

  it('400 when the file exceeds 5MB', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    const big = new Uint8Array(5 * 1024 * 1024 + 1);
    const file = new File([big], 'banner.jpg', { type: 'image/jpeg' });
    const res = await POST(reqWithFile(file));
    expect(res.status).toBe(400);
  });

  it('200 uploads and returns the optimized banner URL', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    const file = new File(['data'], 'banner.jpg', { type: 'image/jpeg' });
    const res = await POST(reqWithFile(file));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.bannerUrl).toBe('https://cdn.example.com/banner.jpg');
    expect(uploadToS3).toHaveBeenCalled();
  });
});

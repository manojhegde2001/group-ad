import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { update: vi.fn() },
  },
}));
vi.mock('@/lib/s3', () => ({
  isS3Configured: vi.fn(() => true),
  getMissingS3Config: vi.fn(() => []),
  uploadToS3: vi.fn(() => Promise.resolve('https://cdn.example.com/avatar.jpg')),
}));
vi.mock('@/lib/media-optimize', () => ({
  optimizeImage: vi.fn(() => Promise.resolve({ buffer: Buffer.from('optimized'), contentType: 'image/webp', extension: 'webp' })),
}));
vi.mock('@/lib/rate-limit', () => ({ enforceRateLimit: vi.fn(() => null) }));

import { POST } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isS3Configured } from '@/lib/s3';
import { enforceRateLimit } from '@/lib/rate-limit';

const reqWithFile = (file: File | null) => {
  const formData = new FormData();
  if (file) formData.set('image', file);
  return { formData: () => Promise.resolve(formData) } as any;
};

beforeEach(() => {
  vi.clearAllMocks();
  (isS3Configured as any).mockReturnValue(true);
  (enforceRateLimit as any).mockReturnValue(null);
});

describe('POST /api/user/upload-avatar', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(reqWithFile(null));
    expect(res.status).toBe(401);
  });

  it('429 when rate-limited, before touching S3', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (enforceRateLimit as any).mockReturnValue(new Response(null, { status: 429 }));
    const res = await POST(reqWithFile(null));
    expect(res.status).toBe(429);
    expect(isS3Configured).not.toHaveBeenCalled();
  });

  it('400 when no file is uploaded', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    const res = await POST(reqWithFile(null));
    expect(res.status).toBe(400);
  });

  it('400 for an unsupported file type', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    const file = new File(['data'], 'avatar.svg', { type: 'image/svg+xml' });
    const res = await POST(reqWithFile(file));
    expect(res.status).toBe(400);
  });

  it('200 uploads, cache-busts the URL, and updates the user avatar', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    const file = new File(['data'], 'avatar.jpg', { type: 'image/jpeg' });
    (prisma.user.update as any).mockResolvedValue({ id: 'u1', avatar: 'https://cdn.example.com/avatar.jpg' });
    const res = await POST(reqWithFile(file));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.avatar).toMatch(/^https:\/\/cdn\.example\.com\/avatar\.jpg\?v=\d+$/);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1' }, data: expect.objectContaining({ onboardingStep: 'PROFILE_PICTURE_UPLOADED' }) }),
    );
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findFirst: vi.fn(), update: vi.fn() },
  },
}));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => ({ success: true, resetAt: 0 })),
  getClientIp: vi.fn(() => '127.0.0.1'),
  rateLimitResponse: vi.fn(() => NextResponse.json({ error: 'Too many requests' }, { status: 429 })),
}));

import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

const req = (body: unknown) =>
  new Request('http://localhost/api/auth/reset-password', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  (rateLimit as any).mockReturnValue({ success: true, resetAt: 0 });
});

describe('POST /api/auth/reset-password', () => {
  it('429 when rate-limited, before touching the DB', async () => {
    (rateLimit as any).mockReturnValue({ success: false, resetAt: Date.now() + 1000 });
    const res = await POST(req({ token: 't1', password: 'Str0ng!Pass' }) as any);
    expect(res.status).toBe(429);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it('400 for an invalid payload', async () => {
    const res = await POST(req({ token: '', password: 'Str0ng!Pass' }) as any);
    expect(res.status).toBe(400);
  });

  it('400 for an invalid or expired token', async () => {
    (prisma.user.findFirst as any).mockResolvedValue(null);
    const res = await POST(req({ token: 'bad-token', password: 'Str0ng!Pass' }) as any);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe('Invalid or expired token');
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('200 resets the password and clears the token', async () => {
    (prisma.user.findFirst as any).mockResolvedValue({ id: 'u1' });
    const res = await POST(req({ token: 'good-token', password: 'Str0ng!Pass' }) as any);
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: expect.objectContaining({ resetToken: null, resetTokenExpiry: null }),
      }),
    );
  });
});

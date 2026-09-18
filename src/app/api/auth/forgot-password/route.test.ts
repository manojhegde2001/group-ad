import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
  },
}));
vi.mock('@/lib/mailer', () => ({
  sendMail: vi.fn(),
  passwordResetEmail: vi.fn(() => '<html></html>'),
  getAppBaseUrl: vi.fn(() => 'http://localhost:3000'),
}));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => ({ success: true, resetAt: 0 })),
  getClientIp: vi.fn(() => '127.0.0.1'),
  rateLimitResponse: vi.fn(() => NextResponse.json({ error: 'Too many requests' }, { status: 429 })),
}));

import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/mailer';
import { rateLimit } from '@/lib/rate-limit';

const req = (body: unknown) =>
  new Request('http://localhost/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  (rateLimit as any).mockReturnValue({ success: true, resetAt: 0 });
});

describe('POST /api/auth/forgot-password', () => {
  it('429 when rate-limited, before touching the DB', async () => {
    (rateLimit as any).mockReturnValue({ success: false, resetAt: Date.now() + 1000 });
    const res = await POST(req({ email: 'jane@example.com' }) as any);
    expect(res.status).toBe(429);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('400 for an invalid email', async () => {
    const res = await POST(req({ email: 'not-an-email' }) as any);
    expect(res.status).toBe(400);
  });

  it('returns a generic message without sending mail when no user exists (no account enumeration)', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    const res = await POST(req({ email: 'nobody@example.com' }) as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.message).toMatch(/if an account exists/i);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('sets a reset token and sends an email for an existing user', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', name: 'Jane', email: 'jane@example.com' });
    const res = await POST(req({ email: 'jane@example.com' }) as any);
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: expect.objectContaining({ resetToken: expect.any(String), resetTokenExpiry: expect.any(Date) }),
      }),
    );
    expect(sendMail).toHaveBeenCalled();
  });

  it('500 when the reset email fails to send', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', name: 'Jane', email: 'jane@example.com' });
    (sendMail as any).mockRejectedValue(new Error('smtp down'));
    const res = await POST(req({ email: 'jane@example.com' }) as any);
    expect(res.status).toBe(500);
  });
});

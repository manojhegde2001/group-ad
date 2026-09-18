import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
  },
}));
vi.mock('@/lib/mailer', () => ({
  sendMail: vi.fn(),
  verificationEmail: vi.fn(() => '<html></html>'),
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
  new Request('http://localhost/api/auth/resend-verification', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

const GENERIC_MESSAGE = 'If that account exists and still needs verification, a new link has been sent.';

beforeEach(() => {
  vi.clearAllMocks();
  (rateLimit as any).mockReturnValue({ success: true, resetAt: 0 });
});

describe('POST /api/auth/resend-verification', () => {
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

  it('returns the generic message without sending mail when no user exists', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    const res = await POST(req({ email: 'nobody@example.com' }) as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.message).toBe(GENERIC_MESSAGE);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('returns the generic message without sending mail when the account is already verified', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'u1',
      emailVerified: new Date(),
      emailVerificationToken: null,
    });
    const res = await POST(req({ email: 'jane@example.com' }) as any);
    const json = await res.json();
    expect(json.message).toBe(GENERIC_MESSAGE);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('returns the generic message without sending mail for a legacy account with no pending token', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'u1',
      emailVerified: null,
      emailVerificationToken: null,
    });
    const res = await POST(req({ email: 'jane@example.com' }) as any);
    const json = await res.json();
    expect(json.message).toBe(GENERIC_MESSAGE);
    expect(sendMail).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('issues a fresh token and sends mail for a genuine unverified signup', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'u1',
      email: 'jane@example.com',
      name: 'Jane',
      username: 'jane1',
      emailVerified: null,
      emailVerificationToken: 'old-token',
    });
    const res = await POST(req({ email: 'jane@example.com' }) as any);
    const json = await res.json();
    expect(json.message).toBe(GENERIC_MESSAGE);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: expect.objectContaining({ emailVerificationToken: expect.any(String) }),
      }),
    );
    expect(sendMail).toHaveBeenCalled();
  });

  it('still returns the generic message when the resend email fails', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'u1',
      email: 'jane@example.com',
      name: 'Jane',
      username: 'jane1',
      emailVerified: null,
      emailVerificationToken: 'old-token',
    });
    (sendMail as any).mockRejectedValue(new Error('smtp down'));
    const res = await POST(req({ email: 'jane@example.com' }) as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.message).toBe(GENERIC_MESSAGE);
  });
});

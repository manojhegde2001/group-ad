import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findFirst: vi.fn(), update: vi.fn() },
  },
}));
vi.mock('@/lib/mailer', () => ({
  sendMail: vi.fn(),
  welcomeEmail: vi.fn(() => '<html></html>'),
  getAppBaseUrl: vi.fn(() => 'http://localhost:3000'),
}));

import { GET } from './route';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/mailer';

const req = (token?: string) =>
  new NextRequest(
    `http://localhost:3000/api/auth/verify-email${token ? `?token=${token}` : ''}`,
  );

const statusOf = (res: Response) => new URL(res.headers.get('location')!).searchParams.get('verified');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/auth/verify-email', () => {
  it('redirects with verified=invalid when no token is given', async () => {
    const res = await GET(req() as any);
    expect(statusOf(res)).toBe('invalid');
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it('redirects with verified=invalid when the token matches no user', async () => {
    (prisma.user.findFirst as any).mockResolvedValue(null);
    const res = await GET(req('bad-token') as any);
    expect(statusOf(res)).toBe('invalid');
  });

  it('redirects with verified=already when the account is already verified', async () => {
    (prisma.user.findFirst as any).mockResolvedValue({ id: 'u1', emailVerified: new Date() });
    const res = await GET(req('tok') as any);
    expect(statusOf(res)).toBe('already');
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('redirects with verified=expired when the token has expired', async () => {
    (prisma.user.findFirst as any).mockResolvedValue({
      id: 'u1',
      emailVerified: null,
      emailVerificationExpiry: new Date(Date.now() - 1000),
    });
    const res = await GET(req('tok') as any);
    expect(statusOf(res)).toBe('expired');
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('redirects with verified=success, marks verified, and sends the welcome email', async () => {
    (prisma.user.findFirst as any).mockResolvedValue({
      id: 'u1',
      email: 'jane@example.com',
      name: 'Jane',
      username: 'jane1',
      emailVerified: null,
      emailVerificationExpiry: new Date(Date.now() + 1000),
    });
    const res = await GET(req('tok') as any);
    expect(statusOf(res)).toBe('success');
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: expect.objectContaining({ emailVerificationToken: null, emailVerificationExpiry: null }),
      }),
    );
    expect(sendMail).toHaveBeenCalled();
  });

  it('still redirects with verified=success when the welcome email fails', async () => {
    (prisma.user.findFirst as any).mockResolvedValue({
      id: 'u1',
      email: 'jane@example.com',
      name: 'Jane',
      username: 'jane1',
      emailVerified: null,
      emailVerificationExpiry: new Date(Date.now() + 1000),
    });
    (sendMail as any).mockRejectedValue(new Error('smtp down'));
    const res = await GET(req('tok') as any);
    expect(statusOf(res)).toBe('success');
  });

  it('redirects with verified=error when a DB error is thrown', async () => {
    (prisma.user.findFirst as any).mockRejectedValue(new Error('db down'));
    const res = await GET(req('tok') as any);
    expect(statusOf(res)).toBe('error');
  });
});

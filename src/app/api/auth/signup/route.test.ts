import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findFirst: vi.fn(), create: vi.fn() },
    company: { findUnique: vi.fn() },
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
  rateLimitResponse: vi.fn((resetAt: number) => NextResponse.json({ error: 'Too many requests' }, { status: 429 })),
}));

import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/mailer';
import { rateLimit } from '@/lib/rate-limit';

const validBody = {
  name: 'Jane Doe',
  username: 'jane_doe1',
  email: 'jane@example.com',
  password: 'Str0ng!Pass',
};

const req = (body: unknown) =>
  new Request('http://localhost/api/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  (rateLimit as any).mockReturnValue({ success: true, resetAt: 0 });
  (prisma.user.findFirst as any).mockResolvedValue(null);
});

describe('POST /api/auth/signup', () => {
  it('429 when rate-limited, before touching the DB', async () => {
    (rateLimit as any).mockReturnValue({ success: false, resetAt: Date.now() + 1000 });
    const res = await POST(req(validBody) as any);
    expect(res.status).toBe(429);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it('400 for invalid input (fails schema validation)', async () => {
    const res = await POST(req({ ...validBody, email: 'not-an-email' }) as any);
    expect(res.status).toBe(400);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it('400 when the email is already registered', async () => {
    (prisma.user.findFirst as any).mockResolvedValue({ email: validBody.email, username: 'someone-else' });
    const res = await POST(req(validBody) as any);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe('Email already registered');
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('400 when the username is already taken', async () => {
    (prisma.user.findFirst as any).mockResolvedValue({ email: 'other@example.com', username: validBody.username });
    const res = await POST(req(validBody) as any);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe('Username already taken');
  });

  it('400 when the selected company does not exist', async () => {
    (prisma.company.findUnique as any).mockResolvedValue(null);
    const res = await POST(req({ ...validBody, companyId: 'c1' }) as any);
    expect(res.status).toBe(400);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('201 creates the user as INDIVIDUAL and sends a verification email', async () => {
    (prisma.user.create as any).mockResolvedValue({
      id: 'u1',
      email: validBody.email,
      name: validBody.name,
      username: validBody.username,
      userType: 'INDIVIDUAL',
      company: null,
    });
    const res = await POST(req(validBody) as any);
    expect(res.status).toBe(201);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userType: 'INDIVIDUAL' }) }),
    );
    expect(sendMail).toHaveBeenCalled();
  });

  it('201 even when the verification email fails to send', async () => {
    (prisma.user.create as any).mockResolvedValue({
      id: 'u1',
      email: validBody.email,
      name: validBody.name,
      username: validBody.username,
      userType: 'INDIVIDUAL',
      company: null,
    });
    (sendMail as any).mockRejectedValue(new Error('smtp down'));
    const res = await POST(req(validBody) as any);
    expect(res.status).toBe(201);
  });
});

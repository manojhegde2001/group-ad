import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), findMany: vi.fn() },
    meeting: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
  },
}));
vi.mock('@/services/notification-service', () => ({ notificationService: { create: vi.fn() } }));
vi.mock('@/lib/mailer', () => ({
  sendMail: vi.fn(() => Promise.resolve()),
  meetingInviteEmail: vi.fn(() => '<html></html>'),
  getAppBaseUrl: vi.fn(() => 'http://localhost:3000'),
}));
vi.mock('@/lib/rate-limit', () => ({ enforceRateLimit: vi.fn(() => null) }));

import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enforceRateLimit } from '@/lib/rate-limit';

const getReq = () => new NextRequest('http://localhost/api/meetings');
const validBody = {
  receiverId: 'receiver1',
  proposedTime: new Date(Date.now() + 86_400_000).toISOString(),
};
const postReq = (body: unknown) =>
  new Request('http://localhost/api/meetings', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  (enforceRateLimit as any).mockReturnValue(null);
  (prisma.meeting.findMany as any).mockResolvedValue([]);
  (prisma.user.findMany as any).mockResolvedValue([]);
});

describe('GET /api/meetings', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET(getReq() as any);
    expect(res.status).toBe(401);
  });

  it('403 for a non-BUSINESS, non-ADMIN user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ userType: 'INDIVIDUAL' });
    const res = await GET(getReq() as any);
    expect(res.status).toBe(403);
  });

  it('scopes results to the current user for a BUSINESS account', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ userType: 'BUSINESS' });
    await GET(getReq() as any);
    expect(prisma.meeting.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { OR: [{ requesterId: 'u1' }, { receiverId: 'u1' }] } }),
    );
  });

  it('lets an ADMIN see all meetings', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ userType: 'ADMIN' });
    await GET(getReq() as any);
    expect(prisma.meeting.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });
});

describe('POST /api/meetings', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(postReq(validBody) as any);
    expect(res.status).toBe(401);
  });

  it('429 when rate-limited', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (enforceRateLimit as any).mockReturnValue(new Response(null, { status: 429 }));
    const res = await POST(postReq(validBody) as any);
    expect(res.status).toBe(429);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('403 when the requester is not a BUSINESS account', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ userType: 'INDIVIDUAL', name: 'U1' });
    const res = await POST(postReq(validBody) as any);
    expect(res.status).toBe(403);
  });

  it('400 when requesting a meeting with self', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ userType: 'BUSINESS', name: 'U1' });
    const res = await POST(postReq({ ...validBody, receiverId: 'u1' }) as any);
    expect(res.status).toBe(400);
  });

  it('400 when the proposed time is in the past', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ userType: 'BUSINESS', name: 'U1' });
    const res = await POST(
      postReq({ ...validBody, proposedTime: new Date(Date.now() - 1000).toISOString() }) as any,
    );
    expect(res.status).toBe(400);
  });

  it('404 when the receiver does not exist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValueOnce({ userType: 'BUSINESS', name: 'U1' }).mockResolvedValueOnce(null);
    const res = await POST(postReq(validBody) as any);
    expect(res.status).toBe(404);
  });

  it('400 when the receiver is not a BUSINESS account', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any)
      .mockResolvedValueOnce({ userType: 'BUSINESS', name: 'U1' })
      .mockResolvedValueOnce({ id: 'receiver1', userType: 'INDIVIDUAL' });
    const res = await POST(postReq(validBody) as any);
    expect(res.status).toBe(400);
  });

  it('409 when a pending meeting already exists between the two users', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any)
      .mockResolvedValueOnce({ userType: 'BUSINESS', name: 'U1' })
      .mockResolvedValueOnce({ id: 'receiver1', userType: 'BUSINESS' });
    (prisma.meeting.findFirst as any).mockResolvedValue({ id: 'existing' });
    const res = await POST(postReq(validBody) as any);
    expect(res.status).toBe(409);
    expect(prisma.meeting.create).not.toHaveBeenCalled();
  });

  it('201 creates the meeting request and notifies the receiver', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any)
      .mockResolvedValueOnce({ userType: 'BUSINESS', name: 'U1' })
      .mockResolvedValueOnce({ id: 'receiver1', userType: 'BUSINESS' })
      .mockResolvedValueOnce({ email: 'receiver@example.com' });
    (prisma.meeting.findFirst as any).mockResolvedValue(null);
    (prisma.meeting.create as any).mockResolvedValue({ id: 'm1' });
    const res = await POST(postReq(validBody) as any);
    expect(res.status).toBe(201);
    expect(prisma.meeting.create).toHaveBeenCalled();
  });
});

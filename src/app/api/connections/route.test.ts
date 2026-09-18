import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    connection: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), delete: vi.fn() },
    user: { findUnique: vi.fn() },
    notification: { create: vi.fn() },
  },
}));
vi.mock('@/lib/socket-service', () => ({ socketService: { notifyUser: vi.fn() } }));
vi.mock('@/lib/rate-limit', () => ({ enforceRateLimit: vi.fn(() => null) }));

import { GET, POST } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enforceRateLimit } from '@/lib/rate-limit';

const getReq = () => new Request('http://localhost/api/connections');
const postReq = (body: unknown) =>
  new Request('http://localhost/api/connections', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  (enforceRateLimit as any).mockReturnValue(null);
});

describe('GET /api/connections', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET(getReq() as any);
    expect(res.status).toBe(401);
  });

  it('200 lists accepted connections for the current user by default', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.connection.findMany as any).mockResolvedValue([
      { id: 'c1', requesterId: 'u1', receiverId: 'u2' },
    ]);
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u2', name: 'U2' });
    const res = await GET(getReq() as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(prisma.connection.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'ACCEPTED' }) }),
    );
    expect(json.connections[0].direction).toBe('sent');
  });
});

describe('POST /api/connections', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(postReq({ receiverId: 'u2' }) as any);
    expect(res.status).toBe(401);
  });

  it('429 when rate-limited, before touching the DB', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (enforceRateLimit as any).mockReturnValue(new Response(null, { status: 429 }));
    const res = await POST(postReq({ receiverId: 'u2' }) as any);
    expect(res.status).toBe(429);
    expect(prisma.connection.findFirst).not.toHaveBeenCalled();
  });

  it('400 when connecting with self', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    const res = await POST(postReq({ receiverId: 'u1' }) as any);
    expect(res.status).toBe(400);
  });

  it('409 when a non-rejected connection already exists', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.connection.findFirst as any).mockResolvedValue({ id: 'c1', status: 'PENDING' });
    const res = await POST(postReq({ receiverId: 'u2' }) as any);
    expect(res.status).toBe(409);
    expect(prisma.connection.create).not.toHaveBeenCalled();
  });

  it('allows re-requesting after a prior rejection by deleting the old record', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.connection.findFirst as any).mockResolvedValue({ id: 'old', status: 'REJECTED' });
    (prisma.connection.create as any).mockResolvedValue({ id: 'c2', status: 'PENDING' });
    (prisma.notification.create as any).mockResolvedValue({ id: 'n1', message: 'hi' });
    const res = await POST(postReq({ receiverId: 'u2' }) as any);
    expect(res.status).toBe(201);
    expect(prisma.connection.delete).toHaveBeenCalledWith({ where: { id: 'old' } });
  });

  it('201 creates a PENDING connection request', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', name: 'U One' } });
    (prisma.connection.findFirst as any).mockResolvedValue(null);
    (prisma.connection.create as any).mockResolvedValue({ id: 'c1', status: 'PENDING' });
    (prisma.notification.create as any).mockResolvedValue({ id: 'n1', message: 'hi' });
    const res = await POST(postReq({ receiverId: 'u2' }) as any);
    expect(res.status).toBe(201);
    expect(prisma.connection.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING' }) }),
    );
  });
});

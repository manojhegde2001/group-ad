import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    userTypeChangeRequest: { findFirst: vi.fn(), create: vi.fn(), findMany: vi.fn() },
  },
}));
vi.mock('@/lib/rate-limit', () => ({ enforceRateLimit: vi.fn(() => null) }));

import { POST, GET } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enforceRateLimit } from '@/lib/rate-limit';

const req = (body: unknown) =>
  new Request('http://localhost/api/user/upgrade-to-business', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  (enforceRateLimit as any).mockReturnValue(null);
});

describe('POST /api/user/upgrade-to-business', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(req({ companyId: 'c1' }) as any);
    expect(res.status).toBe(401);
  });

  it('429 when rate-limited, before touching the DB', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (enforceRateLimit as any).mockReturnValue(new Response(null, { status: 429 }));
    const res = await POST(req({ companyId: 'c1' }) as any);
    expect(res.status).toBe(429);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('404 when the user record is missing', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue(null);
    const res = await POST(req({ companyId: 'c1' }) as any);
    expect(res.status).toBe(404);
  });

  it('400 when already a BUSINESS user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', userType: 'BUSINESS' });
    const res = await POST(req({ companyId: 'c1' }) as any);
    expect(res.status).toBe(400);
  });

  it('400 for an ADMIN user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', userType: 'ADMIN' });
    const res = await POST(req({ companyId: 'c1' }) as any);
    expect(res.status).toBe(400);
  });

  it('400 when a pending request already exists', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', userType: 'INDIVIDUAL' });
    (prisma.userTypeChangeRequest.findFirst as any).mockResolvedValue({ id: 'req1', status: 'PENDING' });
    const res = await POST(req({ companyId: 'c1' }) as any);
    expect(res.status).toBe(400);
    expect(prisma.userTypeChangeRequest.create).not.toHaveBeenCalled();
  });

  it('400 when neither companyId nor companyName is provided (invalid schema)', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', userType: 'INDIVIDUAL' });
    (prisma.userTypeChangeRequest.findFirst as any).mockResolvedValue(null);
    const res = await POST(req({ companyWebsite: 'not-a-url' }) as any);
    expect(res.status).toBe(400);
  });

  it('200 creates a PENDING upgrade request for a valid INDIVIDUAL user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', userType: 'INDIVIDUAL' });
    (prisma.userTypeChangeRequest.findFirst as any).mockResolvedValue(null);
    (prisma.userTypeChangeRequest.create as any).mockResolvedValue({
      id: 'req1',
      status: 'PENDING',
      createdAt: new Date(),
    });
    const res = await POST(req({ companyId: 'c1' }) as any);
    expect(res.status).toBe(200);
    expect(prisma.userTypeChangeRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ toType: 'BUSINESS', status: 'PENDING' }) }),
    );
  });
});

describe('GET /api/user/upgrade-to-business', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("200 lists the user's own upgrade requests", async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.userTypeChangeRequest.findMany as any).mockResolvedValue([{ id: 'req1' }]);
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.count).toBe(1);
    expect(prisma.userTypeChangeRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' } }),
    );
  });
});

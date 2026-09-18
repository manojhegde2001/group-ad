import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    userTypeChangeRequest: { findFirst: vi.fn(), create: vi.fn() },
  },
}));
vi.mock('@/lib/rate-limit', () => ({ enforceRateLimit: vi.fn(() => null) }));

import { POST, GET } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enforceRateLimit } from '@/lib/rate-limit';

const validBody = { companyName: 'Acme Inc', categoryId: 'cat1' };

const req = (body: unknown) =>
  new Request('http://localhost/api/user/type-change/request', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  (enforceRateLimit as any).mockReturnValue(null);
});

describe('POST /api/user/type-change/request', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(req(validBody) as any);
    expect(res.status).toBe(401);
  });

  it('429 when rate-limited, before touching the DB', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (enforceRateLimit as any).mockReturnValue(new Response(null, { status: 429 }));
    const res = await POST(req(validBody) as any);
    expect(res.status).toBe(429);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('400 when companyName or categoryId is missing', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    const res = await POST(req({ companyName: 'Acme Inc' }) as any);
    expect(res.status).toBe(400);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('404 when the user record is missing', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue(null);
    const res = await POST(req(validBody) as any);
    expect(res.status).toBe(404);
  });

  it('400 when already a BUSINESS account', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ userType: 'BUSINESS' });
    const res = await POST(req(validBody) as any);
    expect(res.status).toBe(400);
  });

  it('400 for an ADMIN account', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ userType: 'ADMIN' });
    const res = await POST(req(validBody) as any);
    expect(res.status).toBe(400);
  });

  it('400 when a pending request already exists', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ userType: 'INDIVIDUAL' });
    (prisma.userTypeChangeRequest.findFirst as any).mockResolvedValue({ id: 'req1' });
    const res = await POST(req(validBody) as any);
    expect(res.status).toBe(400);
    expect(prisma.userTypeChangeRequest.create).not.toHaveBeenCalled();
  });

  it('200 creates a PENDING request and does not change the userType', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ userType: 'INDIVIDUAL' });
    (prisma.userTypeChangeRequest.findFirst as any).mockResolvedValue(null);
    (prisma.userTypeChangeRequest.create as any).mockResolvedValue({ id: 'req1', status: 'PENDING' });
    const res = await POST(req(validBody) as any);
    expect(res.status).toBe(200);
    expect(prisma.userTypeChangeRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ toType: 'BUSINESS', status: 'PENDING', fromType: 'INDIVIDUAL' }),
      }),
    );
    expect(prisma.user.findUnique).not.toHaveBeenCalledWith(expect.objectContaining({ data: expect.anything() }));
  });

  it('500 when an unexpected error is thrown', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockRejectedValue(new Error('db down'));
    const res = await POST(req(validBody) as any);
    expect(res.status).toBe(500);
  });
});

describe('GET /api/user/type-change/request', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET(new Request('http://localhost/api/user/type-change/request') as any);
    expect(res.status).toBe(401);
  });

  it("200 returns the user's latest request", async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.userTypeChangeRequest.findFirst as any).mockResolvedValue({ id: 'req1', status: 'PENDING' });
    const res = await GET(new Request('http://localhost/api/user/type-change/request') as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.request.id).toBe('req1');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    venue: { findMany: vi.fn(), create: vi.fn() },
  },
}));

import { GET, POST } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const getReq = () => new Request('http://localhost/api/admin/venues');
const postReq = (body: unknown) =>
  new Request('http://localhost/api/admin/venues', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/admin/venues', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET(getReq() as any);
    expect(res.status).toBe(401);
  });

  it('403 for a non-ADMIN user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ userType: 'BUSINESS' });
    const res = await GET(getReq() as any);
    expect(res.status).toBe(403);
  });

  it('200 lists venues for an ADMIN', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ userType: 'ADMIN' });
    (prisma.venue.findMany as any).mockResolvedValue([{ id: 'v1' }]);
    const res = await GET(getReq() as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.venues).toHaveLength(1);
  });
});

describe('POST /api/admin/venues', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(postReq({ name: 'Hall', city: 'Pune', state: 'MH' }) as any);
    expect(res.status).toBe(401);
  });

  it('403 for a non-ADMIN user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ userType: 'INDIVIDUAL' });
    const res = await POST(postReq({ name: 'Hall', city: 'Pune', state: 'MH' }) as any);
    expect(res.status).toBe(403);
  });

  it('400 for an invalid payload', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ userType: 'ADMIN' });
    const res = await POST(postReq({ name: '', city: 'Pune', state: 'MH' }) as any);
    expect(res.status).toBe(400);
  });

  it('200 creates the venue for an ADMIN', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ userType: 'ADMIN' });
    (prisma.venue.create as any).mockResolvedValue({ id: 'v1', name: 'Hall' });
    const res = await POST(postReq({ name: 'Hall', city: 'Pune', state: 'MH' }) as any);
    expect(res.status).toBe(200);
  });
});

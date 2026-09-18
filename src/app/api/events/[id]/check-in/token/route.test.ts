import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    eventEnrollment: { findFirst: vi.fn() },
  },
}));

import { GET } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-for-checkin';
const ctx = { params: Promise.resolve({ id: 'e1' }) };
const req = () => new Request('http://localhost/api/events/e1/check-in/token');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/events/[id]/check-in/token', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET(req() as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('404 when there is no approved enrollment for this user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.eventEnrollment.findFirst as any).mockResolvedValue(null);
    const res = await GET(req() as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('200 returns a signed token embedding the enrollment, event, and user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.eventEnrollment.findFirst as any).mockResolvedValue({ id: 'en1' });
    const res = await GET(req() as any, ctx as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    const decoded = jwt.verify(json.token, SECRET) as any;
    expect(decoded).toMatchObject({ enrollmentId: 'en1', eventId: 'e1', userId: 'u1' });
  });
});

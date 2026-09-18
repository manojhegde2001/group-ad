import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    powerTeam: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    powerTeamMember: { findMany: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));
vi.mock('@/lib/rate-limit', () => ({ enforceRateLimit: vi.fn(() => null) }));

import { GET, POST } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enforceRateLimit } from '@/lib/rate-limit';

const getReq = (qs = '') => new Request(`http://localhost/api/power-teams${qs}`);
const validBody = { name: 'Growth Team', categoryId: 'cat1' };
const postReq = (body: unknown) =>
  new Request('http://localhost/api/power-teams', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  (enforceRateLimit as any).mockReturnValue(null);
  (prisma.powerTeam.findMany as any).mockResolvedValue([]);
  (prisma.powerTeam.count as any).mockResolvedValue(0);
  (prisma.powerTeamMember.findMany as any).mockResolvedValue([]);
});

describe('GET /api/power-teams', () => {
  it('returns an empty list for ?mine=true when the viewer is anonymous', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET(getReq('?mine=true') as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.teams).toEqual([]);
    expect(prisma.powerTeam.findMany).not.toHaveBeenCalled();
  });

  it('scopes to the current user’s memberships for ?mine=true', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    await GET(getReq('?mine=true') as any);
    expect(prisma.powerTeam.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ members: { some: { userId: 'u1' } } }) }),
    );
  });

  it('ignores a categoryId that is not a valid ObjectId', async () => {
    (auth as any).mockResolvedValue(null);
    await GET(getReq('?categoryId=not-an-id') as any);
    expect(prisma.powerTeam.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } }),
    );
  });
});

describe('POST /api/power-teams', () => {
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

  it('403 for a non-BUSINESS, non-ADMIN user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', userType: 'INDIVIDUAL' } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', userType: 'INDIVIDUAL', powerTeamMemberships: [] });
    const res = await POST(postReq(validBody) as any);
    expect(res.status).toBe(403);
  });

  it('400 when the user already belongs to a power team', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', userType: 'BUSINESS' } });
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'u1',
      userType: 'BUSINESS',
      powerTeamMemberships: [{ id: 'existing' }],
    });
    const res = await POST(postReq(validBody) as any);
    expect(res.status).toBe(400);
    expect(prisma.powerTeam.create).not.toHaveBeenCalled();
  });

  it('201 creates the team and adds the creator as an APPROVED ADMIN member', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', userType: 'BUSINESS' } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', userType: 'BUSINESS', powerTeamMemberships: [] });
    (prisma.powerTeam.findUnique as any).mockResolvedValue(null);
    (prisma.powerTeam.create as any).mockResolvedValue({ id: 't1', name: validBody.name });
    const res = await POST(postReq(validBody) as any);
    expect(res.status).toBe(201);
    expect(prisma.powerTeam.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          creatorId: 'u1',
          members: { create: expect.objectContaining({ userId: 'u1', role: 'ADMIN', status: 'APPROVED' }) },
        }),
      }),
    );
  });

  it('lets an ADMIN bypass both the BUSINESS-only and single-membership constraints', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'admin1',
      userType: 'ADMIN',
      powerTeamMemberships: [{ id: 'existing' }],
    });
    (prisma.powerTeam.findUnique as any).mockResolvedValue(null);
    (prisma.powerTeam.create as any).mockResolvedValue({ id: 't1', name: validBody.name });
    const res = await POST(postReq(validBody) as any);
    expect(res.status).toBe(201);
  });
});

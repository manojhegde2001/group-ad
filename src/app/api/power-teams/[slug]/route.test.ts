import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    powerTeam: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

import { GET, PATCH, DELETE } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ctx = { params: Promise.resolve({ slug: 'growth-team' }) };
const getReq = () => new Request('http://localhost/api/power-teams/growth-team');
const patchReq = (body: unknown) =>
  new Request('http://localhost/api/power-teams/growth-team', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
const deleteReq = () => new Request('http://localhost/api/power-teams/growth-team', { method: 'DELETE' });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/power-teams/[slug]', () => {
  it('404 when the team does not exist', async () => {
    (prisma.powerTeam.findUnique as any).mockResolvedValue(null);
    const res = await GET(getReq() as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('200 returns the team (no auth required)', async () => {
    (prisma.powerTeam.findUnique as any).mockResolvedValue({ id: 't1', slug: 'growth-team' });
    const res = await GET(getReq() as any, ctx as any);
    expect(res.status).toBe(200);
  });
});

describe('PATCH /api/power-teams/[slug]', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await PATCH(patchReq({ name: 'New Name' }) as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('404 when the team does not exist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.powerTeam.findUnique as any).mockResolvedValue(null);
    const res = await PATCH(patchReq({ name: 'New Name' }) as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('403 when the caller is neither the creator nor a platform admin', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'random-user', userType: 'INDIVIDUAL' } });
    (prisma.powerTeam.findUnique as any).mockResolvedValue({ id: 't1', creatorId: 'creator1' });
    const res = await PATCH(patchReq({ name: 'New Name' }) as any, ctx as any);
    expect(res.status).toBe(403);
    expect(prisma.powerTeam.update).not.toHaveBeenCalled();
  });

  it('200 lets the creator update the team', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'creator1' } });
    (prisma.powerTeam.findUnique as any).mockResolvedValue({ id: 't1', creatorId: 'creator1' });
    (prisma.powerTeam.update as any).mockResolvedValue({ id: 't1', name: 'New Name' });
    const res = await PATCH(patchReq({ name: 'New Name' }) as any, ctx as any);
    expect(res.status).toBe(200);
  });

  it('200 lets a platform ADMIN update a team they did not create', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.powerTeam.findUnique as any).mockResolvedValue({ id: 't1', creatorId: 'creator1' });
    (prisma.powerTeam.update as any).mockResolvedValue({ id: 't1', name: 'New Name' });
    const res = await PATCH(patchReq({ name: 'New Name' }) as any, ctx as any);
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/power-teams/[slug]', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('403 when the caller is neither the creator nor a platform admin', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'random-user', userType: 'INDIVIDUAL' } });
    (prisma.powerTeam.findUnique as any).mockResolvedValue({ id: 't1', creatorId: 'creator1' });
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(403);
    expect(prisma.powerTeam.delete).not.toHaveBeenCalled();
  });

  it('200 deletes the team for the creator', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'creator1' } });
    (prisma.powerTeam.findUnique as any).mockResolvedValue({ id: 't1', creatorId: 'creator1' });
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(200);
    expect(prisma.powerTeam.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
  });
});

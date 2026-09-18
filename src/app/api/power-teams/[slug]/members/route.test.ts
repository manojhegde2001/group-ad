import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    powerTeam: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
    powerTeamMember: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

import { POST, PATCH, DELETE } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ctx = { params: Promise.resolve({ slug: 'growth-team' }) };
const postReq = () => new Request('http://localhost/api/power-teams/growth-team/members', { method: 'POST' });
const patchReq = (body: unknown) =>
  new Request('http://localhost/api/power-teams/growth-team/members', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
const deleteReq = (body: unknown) =>
  new Request('http://localhost/api/power-teams/growth-team/members', {
    method: 'DELETE',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/power-teams/[slug]/members', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(postReq() as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('404 when the team does not exist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.powerTeam.findUnique as any).mockResolvedValue(null);
    const res = await POST(postReq() as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('403 for a non-BUSINESS, non-ADMIN user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', userType: 'INDIVIDUAL' } });
    (prisma.powerTeam.findUnique as any).mockResolvedValue({ id: 't1' });
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', userType: 'INDIVIDUAL' });
    const res = await POST(postReq() as any, ctx as any);
    expect(res.status).toBe(403);
  });

  it('400 when already a member of a power team', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', userType: 'BUSINESS' } });
    (prisma.powerTeam.findUnique as any).mockResolvedValue({ id: 't1' });
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', userType: 'BUSINESS' });
    (prisma.powerTeamMember.findUnique as any).mockResolvedValue({ id: 'existing' });
    const res = await POST(postReq() as any, ctx as any);
    expect(res.status).toBe(400);
    expect(prisma.powerTeamMember.create).not.toHaveBeenCalled();
  });

  it('201 creates a PENDING membership', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', userType: 'BUSINESS' } });
    (prisma.powerTeam.findUnique as any).mockResolvedValue({ id: 't1' });
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', userType: 'BUSINESS' });
    (prisma.powerTeamMember.findUnique as any).mockResolvedValue(null);
    (prisma.powerTeamMember.create as any).mockResolvedValue({ id: 'm1', status: 'PENDING' });
    const res = await POST(postReq() as any, ctx as any);
    expect(res.status).toBe(201);
    expect(prisma.powerTeamMember.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING' }) }),
    );
  });
});

describe('PATCH /api/power-teams/[slug]/members', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await PATCH(patchReq({ memberId: 'm1', status: 'APPROVED' }) as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('404 when the team does not exist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.powerTeam.findUnique as any).mockResolvedValue(null);
    const res = await PATCH(patchReq({ memberId: 'm1', status: 'APPROVED' }) as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('403 when the caller is neither team creator nor platform admin', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'random-user', userType: 'INDIVIDUAL' } });
    (prisma.powerTeam.findUnique as any).mockResolvedValue({ id: 't1', creatorId: 'creator1' });
    const res = await PATCH(patchReq({ memberId: 'm1', status: 'APPROVED' }) as any, ctx as any);
    expect(res.status).toBe(403);
    expect(prisma.powerTeamMember.update).not.toHaveBeenCalled();
  });

  it('200 approves a member and stamps joinedAt', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'creator1' } });
    (prisma.powerTeam.findUnique as any).mockResolvedValue({ id: 't1', creatorId: 'creator1' });
    (prisma.powerTeamMember.update as any).mockResolvedValue({ id: 'm1', status: 'APPROVED' });
    const res = await PATCH(patchReq({ memberId: 'm1', status: 'APPROVED' }) as any, ctx as any);
    expect(res.status).toBe(200);
    expect(prisma.powerTeamMember.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'APPROVED', joinedAt: expect.any(Date) }) }),
    );
  });
});

describe('DELETE /api/power-teams/[slug]/members', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await DELETE(deleteReq({ memberId: 'm1' }) as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('404 when the member does not exist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.powerTeamMember.findUnique as any).mockResolvedValue(null);
    const res = await DELETE(deleteReq({ memberId: 'm1' }) as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('403 when caller is not self, team creator, or platform admin', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'random-user', userType: 'INDIVIDUAL' } });
    (prisma.powerTeamMember.findUnique as any).mockResolvedValue({
      id: 'm1',
      userId: 'member1',
      powerTeam: { creatorId: 'creator1' },
    });
    const res = await DELETE(deleteReq({ memberId: 'm1' }) as any, ctx as any);
    expect(res.status).toBe(403);
    expect(prisma.powerTeamMember.delete).not.toHaveBeenCalled();
  });

  it('200 lets the member remove themselves', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'member1' } });
    (prisma.powerTeamMember.findUnique as any).mockResolvedValue({
      id: 'm1',
      userId: 'member1',
      powerTeam: { creatorId: 'creator1' },
    });
    const res = await DELETE(deleteReq({ memberId: 'm1' }) as any, ctx as any);
    expect(res.status).toBe(200);
    expect(prisma.powerTeamMember.delete).toHaveBeenCalledWith({ where: { id: 'm1' } });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), findMany: vi.fn() },
    profileView: { create: vi.fn(() => Promise.resolve({})) },
    connection: { count: vi.fn(() => Promise.resolve(0)), findFirst: vi.fn(), findMany: vi.fn() },
    post: { count: vi.fn(() => Promise.resolve(0)) },
    block: { findUnique: vi.fn() },
    powerTeamMember: { findFirst: vi.fn() },
    eventEnrollment: { findFirst: vi.fn() },
  },
}));

import { GET } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ctx = { params: Promise.resolve({ username: 'jane' }) };
const req = () => new Request('http://localhost/api/users/by-username/jane');

const targetUser = {
  id: 'target1',
  name: 'Jane',
  username: 'jane',
  phone: '+911111111111',
  secondaryPhone: '+922222222222',
  phoneVisibility: 'BOTH',
};

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.connection.count as any).mockResolvedValue(0);
  (prisma.connection.findMany as any).mockResolvedValue([]);
  (prisma.powerTeamMember.findFirst as any).mockResolvedValue(null);
});

describe('GET /api/users/by-username/[username]', () => {
  it('404 when the user does not exist', async () => {
    (auth as any).mockResolvedValue(null);
    (prisma.user.findUnique as any).mockResolvedValue(null);
    const res = await GET(req() as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it("shows the viewer their own phone numbers regardless of phoneVisibility", async () => {
    (auth as any).mockResolvedValue({ user: { id: 'target1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ ...targetUser, phoneVisibility: 'NONE' });
    const res = await GET(req() as any, ctx as any);
    const json = await res.json();
    expect(json.user.phone).toBe(targetUser.phone);
    expect(json.user.secondaryPhone).toBe(targetUser.secondaryPhone);
  });

  it('hides both phone numbers from a non-connected viewer', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'viewer1' } });
    (prisma.user.findUnique as any).mockResolvedValue(targetUser);
    (prisma.connection.findFirst as any).mockResolvedValue(null); // not connected
    (prisma.eventEnrollment.findFirst as any).mockResolvedValue(null);
    const res = await GET(req() as any, ctx as any);
    const json = await res.json();
    expect(json.user.phone).toBeNull();
    expect(json.user.secondaryPhone).toBeNull();
  });

  it('hides both phone numbers from a connected viewer with no shared event attendance', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'viewer1' } });
    (prisma.user.findUnique as any).mockResolvedValue(targetUser);
    (prisma.connection.findFirst as any).mockResolvedValue({ status: 'ACCEPTED', requesterId: 'viewer1' });
    (prisma.eventEnrollment.findFirst as any).mockResolvedValue(null); // no shared attendance
    const res = await GET(req() as any, ctx as any);
    const json = await res.json();
    expect(json.user.phone).toBeNull();
    expect(json.user.secondaryPhone).toBeNull();
  });

  it('reveals phone numbers to a connected viewer who shared event attendance, per phoneVisibility=BOTH', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'viewer1' } });
    (prisma.user.findUnique as any).mockResolvedValue(targetUser);
    (prisma.connection.findFirst as any).mockResolvedValue({ status: 'ACCEPTED', requesterId: 'viewer1' });
    (prisma.eventEnrollment.findFirst as any).mockResolvedValue({ id: 'shared' });
    const res = await GET(req() as any, ctx as any);
    const json = await res.json();
    expect(json.user.phone).toBe(targetUser.phone);
    expect(json.user.secondaryPhone).toBe(targetUser.secondaryPhone);
  });

  it('honors phoneVisibility=PRIMARY by dropping the secondary number even when eligible', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'viewer1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ ...targetUser, phoneVisibility: 'PRIMARY' });
    (prisma.connection.findFirst as any).mockResolvedValue({ status: 'ACCEPTED', requesterId: 'viewer1' });
    (prisma.eventEnrollment.findFirst as any).mockResolvedValue({ id: 'shared' });
    const res = await GET(req() as any, ctx as any);
    const json = await res.json();
    expect(json.user.phone).toBe(targetUser.phone);
    expect(json.user.secondaryPhone).toBeNull();
  });

  it('reports connectionStatus=null for a REJECTED connection (allows re-requesting)', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'viewer1' } });
    (prisma.user.findUnique as any).mockResolvedValue(targetUser);
    (prisma.connection.findFirst as any).mockResolvedValue({ status: 'REJECTED', requesterId: 'viewer1' });
    (prisma.eventEnrollment.findFirst as any).mockResolvedValue(null);
    const res = await GET(req() as any, ctx as any);
    const json = await res.json();
    expect(json.user.connectionStatus).toBeNull();
  });

  it('reports isBlocked based on a block record from the viewer', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'viewer1' } });
    (prisma.user.findUnique as any).mockResolvedValue(targetUser);
    (prisma.connection.findFirst as any).mockResolvedValue(null);
    (prisma.block.findUnique as any).mockResolvedValue({ id: 'b1' });
    (prisma.eventEnrollment.findFirst as any).mockResolvedValue(null);
    const res = await GET(req() as any, ctx as any);
    const json = await res.json();
    expect(json.user.isBlocked).toBe(true);
  });
});

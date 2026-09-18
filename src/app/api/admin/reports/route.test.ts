import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    report: { findMany: vi.fn(), count: vi.fn(), update: vi.fn() },
  },
}));

import { GET, PATCH } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const getReq = (qs = '') => new Request(`http://localhost/api/admin/reports${qs}`);
const patchReq = (body: unknown) =>
  new Request('http://localhost/api/admin/reports', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.report.findMany as any).mockResolvedValue([]);
  (prisma.report.count as any).mockResolvedValue(0);
});

describe('GET /api/admin/reports', () => {
  it('403 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET(getReq() as any);
    expect(res.status).toBe(403);
  });

  it('403 for a non-ADMIN user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', userType: 'BUSINESS' } });
    const res = await GET(getReq() as any);
    expect(res.status).toBe(403);
  });

  it('200 lists reports with pagination for an ADMIN', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.report.findMany as any).mockResolvedValue([{ id: 'r1' }]);
    (prisma.report.count as any).mockResolvedValue(1);
    const res = await GET(getReq() as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.total).toBe(1);
  });

  it('filters by status when provided (and not ALL)', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    await GET(getReq('?status=RESOLVED') as any);
    expect(prisma.report.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'RESOLVED' }) }),
    );
  });
});

describe('PATCH /api/admin/reports', () => {
  it('403 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await PATCH(patchReq({ reportId: 'r1', status: 'RESOLVED' }) as any);
    expect(res.status).toBe(403);
  });

  it('400 for an invalid status', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    const res = await PATCH(patchReq({ reportId: 'r1', status: 'CLOSED' }) as any);
    expect(res.status).toBe(400);
  });

  it('200 updates the report status and stamps the reviewer', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.report.update as any).mockResolvedValue({ id: 'r1', status: 'RESOLVED' });
    const res = await PATCH(patchReq({ reportId: 'r1', status: 'RESOLVED' }) as any);
    expect(res.status).toBe(200);
    expect(prisma.report.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ reviewedBy: 'admin1' }) }),
    );
  });
});

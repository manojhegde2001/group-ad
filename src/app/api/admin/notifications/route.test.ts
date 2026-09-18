import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    userTypeChangeRequest: { findMany: vi.fn() },
    report: { findMany: vi.fn() },
  },
}));

import { GET } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.userTypeChangeRequest.findMany as any).mockResolvedValue([]);
  (prisma.report.findMany as any).mockResolvedValue([]);
});

describe('GET /api/admin/notifications', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('401 for a non-ADMIN user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', userType: 'INDIVIDUAL' } });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('200 merges pending verifications and reports, sorted newest first', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.userTypeChangeRequest.findMany as any).mockResolvedValue([
      { id: 'v1', toType: 'BUSINESS', createdAt: new Date('2026-01-01'), user: { name: 'Jane' } },
    ]);
    (prisma.report.findMany as any).mockResolvedValue([
      { id: 'r1', targetType: 'POST', createdAt: new Date('2026-01-02'), reporter: { name: 'Bob' } },
    ]);
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.count).toBe(2);
    expect(json.notifications[0].id).toBe('r-r1'); // newer report sorts first
  });
});

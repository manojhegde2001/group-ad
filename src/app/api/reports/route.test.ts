import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    report: { create: vi.fn() },
  },
}));
vi.mock('@/lib/rate-limit', () => ({ enforceRateLimit: vi.fn(() => null) }));

import { POST } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enforceRateLimit } from '@/lib/rate-limit';

const validBody = { targetType: 'POST', targetId: 'p1', reason: 'spam' };
const req = (body: unknown) =>
  new Request('http://localhost/api/reports', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  (enforceRateLimit as any).mockReturnValue(null);
});

describe('POST /api/reports', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(req(validBody) as any);
    expect(res.status).toBe(401);
  });

  it('429 when rate-limited', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (enforceRateLimit as any).mockReturnValue(new Response(null, { status: 429 }));
    const res = await POST(req(validBody) as any);
    expect(res.status).toBe(429);
    expect(prisma.report.create).not.toHaveBeenCalled();
  });

  it('400 for an invalid payload', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    const res = await POST(req({ targetType: 'COMMENT', targetId: 'p1', reason: 'x' }) as any);
    expect(res.status).toBe(400);
  });

  it('200 creates the report scoped to the current reporter', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.report.create as any).mockResolvedValue({ id: 'r1', ...validBody, reporterId: 'u1' });
    const res = await POST(req(validBody) as any);
    expect(res.status).toBe(200);
    expect(prisma.report.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ reporterId: 'u1' }) }),
    );
  });
});

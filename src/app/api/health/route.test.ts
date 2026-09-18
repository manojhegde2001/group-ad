import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $runCommandRaw: vi.fn(),
  },
}));

import { GET } from './route';
import { prisma } from '@/lib/prisma';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/health', () => {
  it('200 with status ok when the DB ping succeeds', async () => {
    (prisma.$runCommandRaw as any).mockResolvedValue({ ok: 1 });
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.status).toBe('ok');
  });

  it('503 with status error when the DB ping fails', async () => {
    (prisma.$runCommandRaw as any).mockRejectedValue(new Error('db unreachable'));
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(503);
    expect(json.status).toBe('error');
  });
});

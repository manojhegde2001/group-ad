import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    block: { delete: vi.fn() },
  },
}));

import { DELETE } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ctx = { params: Promise.resolve({ blockedId: 'u2' }) };
const req = () => new Request('http://localhost/api/blocks/u2', { method: 'DELETE' });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DELETE /api/blocks/[blockedId]', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await DELETE(req() as any, ctx as any);
    expect(res.status).toBe(401);
    expect(prisma.block.delete).not.toHaveBeenCalled();
  });

  it('200 deletes the block scoped to the current blocker', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.block.delete as any).mockResolvedValue({ id: 'b1' });
    const res = await DELETE(req() as any, ctx as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.message).toBe('User unblocked successfully');
    expect(prisma.block.delete).toHaveBeenCalledWith({
      where: { blockerId_blockedId: { blockerId: 'u1', blockedId: 'u2' } },
    });
  });

  it('500 when the block record does not exist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.block.delete as any).mockRejectedValue(new Error('Record to delete does not exist'));
    const res = await DELETE(req() as any, ctx as any);
    expect(res.status).toBe(500);
  });
});

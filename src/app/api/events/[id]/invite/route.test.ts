import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
    notification: { createMany: vi.fn() },
  },
}));
vi.mock('@/lib/socket-service', () => ({ socketService: { notifyUser: vi.fn() } }));

import { POST } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { socketService } from '@/lib/socket-service';

const ctx = { params: Promise.resolve({ id: 'e1' }) };
const req = (body: unknown) =>
  new Request('http://localhost/api/events/e1/invite', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.user.findUnique as any).mockResolvedValue({ name: 'Inviter' });
});

describe('POST /api/events/[id]/invite', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(req({ userIds: ['u2'] }) as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('400 for an empty userIds list', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    const res = await POST(req({ userIds: [] }) as any, ctx as any);
    expect(res.status).toBe(400);
  });

  it('404 when the event does not exist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.event.findUnique as any).mockResolvedValue(null);
    const res = await POST(req({ userIds: ['u2'] }) as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('200 sends notifications and real-time invites to each invited user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.event.findUnique as any).mockResolvedValue({ id: 'e1', title: 'Networking Night' });
    const res = await POST(req({ userIds: ['u2', 'u3'] }) as any, ctx as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.message).toContain('2 users');
    expect(prisma.notification.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([expect.objectContaining({ userId: 'u2' }), expect.objectContaining({ userId: 'u3' })]),
      }),
    );
    expect(socketService.notifyUser).toHaveBeenCalledTimes(2);
  });
});

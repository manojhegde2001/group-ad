import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    conversation: { findUnique: vi.fn(), update: vi.fn() },
    block: { findFirst: vi.fn() },
    message: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock('@/lib/rate-limit', () => ({ enforceRateLimit: vi.fn(() => null) }));
vi.mock('@/lib/socket-service', () => ({ socketService: { emitMessage: vi.fn() } }));
vi.mock('@/services/notification-service', () => ({ notificationService: { create: vi.fn() } }));

import { POST } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enforceRateLimit } from '@/lib/rate-limit';

const ctx = { params: Promise.resolve({ id: 'conv1' }) };
const body = () =>
  new Request('http://localhost/api/conversations/conv1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ content: 'hello' }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  (enforceRateLimit as any).mockReturnValue(null);
});

describe('POST /api/conversations/[id]/messages', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(body() as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('403 when the user is not a participant', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.conversation.findUnique as any).mockResolvedValue({ id: 'conv1', participantIds: ['u2', 'u3'] });
    const res = await POST(body() as any, ctx as any);
    expect(res.status).toBe(403);
  });

  it('429 when rate-limited (guard runs before any DB work)', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (enforceRateLimit as any).mockReturnValue(NextResponse.json({ error: 'Too many requests' }, { status: 429 }));
    const res = await POST(body() as any, ctx as any);
    expect(res.status).toBe(429);
    expect(prisma.conversation.findUnique).not.toHaveBeenCalled();
  });

  it('201 for a participant with no block', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', name: 'U One' } });
    (prisma.conversation.findUnique as any).mockResolvedValue({ id: 'conv1', participantIds: ['u1', 'u2'] });
    (prisma.block.findFirst as any).mockResolvedValue(null);
    (prisma.$transaction as any).mockResolvedValue([{ id: 'm1', content: 'hello', sender: { id: 'u1' } }]);
    const res = await POST(body() as any, ctx as any);
    expect(res.status).toBe(201);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('403 when a block exists between participants', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.conversation.findUnique as any).mockResolvedValue({ id: 'conv1', participantIds: ['u1', 'u2'] });
    (prisma.block.findFirst as any).mockResolvedValue({ id: 'b1' });
    const res = await POST(body() as any, ctx as any);
    expect(res.status).toBe(403);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

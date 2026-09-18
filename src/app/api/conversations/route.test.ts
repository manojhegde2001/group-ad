import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    conversation: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
    block: { findMany: vi.fn(), findFirst: vi.fn() },
    user: { findMany: vi.fn(), findUnique: vi.fn() },
    message: { count: vi.fn() },
    connection: { findFirst: vi.fn() },
  },
}));
vi.mock('@/lib/rate-limit', () => ({ enforceRateLimit: vi.fn(() => null) }));

import { GET, POST } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enforceRateLimit } from '@/lib/rate-limit';

const postReq = (body: unknown) =>
  new Request('http://localhost/api/conversations', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  (enforceRateLimit as any).mockReturnValue(null);
  (prisma.block.findMany as any).mockResolvedValue([]);
  (prisma.user.findMany as any).mockResolvedValue([]);
  (prisma.message.count as any).mockResolvedValue(0);
});

describe('GET /api/conversations', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('filters out conversations with a blocked participant', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.conversation.findMany as any).mockResolvedValue([
      { id: 'conv1', participantIds: ['u1', 'blocked1'], messages: [], lastMessageAt: new Date() },
      { id: 'conv2', participantIds: ['u1', 'u2'], messages: [], lastMessageAt: new Date() },
    ]);
    (prisma.block.findMany as any).mockResolvedValue([{ blockerId: 'u1', blockedId: 'blocked1' }]);
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.conversations).toHaveLength(1);
    expect(json.conversations[0].id).toBe('conv2');
  });
});

describe('POST /api/conversations', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(postReq({ participantId: 'u2' }) as any);
    expect(res.status).toBe(401);
  });

  it('429 when rate-limited', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (enforceRateLimit as any).mockReturnValue(new Response(null, { status: 429 }));
    const res = await POST(postReq({ participantId: 'u2' }) as any);
    expect(res.status).toBe(429);
    expect(prisma.block.findFirst).not.toHaveBeenCalled();
  });

  it('400 when messaging self', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    const res = await POST(postReq({ participantId: 'u1' }) as any);
    expect(res.status).toBe(400);
  });

  it('403 when a block exists between the two users', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.block.findFirst as any).mockResolvedValue({ id: 'b1' });
    const res = await POST(postReq({ participantId: 'u2' }) as any);
    expect(res.status).toBe(403);
  });

  it('404 when the target user does not exist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.block.findFirst as any).mockResolvedValue(null);
    (prisma.user.findUnique as any).mockResolvedValue(null);
    const res = await POST(postReq({ participantId: 'u2' }) as any);
    expect(res.status).toBe(404);
  });

  it('403 when the target user has disabled messaging', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.block.findFirst as any).mockResolvedValue(null);
    (prisma.user.findUnique as any).mockResolvedValue({ visibility: 'PUBLIC', messagingEnabled: false });
    const res = await POST(postReq({ participantId: 'u2' }) as any);
    expect(res.status).toBe(403);
  });

  it('403 when the target is private and not connected to the current user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.block.findFirst as any).mockResolvedValue(null);
    (prisma.user.findUnique as any).mockResolvedValue({ visibility: 'PRIVATE', messagingEnabled: true });
    (prisma.connection.findFirst as any).mockResolvedValue(null);
    const res = await POST(postReq({ participantId: 'u2' }) as any);
    expect(res.status).toBe(403);
  });

  it('returns the existing conversation instead of creating a duplicate', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.block.findFirst as any).mockResolvedValue(null);
    (prisma.user.findUnique as any).mockResolvedValue({ visibility: 'PUBLIC', messagingEnabled: true });
    (prisma.conversation.findFirst as any).mockResolvedValue({ id: 'existing' });
    const res = await POST(postReq({ participantId: 'u2' }) as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.conversation.id).toBe('existing');
    expect(prisma.conversation.create).not.toHaveBeenCalled();
  });

  it('201 creates a new conversation when none exists', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.block.findFirst as any).mockResolvedValue(null);
    (prisma.user.findUnique as any).mockResolvedValue({ visibility: 'PUBLIC', messagingEnabled: true });
    (prisma.conversation.findFirst as any).mockResolvedValue(null);
    (prisma.conversation.create as any).mockResolvedValue({ id: 'new1', participantIds: ['u1', 'u2'] });
    const res = await POST(postReq({ participantId: 'u2' }) as any);
    expect(res.status).toBe(201);
  });
});

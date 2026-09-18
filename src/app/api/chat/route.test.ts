import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ enforceRateLimit: vi.fn(() => null) }));
vi.mock('@/services/chat/chat-service', async () => {
  class ChatServiceError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
  }
  return { processChatTurn: vi.fn(), ChatServiceError };
});

import { POST } from './route';
import { auth } from '@/lib/auth';
import { enforceRateLimit } from '@/lib/rate-limit';
import { processChatTurn, ChatServiceError } from '@/services/chat/chat-service';

const validBody = { messages: [{ role: 'user', content: 'hi' }], sessionId: 's1' };
const req = (body: unknown) =>
  new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  (enforceRateLimit as any).mockReturnValue(null);
});

describe('POST /api/chat', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(req(validBody) as any);
    expect(res.status).toBe(401);
  });

  it('429 when rate-limited, before calling the chat service', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (enforceRateLimit as any).mockReturnValue(new Response(null, { status: 429 }));
    const res = await POST(req(validBody) as any);
    expect(res.status).toBe(429);
    expect(processChatTurn).not.toHaveBeenCalled();
  });

  it('400 for an invalid request body', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    const res = await POST(req({ messages: [], sessionId: 's1' }) as any);
    expect(res.status).toBe(400);
  });

  it('200 returns the normalized chat reply on success', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', name: 'U One' } });
    (processChatTurn as any).mockResolvedValue({ reply: 'Hello there', usage: { totalTokens: 10 } });
    const res = await POST(req(validBody) as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toEqual({ reply: 'Hello there', sessionId: 's1', usage: { totalTokens: 10 } });
  });

  it('maps a ChatServiceError to its declared status code', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (processChatTurn as any).mockRejectedValue(new ChatServiceError('Model unavailable', 503));
    const res = await POST(req(validBody) as any);
    const json = await res.json();
    expect(res.status).toBe(503);
    expect(json.error).toBe('Model unavailable');
  });

  it('500 with a generic message for an unexpected error', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (processChatTurn as any).mockRejectedValue(new Error('boom'));
    const res = await POST(req(validBody) as any);
    expect(res.status).toBe(500);
  });
});

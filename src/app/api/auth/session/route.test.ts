import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));

import { GET } from './route';
import { auth } from '@/lib/auth';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/auth/session', () => {
  it('returns { user: null } with a 200 status when there is no session', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toEqual({ user: null });
  });

  it('returns the session object as-is when authenticated', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' }, expires: '2026-01-01' });
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.user.id).toBe('u1');
  });

  it('returns { user: null } with a 200 status when auth() throws', async () => {
    (auth as any).mockRejectedValue(new Error('boom'));
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toEqual({ user: null });
  });
});

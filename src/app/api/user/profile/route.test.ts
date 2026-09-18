import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
  },
}));
vi.mock('@/lib/rate-limit', () => ({ enforceRateLimit: vi.fn(() => null) }));
vi.mock('bcryptjs', () => ({ default: { compare: vi.fn(), hash: vi.fn(() => 'hashed') } }));

import { GET, PATCH, PUT } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enforceRateLimit } from '@/lib/rate-limit';

const getReq = () => new Request('http://localhost/api/user/profile');
const patchReq = (body: unknown) =>
  new Request('http://localhost/api/user/profile', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
const putReq = (body: unknown) =>
  new Request('http://localhost/api/user/profile', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  (enforceRateLimit as any).mockReturnValue(null);
});

describe('GET /api/user/profile', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET(getReq() as any);
    expect(res.status).toBe(401);
  });

  it('404 when the user record is missing', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue(null);
    const res = await GET(getReq() as any);
    expect(res.status).toBe(404);
  });

  it('200 returns the full profile for the current session', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1' });
    const res = await GET(getReq() as any);
    expect(res.status).toBe(200);
  });
});

describe('PATCH /api/user/profile', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await PATCH(patchReq({ name: 'New Name' }) as any);
    expect(res.status).toBe(401);
  });

  it('429 when rate-limited', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (enforceRateLimit as any).mockReturnValue(new Response(null, { status: 429 }));
    const res = await PATCH(patchReq({ name: 'New Name' }) as any);
    expect(res.status).toBe(429);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('400 for an invalid payload', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    const res = await PATCH(patchReq({ website: 'not-a-url' }) as any);
    expect(res.status).toBe(400);
  });

  it('400 when the requested username is taken by someone else', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'other-user' });
    const res = await PATCH(patchReq({ username: 'taken_name' }) as any);
    expect(res.status).toBe(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('allows keeping your own current username', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1' });
    (prisma.user.update as any).mockResolvedValue({ id: 'u1', username: 'my_name' });
    const res = await PATCH(patchReq({ username: 'my_name' }) as any);
    expect(res.status).toBe(200);
  });

  it('converts empty-string fields to null on update', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.update as any).mockResolvedValue({ id: 'u1' });
    await PATCH(patchReq({ website: '' }) as any);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ website: null }) }),
    );
  });
});

describe('PUT /api/user/profile (change password)', () => {
  const validBody = { currentPassword: 'old', newPassword: 'Str0ng!Pass', confirmPassword: 'Str0ng!Pass' };

  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await PUT(putReq(validBody) as any);
    expect(res.status).toBe(401);
  });

  it('429 when rate-limited', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (enforceRateLimit as any).mockReturnValue(new Response(null, { status: 429 }));
    const res = await PUT(putReq(validBody) as any);
    expect(res.status).toBe(429);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('400 when new and confirm passwords do not match', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    const res = await PUT(putReq({ ...validBody, confirmPassword: 'Different1!' }) as any);
    expect(res.status).toBe(400);
  });

  it('400 when the current password is incorrect', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', password: 'hashed-old' });
    (bcrypt.compare as any).mockResolvedValue(false);
    const res = await PUT(putReq(validBody) as any);
    expect(res.status).toBe(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('200 changes the password when the current password is correct', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', password: 'hashed-old' });
    (bcrypt.compare as any).mockResolvedValue(true);
    const res = await PUT(putReq(validBody) as any);
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1' }, data: { password: 'hashed' } }),
    );
  });
});

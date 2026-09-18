import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findMany: vi.fn() },
  },
}));

import { POST } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const req = (body: unknown) =>
  new Request('http://localhost/api/admin/users/bulk/validate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

const validUser = { name: 'Jane', username: 'jane1', email: 'jane@example.com', password: 'password1' };

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.user.findMany as any).mockResolvedValue([]);
});

describe('POST /api/admin/users/bulk/validate', () => {
  it('403 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(req({ users: [validUser] }) as any);
    expect(res.status).toBe(403);
  });

  it('403 for a non-ADMIN user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', userType: 'BUSINESS' } });
    const res = await POST(req({ users: [validUser] }) as any);
    expect(res.status).toBe(403);
  });

  it('400 when users is not an array', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    const res = await POST(req({ users: 'not-an-array' }) as any);
    expect(res.status).toBe(400);
  });

  it('marks a well-formed, unique user as valid', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    const res = await POST(req({ users: [validUser] }) as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.results[0].isValid).toBe(true);
    expect(json.results[0].errors).toEqual([]);
  });

  it('flags schema violations (e.g. short password)', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    const res = await POST(req({ users: [{ ...validUser, password: 'x' }] }) as any);
    const json = await res.json();
    expect(json.results[0].isValid).toBe(false);
    expect(json.results[0].errors).toContain('Password too short');
  });

  it('flags a duplicate email/username already present in the DB', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.user.findMany as any).mockResolvedValue([{ email: validUser.email, username: 'someone-else' }]);
    const res = await POST(req({ users: [validUser] }) as any);
    const json = await res.json();
    expect(json.results[0].isValid).toBe(false);
    expect(json.results[0].errors).toContain('Email already exists');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findFirst: vi.fn(), createMany: vi.fn() },
  },
}));
vi.mock('@/lib/mailer', () => ({
  sendMail: vi.fn(),
  bulkAccountCreatedEmail: vi.fn(() => '<html></html>'),
  getAppBaseUrl: vi.fn(() => 'http://localhost:3000'),
}));

import { POST } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const oneUser = {
  name: 'Jane',
  username: 'jane1',
  email: 'jane@example.com',
  password: 'password1',
};

const req = (body: unknown) =>
  new Request('http://localhost/api/admin/users/bulk/create', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.user.findFirst as any).mockResolvedValue(null);
});

describe('POST /api/admin/users/bulk/create', () => {
  it('403 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(req({ users: [oneUser] }) as any);
    expect(res.status).toBe(403);
  });

  it('403 for a non-ADMIN user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', userType: 'BUSINESS' } });
    const res = await POST(req({ users: [oneUser] }) as any);
    expect(res.status).toBe(403);
    expect(prisma.user.createMany).not.toHaveBeenCalled();
  });

  it('400 for an invalid batch (empty users array)', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    const res = await POST(req({ users: [] }) as any);
    expect(res.status).toBe(400);
  });

  it('400 when a duplicate email/username already exists', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.user.findFirst as any).mockResolvedValue({ id: 'existing' });
    const res = await POST(req({ users: [oneUser] }) as any);
    expect(res.status).toBe(400);
    expect(prisma.user.createMany).not.toHaveBeenCalled();
  });

  it('200 creates users in bulk for a valid batch', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.user.createMany as any).mockResolvedValue({ count: 1 });
    const res = await POST(req({ users: [oneUser] }) as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.count).toBe(1);
    expect(prisma.user.createMany).toHaveBeenCalled();
  });
});

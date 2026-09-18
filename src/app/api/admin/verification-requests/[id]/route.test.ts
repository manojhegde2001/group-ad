import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    userTypeChangeRequest: { findUnique: vi.fn(), update: vi.fn() },
    user: { update: vi.fn() },
    notification: { create: vi.fn() },
  },
}));
vi.mock('@/lib/socket-service', () => ({ socketService: { notifyUser: vi.fn() } }));

import { PATCH } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { socketService } from '@/lib/socket-service';

const ctx = { params: Promise.resolve({ id: 'req1' }) };
const req = (body: unknown) =>
  new Request('http://localhost/api/admin/verification-requests/req1', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

const pendingRequest = {
  id: 'req1',
  userId: 'u2',
  toType: 'BUSINESS',
  categoryId: 'cat1',
  companyName: 'Acme Inc',
  companyLogo: null,
  turnover: null,
  companySize: null,
  gstNumber: null,
  establishedYear: null,
  companyWebsite: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PATCH /api/admin/verification-requests/[id]', () => {
  it('403 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await PATCH(req({ status: 'APPROVED' }) as any, ctx as any);
    expect(res.status).toBe(403);
  });

  it('403 for a non-ADMIN user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', userType: 'BUSINESS' } });
    const res = await PATCH(req({ status: 'APPROVED' }) as any, ctx as any);
    expect(res.status).toBe(403);
    expect(prisma.userTypeChangeRequest.findUnique).not.toHaveBeenCalled();
  });

  it('400 for an invalid status', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    const res = await PATCH(req({ status: 'PENDING' }) as any, ctx as any);
    expect(res.status).toBe(400);
  });

  it('404 when the request does not exist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.userTypeChangeRequest.findUnique as any).mockResolvedValue(null);
    const res = await PATCH(req({ status: 'APPROVED' }) as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('on APPROVED, upgrades the user and sends a VERIFICATION_APPROVED notification', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.userTypeChangeRequest.findUnique as any).mockResolvedValue(pendingRequest);
    (prisma.userTypeChangeRequest.update as any).mockResolvedValue({ ...pendingRequest, status: 'APPROVED' });
    (prisma.notification.create as any).mockResolvedValue({ id: 'n1', message: 'approved' });
    const res = await PATCH(req({ status: 'APPROVED' }) as any, ctx as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u2' },
        data: expect.objectContaining({ userType: 'BUSINESS', categoryId: 'cat1' }),
      }),
    );
    expect(socketService.notifyUser).toHaveBeenCalledWith(
      'u2',
      expect.objectContaining({ type: 'VERIFICATION_APPROVED' }),
    );
    expect(json.message).toBe('Request approved successfully.');
  });

  it('on REJECTED, reverts the user to INDIVIDUAL and notifies with the reason', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.userTypeChangeRequest.findUnique as any).mockResolvedValue(pendingRequest);
    (prisma.userTypeChangeRequest.update as any).mockResolvedValue({ ...pendingRequest, status: 'REJECTED' });
    (prisma.notification.create as any).mockResolvedValue({ id: 'n1', message: 'rejected' });
    const res = await PATCH(req({ status: 'REJECTED', reviewNote: 'Missing GST' }) as any, ctx as any);
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u2' }, data: { userType: 'INDIVIDUAL' } }),
    );
    expect(socketService.notifyUser).toHaveBeenCalledWith(
      'u2',
      expect.objectContaining({ type: 'VERIFICATION_REJECTED' }),
    );
  });
});

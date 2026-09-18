import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    meeting: { findUnique: vi.fn(), update: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));
vi.mock('@/services/notification-service', () => ({ notificationService: { create: vi.fn() } }));
vi.mock('@/lib/mailer', () => ({
  sendMail: vi.fn(() => Promise.resolve()),
  meetingAcceptedEmail: vi.fn(() => '<html></html>'),
  getAppBaseUrl: vi.fn(() => 'http://localhost:3000'),
}));

import { PATCH } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notificationService } from '@/services/notification-service';

const ctx = { params: Promise.resolve({ meetingId: 'm1' }) };
const req = (body: unknown) =>
  new Request('http://localhost/api/meetings/m1', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

const pendingMeeting = {
  id: 'm1',
  requesterId: 'requester1',
  receiverId: 'receiver1',
  status: 'PENDING',
  proposedTime: new Date(Date.now() + 86_400_000),
  agenda: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.user.findUnique as any).mockResolvedValue({ name: 'Someone' });
});

describe('PATCH /api/meetings/[meetingId]', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await PATCH(req({ status: 'ACCEPTED' }) as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('404 when the meeting does not exist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'receiver1' } });
    (prisma.meeting.findUnique as any).mockResolvedValue(null);
    const res = await PATCH(req({ status: 'ACCEPTED' }) as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('403 when the caller is neither requester nor receiver', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'random-user' } });
    (prisma.meeting.findUnique as any).mockResolvedValue(pendingMeeting);
    const res = await PATCH(req({ status: 'ACCEPTED' }) as any, ctx as any);
    expect(res.status).toBe(403);
  });

  it('403 when the requester tries to accept their own meeting', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'requester1' } });
    (prisma.meeting.findUnique as any).mockResolvedValue(pendingMeeting);
    const res = await PATCH(req({ status: 'ACCEPTED' }) as any, ctx as any);
    expect(res.status).toBe(403);
  });

  it('403 when the receiver tries to cancel', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'receiver1' } });
    (prisma.meeting.findUnique as any).mockResolvedValue(pendingMeeting);
    const res = await PATCH(req({ status: 'CANCELLED' }) as any, ctx as any);
    expect(res.status).toBe(403);
  });

  it('400 when the meeting is no longer PENDING', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'receiver1' } });
    (prisma.meeting.findUnique as any).mockResolvedValue({ ...pendingMeeting, status: 'ACCEPTED' });
    const res = await PATCH(req({ status: 'REJECTED' }) as any, ctx as any);
    expect(res.status).toBe(400);
    expect(prisma.meeting.update).not.toHaveBeenCalled();
  });

  it('200 lets the receiver accept and notifies + emails the requester', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'receiver1' } });
    (prisma.meeting.findUnique as any).mockResolvedValue(pendingMeeting);
    (prisma.meeting.update as any).mockResolvedValue({ ...pendingMeeting, status: 'ACCEPTED' });
    (prisma.user.findUnique as any)
      .mockResolvedValueOnce({ name: 'Receiver' })
      .mockResolvedValueOnce({ email: 'requester@example.com' });
    const res = await PATCH(req({ status: 'ACCEPTED' }) as any, ctx as any);
    expect(res.status).toBe(200);
    expect(notificationService.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'requester1', type: 'MEETING_INVITE' }),
    );
  });

  it('200 lets the requester cancel a pending meeting', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'requester1' } });
    (prisma.meeting.findUnique as any).mockResolvedValue(pendingMeeting);
    (prisma.meeting.update as any).mockResolvedValue({ ...pendingMeeting, status: 'CANCELLED' });
    const res = await PATCH(req({ status: 'CANCELLED' }) as any, ctx as any);
    expect(res.status).toBe(200);
    expect(notificationService.create).not.toHaveBeenCalled();
  });
});

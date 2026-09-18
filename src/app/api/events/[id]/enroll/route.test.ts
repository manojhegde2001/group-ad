import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: { findFirst: vi.fn(), update: vi.fn() },
    eventEnrollment: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    user: { findUnique: vi.fn(), findMany: vi.fn() },
    notification: { create: vi.fn(), createMany: vi.fn() },
  },
}));
vi.mock('@/lib/mailer', () => ({
  sendMail: vi.fn(() => Promise.resolve()),
  enrollmentConfirmationEmail: vi.fn(() => '<html></html>'),
  enrollmentApprovalEmail: vi.fn(() => '<html></html>'),
  getAppBaseUrl: vi.fn(() => 'http://localhost:3000'),
}));
vi.mock('@/lib/socket-service', () => ({ socketService: { notifyUser: vi.fn() } }));

import { POST, DELETE } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ctx = { params: Promise.resolve({ id: 'e1' }) };
const postReq = () => new Request('http://localhost/api/events/e1/enroll', { method: 'POST' });
const deleteReq = () => new Request('http://localhost/api/events/e1/enroll', { method: 'DELETE' });

const openEvent = {
  id: 'e1',
  title: 'Networking Night',
  status: 'PUBLISHED',
  targetUserTypes: [],
  targetCategoryIds: [],
  maxAttendees: null,
  currentAttendees: 0,
  categoryLimits: null,
  startDate: new Date(),
  endDate: new Date(),
  organizer: { id: 'organizer1' },
};

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.user.findUnique as any).mockResolvedValue({ email: 'jane@example.com', name: 'Jane' });
  (prisma.user.findMany as any).mockResolvedValue([]);
  (prisma.notification.create as any).mockResolvedValue({ id: 'n1', message: 'hi' });
  (prisma.notification.createMany as any).mockResolvedValue({ count: 0 });
});

describe('POST /api/events/[id]/enroll', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(postReq() as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('404 when the event does not exist or is not PUBLISHED', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.event.findFirst as any).mockResolvedValue(null);
    const res = await POST(postReq() as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('409 when already enrolled', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.event.findFirst as any).mockResolvedValue(openEvent);
    (prisma.eventEnrollment.findUnique as any).mockResolvedValue({ id: 'existing' });
    const res = await POST(postReq() as any, ctx as any);
    expect(res.status).toBe(409);
  });

  it('403 when the viewer’s userType is not in targetUserTypes', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.event.findFirst as any).mockResolvedValue({ ...openEvent, targetUserTypes: ['BUSINESS'] });
    (prisma.eventEnrollment.findUnique as any).mockResolvedValue(null);
    (prisma.user.findUnique as any).mockResolvedValueOnce({ userType: 'INDIVIDUAL' });
    const res = await POST(postReq() as any, ctx as any);
    expect(res.status).toBe(403);
  });

  it('403 when the viewer’s category is not in targetCategoryIds', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.event.findFirst as any).mockResolvedValue({ ...openEvent, targetCategoryIds: ['cat1'] });
    (prisma.eventEnrollment.findUnique as any).mockResolvedValue(null);
    (prisma.user.findUnique as any).mockResolvedValueOnce({ categoryId: 'cat2' });
    const res = await POST(postReq() as any, ctx as any);
    expect(res.status).toBe(403);
  });

  it('422 when the per-category quota is exhausted', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.event.findFirst as any).mockResolvedValue({
      ...openEvent,
      categoryLimits: [{ categoryId: 'cat1', categoryName: 'Doctors', limit: 2 }],
    });
    (prisma.eventEnrollment.findUnique as any).mockResolvedValue(null);
    (prisma.user.findUnique as any).mockResolvedValueOnce({ categoryId: 'cat1', category: { name: 'Doctors' } });
    (prisma.eventEnrollment.count as any).mockResolvedValue(2);
    const res = await POST(postReq() as any, ctx as any);
    const json = await res.json();
    expect(res.status).toBe(422);
    expect(json.categoryFull).toBe(true);
  });

  it('201 enrolls directly as APPROVED when there is room', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.event.findFirst as any).mockResolvedValue(openEvent);
    (prisma.eventEnrollment.findUnique as any).mockResolvedValue(null);
    (prisma.eventEnrollment.create as any).mockResolvedValue({ id: 'en1', status: 'APPROVED' });
    const res = await POST(postReq() as any, ctx as any);
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.waitlisted).toBe(false);
    expect(prisma.event.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'e1' }, data: { currentAttendees: { increment: 1 } } }),
    );
  });

  it('201 waitlists (PENDING) once the event is full, without incrementing attendee count', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.event.findFirst as any).mockResolvedValue({ ...openEvent, maxAttendees: 5, currentAttendees: 5 });
    (prisma.eventEnrollment.findUnique as any).mockResolvedValue(null);
    (prisma.eventEnrollment.create as any).mockResolvedValue({ id: 'en1', status: 'PENDING' });
    const res = await POST(postReq() as any, ctx as any);
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.waitlisted).toBe(true);
    expect(prisma.event.update).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/events/[id]/enroll', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('404 when no enrollment is found for the current user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.eventEnrollment.findFirst as any).mockResolvedValue(null);
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('decrements attendee count when withdrawing an APPROVED enrollment with no waitlist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.eventEnrollment.findFirst as any)
      .mockResolvedValueOnce({
        id: 'en1',
        status: 'APPROVED',
        event: { id: 'e1', title: 'Networking Night', organizerId: 'organizer1', startDate: new Date(), endDate: new Date(), meetingLink: null },
      })
      .mockResolvedValueOnce(null); // waitlist lookup returns none
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(200);
    expect(prisma.event.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'e1' }, data: { currentAttendees: { decrement: 1 } } }),
    );
    expect(prisma.eventEnrollment.delete).toHaveBeenCalledWith({ where: { id: 'en1' } });
  });

  it('promotes the next waitlisted user instead of decrementing when withdrawing an APPROVED enrollment', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.eventEnrollment.findFirst as any)
      .mockResolvedValueOnce({
        id: 'en1',
        status: 'APPROVED',
        event: { id: 'e1', title: 'Networking Night', organizerId: 'organizer1', startDate: new Date(), endDate: new Date(), meetingLink: null },
      })
      .mockResolvedValueOnce({
        id: 'en2',
        userId: 'waiting-user',
        user: { id: 'waiting-user', name: 'Waiting User', email: 'wait@example.com' },
      });
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(200);
    expect(prisma.eventEnrollment.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'en2' }, data: expect.objectContaining({ status: 'APPROVED' }) }),
    );
    expect(prisma.event.update).not.toHaveBeenCalled();
  });

  it('deletes the enrollment without touching capacity when withdrawing a PENDING (waitlisted) enrollment', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.eventEnrollment.findFirst as any).mockResolvedValue({
      id: 'en1',
      status: 'PENDING',
      event: { id: 'e1', title: 'Networking Night', organizerId: 'organizer1', startDate: new Date(), endDate: new Date(), meetingLink: null },
    });
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(200);
    expect(prisma.event.update).not.toHaveBeenCalled();
    expect(prisma.eventEnrollment.delete).toHaveBeenCalledWith({ where: { id: 'en1' } });
  });
});

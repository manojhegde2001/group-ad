import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { notificationService } from '@/services/notification-service';
import { sendMail, meetingInviteEmail, getAppBaseUrl } from '@/lib/mailer';
import { format } from 'date-fns';

const createMeetingSchema = z.object({
    receiverId: z.string().min(1, 'Receiver is required'),
    proposedTime: z.string().datetime('Invalid date/time'),
    agenda: z.string().max(250, 'Agenda must be 250 characters or less').optional(),
});

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { userType: true },
        });

        if (!dbUser || (dbUser.userType !== 'BUSINESS' && dbUser.userType !== 'ADMIN')) {
            return NextResponse.json({ error: 'Business account required' }, { status: 403 });
        }

        const userId = session.user.id;
        const take = Number(request.nextUrl.searchParams.get('take')) || 50;
        const skip = Number(request.nextUrl.searchParams.get('skip')) || 0;

        const whereClause = dbUser.userType === 'ADMIN' ? {} : {
            OR: [
                { requesterId: userId },
                { receiverId: userId },
            ],
        };

        const meetings = await prisma.meeting.findMany({
            where: whereClause,
            take,
            skip,
            orderBy: { proposedTime: 'asc' },
        });

        // Collect all unique user IDs to fetch in one query
        const userIds = [...new Set(meetings.flatMap(m => [m.requesterId, m.receiverId]))];
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
                userType: true,
                companyName: true,
                industry: true,
            },
        });
        const userMap = Object.fromEntries(users.map(u => [u.id, u]));

        const enriched = meetings.map(m => ({
            ...m,
            requester: userMap[m.requesterId] || null,
            receiver: userMap[m.receiverId] || null,
        }));

        return NextResponse.json({ meetings: enriched });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { userType: true, name: true, companyName: true },
        });

        if (!dbUser || dbUser.userType !== 'BUSINESS') {
            return NextResponse.json({ error: 'Only Business accounts can request meetings' }, { status: 403 });
        }

        const body = await request.json();
        const data = createMeetingSchema.parse(body);

        if (data.receiverId === session.user.id) {
            return NextResponse.json({ error: 'You cannot request a meeting with yourself' }, { status: 400 });
        }

        // Server-side: proposed time must be in the future
        if (new Date(data.proposedTime) <= new Date()) {
            return NextResponse.json({ error: 'Proposed meeting time must be in the future' }, { status: 400 });
        }

        // Validate receiver exists and is BUSINESS
        const receiver = await prisma.user.findUnique({
            where: { id: data.receiverId },
            select: { id: true, userType: true, name: true, companyName: true },
        });

        if (!receiver) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (receiver.userType !== 'BUSINESS') {
            return NextResponse.json({ error: 'Meetings can only be requested with Business accounts' }, { status: 400 });
        }

        // Check for existing PENDING meeting between these two users
        const existing = await prisma.meeting.findFirst({
            where: {
                OR: [
                    { requesterId: session.user.id, receiverId: data.receiverId, status: 'PENDING' },
                    { requesterId: data.receiverId, receiverId: session.user.id, status: 'PENDING' },
                ],
            },
        });

        if (existing) {
            return NextResponse.json({ error: 'A pending meeting request already exists with this user' }, { status: 409 });
        }

        const meeting = await prisma.meeting.create({
            data: {
                requesterId: session.user.id,
                receiverId: data.receiverId,
                proposedTime: new Date(data.proposedTime),
                agenda: data.agenda,
            },
        });

        const requesterName = dbUser.companyName || dbUser.name;

        // Notify the receiver
        await notificationService.create({
            userId: data.receiverId,
            type: 'MEETING_INVITE',
            title: 'New Meeting Request',
            message: `${requesterName} has requested a 1:1 meeting with you.`,
            entityType: 'meeting',
            entityId: meeting.id,
            senderId: session.user.id,
        });

        // Fetch receiver's email
        const receiverWithEmail = await prisma.user.findUnique({
            where: { id: data.receiverId },
            select: { email: true },
        });

        if (receiverWithEmail?.email) {
            const baseUrl = getAppBaseUrl(request);
            const eventsUrl = `${baseUrl}/events`;
            const formattedDate = format(new Date(data.proposedTime), 'EEEE, MMMM do, yyyy h:mm a');
            
            sendMail({
                to: receiverWithEmail.email,
                subject: `[Vrutta] New 1:1 Meeting Request from ${requesterName}`,
                html: meetingInviteEmail(
                    requesterName,
                    formattedDate,
                    data.agenda,
                    eventsUrl,
                    baseUrl
                ),
            }).catch(mailErr => {
                console.error('Failed to send meeting invite email', mailErr);
            });
        }

        return NextResponse.json({ message: 'Meeting request sent', meeting }, { status: 201 });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create meeting request' }, { status: 500 });
    }
}

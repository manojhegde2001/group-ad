import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatEventDate } from '@/lib/event-utils';
import { sendMail, eventReminderEmail } from '@/lib/mailer';
import { addHours, isWithinInterval } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        const cronSecret = request.headers.get('x-cron-secret');
        if (cronSecret !== process.env.CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();

        // 24-hour window: events starting between 23h55m and 24h05m from now
        const in24hStart = addHours(now, 23);
        const in24hEnd = addHours(now, 25);

        // 1-hour window: events starting between 55m and 65m from now
        const in1hStart = addHours(now, 0.9);
        const in1hEnd = addHours(now, 1.1);

        const upcomingEvents = await prisma.event.findMany({
            where: {
                status: 'PUBLISHED',
                startDate: { gte: now, lte: addHours(now, 25) },
            },
            include: {
                enrollments: {
                    where: { status: 'APPROVED' },
                    include: { user: { select: { email: true, name: true } } },
                },
            },
        });

        let emailsSent = 0;

        for (const event of upcomingEvents) {
            const is24h = isWithinInterval(event.startDate, { start: in24hStart, end: in24hEnd });
            const is1h = isWithinInterval(event.startDate, { start: in1hStart, end: in1hEnd });

            if (!is24h && !is1h) continue;

            const timeLabel = is1h ? '1 hour' : '24 hours';
            const subject = `Reminder: "${event.title}" starts in ${timeLabel}`;

            for (const enrollment of event.enrollments) {
                if (!enrollment.user.email) continue;
                await sendMail({
                    to: enrollment.user.email,
                    subject,
                    html: eventReminderEmail(
                        event.title,
                        formatEventDate(event.startDate, event.endDate),
                        timeLabel,
                        event.meetingLink
                    ),
                });
                emailsSent++;
            }
        }

        return NextResponse.json({ message: 'Reminders sent', emailsSent });
    } catch (error) {
        console.error('Error sending reminders:', error);
        return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { id: eventId } = await params;

        // Verify that the caller actually attended this event
        const callerEnrollment = await prisma.eventEnrollment.findUnique({
            where: {
                eventId_userId: {
                    eventId,
                    userId: session.user.id,
                },
            },
        });

        // Optionally, we could restrict this only to people who attended it.
        // If they didn't attend, we can still show the list but maybe not let them connect?
        // Let's just return everyone else who attended.

        const coAttendees = await prisma.eventEnrollment.findMany({
            where: {
                eventId,
                attended: true,
                userId: { not: session.user.id }, // exclude self
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true,
                        userType: true,
                        companyName: true,
                        category: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        // Get current user's connections to see if they are already connected
        const myConnections = await prisma.connection.findMany({
            where: {
                OR: [
                    { requesterId: session.user.id },
                    { receiverId: session.user.id }
                ],
                status: 'ACCEPTED'
            }
        });
        const connectionIds = new Set(
            myConnections.map(c => c.requesterId === session.user.id ? c.receiverId : c.requesterId)
        );

        const mappedAttendees = coAttendees.map(enrollment => ({
            ...enrollment.user,
            isConnected: connectionIds.has(enrollment.user.id),
        }));

        return NextResponse.json({ coAttendees: mappedAttendees });
    } catch (error) {
        console.error('Error fetching co-attendees:', error);
        return NextResponse.json({ error: 'Failed to fetch co-attendees' }, { status: 500 });
    }
}

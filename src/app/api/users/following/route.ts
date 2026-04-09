import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/users/following — List users current user is following
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const follows = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                following: {
                    select: {
                        following: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                avatar: true,
                                userType: true,
                            }
                        }
                    }
                }
            }
        });

        const users = follows?.following.map((f: any) => f.following) || [];

        return NextResponse.json({ users });
    } catch (error) {
        console.error('Error fetching following list:', error);
        return NextResponse.json({ error: 'Failed to fetch following list' }, { status: 500 });
    }
}

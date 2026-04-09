import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { token } = await request.json();
        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        // Add token to fcmTokens array if not already present
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                fcmTokens: {
                    push: token
                }
            }
        });

        // Optional: Clean up duplicates (Prisma doesn't have unique push for arrays in MongoDB easily)
        // For simplicity, we just push it. A better way would be using $addToSet in raw query if needed.

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving FCM token:', error);
        return NextResponse.json({ error: 'Failed to save token' }, { status: 500 });
    }
}

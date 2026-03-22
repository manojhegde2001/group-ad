import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { userType: true }
        });

        if (user?.userType !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const venues = await prisma.venue.findMany({
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({ venues });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch venues' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { userType: true }
        });

        if (user?.userType !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { name, city, state } = await request.json();

        if (!name || !city || !state) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const venue = await prisma.venue.create({
            data: { name, city, state }
        });

        return NextResponse.json({ venue });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create venue' }, { status: 500 });
    }
}

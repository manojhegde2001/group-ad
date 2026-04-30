import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updatePowerTeamSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(1000).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
  logo: z.string().url().optional(),
  banner: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const team = await prisma.powerTeam.findUnique({
      where: { slug },
      include: {
        category: true,
        creator: {
          select: { id: true, name: true, username: true, avatar: true },
        },
        members: {
          include: {
            user: {
              select: { 
                id: true, 
                name: true, 
                username: true, 
                avatar: true, 
                userType: true,
                verificationStatus: true,
                industry: true
              },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Power Team not found' }, { status: 404 });
    }

    return NextResponse.json({ team });
  } catch (error) {
    console.error('Error fetching power team details:', error);
    return NextResponse.json({ error: 'Failed to fetch power team' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const team = await prisma.powerTeam.findUnique({
      where: { slug },
      select: { id: true, creatorId: true },
    });

    if (!team) {
      return NextResponse.json({ error: 'Power Team not found' }, { status: 404 });
    }

    // Authorization check: Only creator or admin
    if (team.creatorId !== session.user.id && (session.user as any).userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updatePowerTeamSchema.parse(body);

    const updatedTeam = await prisma.powerTeam.update({
      where: { id: team.id },
      data: validatedData,
      include: {
        category: true,
      },
    });

    return NextResponse.json({ message: 'Power Team updated successfully', team: updatedTeam });
  } catch (error: any) {
    console.error('Error updating power team:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update power team' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const team = await prisma.powerTeam.findUnique({
      where: { slug },
      select: { id: true, creatorId: true },
    });

    if (!team) {
      return NextResponse.json({ error: 'Power Team not found' }, { status: 404 });
    }

    // Authorization check: Only creator or admin
    if (team.creatorId !== session.user.id && (session.user as any).userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    await prisma.powerTeam.delete({
      where: { id: team.id },
    });

    return NextResponse.json({ message: 'Power Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting power team:', error);
    return NextResponse.json({ error: 'Failed to delete power team' }, { status: 500 });
  }
}

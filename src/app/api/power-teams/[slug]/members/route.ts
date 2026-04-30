import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Fetch team by slug to get ID
    const team = await prisma.powerTeam.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!team) {
      return NextResponse.json({ error: 'Power Team not found' }, { status: 404 });
    }

    // 2. Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, userType: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Constraint: Business users only
    if (user.userType !== 'BUSINESS' && (session.user as any).userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Only business users can join power teams' }, { status: 403 });
    }

    // 3. Check if already in a team
    const existingMembership = await prisma.powerTeamMember.findUnique({
      where: { userId },
    });

    if (existingMembership) {
      return NextResponse.json({ error: 'You are already a member of a power team' }, { status: 400 });
    }

    // 4. Create membership (PENDING by default)
    const membership = await prisma.powerTeamMember.create({
      data: {
        powerTeamId: team.id,
        userId: userId,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ 
      message: 'Join request sent successfully', 
      membership 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error joining power team:', error);
    if (error.code === 'P2002') {
        return NextResponse.json({ error: 'You are already in a Power Team' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to send join request' }, { status: 500 });
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

    // Check if requester is admin of the team or platform admin
    const team = await prisma.powerTeam.findUnique({
      where: { slug },
      select: { id: true, creatorId: true },
    });

    if (!team) {
      return NextResponse.json({ error: 'Power Team not found' }, { status: 404 });
    }

    const isPlatformAdmin = (session.user as any).userType === 'ADMIN';
    const isTeamCreator = team.creatorId === session.user.id;

    const body = await request.json();
    const { memberId, status, role } = z.object({
      memberId: z.string(),
      status: z.enum(['APPROVED', 'REJECTED', 'PENDING']).optional(),
      role: z.enum(['ADMIN', 'MEMBER']).optional(),
    }).parse(body);

    // Only creator or admin can update status/role
    if (!isTeamCreator && !isPlatformAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const updateData: any = {};
    if (status) {
        updateData.status = status;
        if (status === 'APPROVED') {
            updateData.joinedAt = new Date();
        }
    }
    if (role) updateData.role = role;

    const updatedMember = await prisma.powerTeamMember.update({
      where: { id: memberId },
      data: updateData,
    });

    return NextResponse.json({ message: 'Member updated successfully', member: updatedMember });
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
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

    const { memberId } = z.object({ memberId: z.string() }).parse(await request.json());

    const member = await prisma.powerTeamMember.findUnique({
      where: { id: memberId },
      include: { powerTeam: true }
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Authorization: Member themselves, team creator, or platform admin
    const isSelf = member.userId === session.user.id;
    const isTeamCreator = member.powerTeam.creatorId === session.user.id;
    const isPlatformAdmin = (session.user as any).userType === 'ADMIN';

    if (!isSelf && !isTeamCreator && !isPlatformAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    await prisma.powerTeamMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}

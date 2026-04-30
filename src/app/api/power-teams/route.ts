import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createPowerTeamSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  categoryId: z.string().min(1, 'Category is required'),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional().default('PUBLIC'),
  logo: z.string().url().optional(),
  banner: z.string().url().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    // Optional: Filter by category
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [teams, total] = await Promise.all([
      prisma.powerTeam.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            select: { id: true, name: true, slug: true, icon: true },
          },
          creator: {
            select: { id: true, name: true, username: true, avatar: true },
          },
          _count: {
            select: { members: true },
          },
          members: {
            take: 5,
            include: {
              user: {
                select: { id: true, avatar: true, name: true },
              },
            },
            where: {
              status: 'APPROVED',
            },
          },
        },
      }),
      prisma.powerTeam.count({ where }),
    ]);

    return NextResponse.json({
      teams,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching power teams:', error);
    return NextResponse.json({ error: 'Failed to fetch power teams' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true, 
        userType: true, 
        verificationStatus: true,
        powerTeamMemberships: {
          select: { id: true }
        }
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Constraint: Only BUSINESS users
    if (user.userType !== 'BUSINESS' && (session.user as any).userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Only business users can create power teams' }, { status: 403 });
    }

    // Constraint: Only VERIFIED users
    if (user.verificationStatus !== 'VERIFIED' && (session.user as any).userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Your account must be verified to create a power team' }, { status: 403 });
    }

    // Constraint: Only one team membership allowed
    if (user.powerTeamMemberships.length > 0 && (session.user as any).userType !== 'ADMIN') {
      return NextResponse.json({ error: 'You are already a member of a power team' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = createPowerTeamSchema.parse(body);

    // Create slug from name
    const slug = validatedData.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Check if slug exists
    const existingTeam = await prisma.powerTeam.findUnique({ where: { slug } });
    const finalSlug = existingTeam ? `${slug}-${Math.floor(Math.random() * 1000)}` : slug;

    const team = await prisma.powerTeam.create({
      data: {
        name: validatedData.name,
        slug: finalSlug,
        description: validatedData.description,
        categoryId: validatedData.categoryId,
        visibility: validatedData.visibility,
        logo: validatedData.logo,
        banner: validatedData.banner,
        creatorId: user.id,
        members: {
          create: {
            userId: user.id,
            role: 'ADMIN',
            status: 'APPROVED',
            joinedAt: new Date(),
          },
        },
      },
      include: {
        category: true,
        _count: {
          select: { members: true },
        },
      },
    });

    return NextResponse.json({ message: 'Power Team created successfully', team }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating power team:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    // Handle P2002 (Unique constraint failed)
    if (error.code === 'P2002') {
        return NextResponse.json({ error: 'You are already in a Power Team' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create power team' }, { status: 500 });
  }
}

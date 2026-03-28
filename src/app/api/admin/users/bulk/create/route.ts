import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { users } = await req.json();

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: 'Expected a non-empty array of users' }, { status: 400 });
    }

    // Final security check: Re-verify uniqueness before insertion to prevent race conditions
    const emails = users.map(u => u.email);
    const usernames = users.map(u => u.username);

    const duplicates = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { in: emails } },
          { username: { in: usernames } }
        ]
      }
    });

    if (duplicates) {
      return NextResponse.json({ error: 'One or more users already exist' }, { status: 400 });
    }

    // Hash passwords and prepare data
    const usersToCreate = await Promise.all(users.map(async (u) => ({
      name: u.name,
      username: u.username.toLowerCase(),
      email: u.email.toLowerCase(),
      password: await bcrypt.hash(u.password, 10),
      userType: (u.userType || 'INDIVIDUAL') as any,
      categoryId: u.categoryId || null,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`,
      verificationStatus: (u.userType === 'BUSINESS' ? 'VERIFIED' : 'UNVERIFIED') as any,
      onboardingStep: 'PROFILE_COMPLETED' as any,
    })));

    // Insert
    await prisma.user.createMany({
      data: usersToCreate,
    });

    return NextResponse.json({ 
      success: true, 
      count: usersToCreate.length,
      message: `Successfully created ${usersToCreate.length} users` 
    });
  } catch (error) {
    console.error('Bulk creation error:', error);
    return NextResponse.json({ error: 'Failed to create users' }, { status: 500 });
  }
}

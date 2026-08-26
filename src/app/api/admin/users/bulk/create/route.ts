import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendMail, bulkAccountCreatedEmail, getAppBaseUrl } from '@/lib/mailer';
import { logger } from '@/lib/logger';
import { bulkCreateUsersSchema } from '@/lib/validations/admin';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { users } = bulkCreateUsersSchema.parse(body);

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
      onboardingStep: 'PROFILE_COMPLETED' as any,
    })));

    // Insert
    await prisma.user.createMany({
      data: usersToCreate,
    });
    
    const baseUrl = getAppBaseUrl(req);

    // Send Onboarding Emails (Asynchronous)
    // Note: In production with large batches, this should be moved to a background job
    usersToCreate.forEach(async (u) => {
      try {
        await sendMail({
          to: u.email,
          subject: 'Your Account is Ready - Vrutta',
          html: bulkAccountCreatedEmail(u.name, u.username, u.email, baseUrl),
        });
      } catch (err) {
        logger.error(`Failed to send onboarding email to ${u.email}`, err);
      }
    });

    return NextResponse.json({ 
      success: true, 
      count: usersToCreate.length,
      message: `Successfully created ${usersToCreate.length} users and queued welcome emails` 
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    logger.error('Bulk creation error', error);
    return NextResponse.json({ error: 'Failed to create users' }, { status: 500 });
  }
}

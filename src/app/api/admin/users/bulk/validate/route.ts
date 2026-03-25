import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(2, "Name too short"),
  username: z.string().min(3, "Username too short").regex(/^[a-zA-Z0-9_]+$/, "Invalid username"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password too short"),
  userType: z.enum(['INDIVIDUAL', 'BUSINESS']).default('INDIVIDUAL'),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { users } = await req.json();

    if (!Array.isArray(users)) {
      return NextResponse.json({ error: 'Expected an array of users' }, { status: 400 });
    }

    // Extraction for bulk checking
    const emails = users.map(u => u.email).filter(Boolean);
    const usernames = users.map(u => u.username).filter(Boolean);

    // Find existing
    const existingUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { in: emails } },
          { username: { in: usernames } }
        ]
      },
      select: { email: true, username: true }
    });

    const existingEmails = new Set(existingUsers.map(u => u.email));
    const existingUsernames = new Set(existingUsers.map(u => u.username));

    const results = users.map((user, index) => {
      const errors: string[] = [];
      
      const validation = userSchema.safeParse(user);
      if (!validation.success) {
         validation.error.errors.forEach(e => errors.push(e.message));
      }

      if (existingEmails.has(user.email)) errors.push("Email already exists");
      if (existingUsernames.has(user.username)) errors.push("Username already taken");

      return {
        ...user,
        isValid: errors.length === 0,
        errors,
        index
      };
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Bulk validate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = file.name.split('.').pop();
    const filename = `${session.user.id}-${uniqueSuffix}.${ext}`;

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars');

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;
    
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        avatar: avatarUrl,
        onboardingStep: 'PROFILE_PICTURE_UPLOADED',
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatar: true,
        onboardingStep: true,
      },
    });

    return NextResponse.json({
      success: true,
      avatar: avatarUrl,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}

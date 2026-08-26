import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadToS3, isS3Configured, getMissingS3Config } from '@/lib/s3';
import { optimizeImage } from '@/lib/media-optimize';
import { isAllowedImageType } from '@/lib/upload-validation';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isS3Configured()) {
      return NextResponse.json({ error: `S3 not configured. Missing: ${getMissingS3Config().join(', ')}` }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!isAllowedImageType(file.type)) {
      return NextResponse.json({ error: `Unsupported file type: ${file.type || 'unknown'}` }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const { buffer, contentType, extension } = await optimizeImage(rawBuffer, file.type, {
      maxWidth: 512,
      maxHeight: 512,
      fit: 'cover',
      quality: 85,
    });

    const key = `group-ad/avatars/avatar-${session.user.id}.${extension}`;

    // Cache-bust the CDN/browser cache since the key is stable across re-uploads
    const avatarUrl = `${await uploadToS3(key, buffer, contentType)}?v=${Date.now()}`;

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
    logger.error('Avatar upload error', error);
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }
}

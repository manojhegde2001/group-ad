import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadToS3, isS3Configured, getMissingS3Config } from '@/lib/s3';
import { optimizeImage } from '@/lib/media-optimize';
import { isAllowedImageType } from '@/lib/upload-validation';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!isS3Configured()) {
      return NextResponse.json({ error: `S3 not configured. Missing: ${getMissingS3Config().join(', ')}` }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;
    const categoryId = formData.get('categoryId') as string; // Optional: if editing existing

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
    const { buffer, contentType, extension } = await optimizeImage(rawBuffer, file.type, { maxWidth: 1600, quality: 82 });

    const timestamp = Date.now();
    const key = `group-ad/categories/banners/${categoryId ? `banner-${categoryId}-${timestamp}` : `banner-new-${timestamp}`}.${extension}`;

    const bannerUrl = await uploadToS3(key, buffer, contentType);

    return NextResponse.json({
      success: true,
      bannerUrl,
    });
  } catch (error) {
    logger.error('Banner upload error', error);
    return NextResponse.json({ error: 'Failed to upload banner' }, { status: 500 });
  }
}

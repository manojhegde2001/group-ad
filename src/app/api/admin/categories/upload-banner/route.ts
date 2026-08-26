import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadToS3, isS3Configured, getMissingS3Config } from '@/lib/s3';

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

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const timestamp = Date.now();
    const extension = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
    const key = `group-ad/categories/banners/${categoryId ? `banner-${categoryId}-${timestamp}` : `banner-new-${timestamp}`}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const bannerUrl = await uploadToS3(key, buffer, file.type);

    return NextResponse.json({
      success: true,
      bannerUrl,
    });
  } catch (error) {
    console.error('Banner upload error:', error);
    return NextResponse.json({ error: 'Failed to upload banner' }, { status: 500 });
  }
}

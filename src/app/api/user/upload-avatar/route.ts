import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 });
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

    // Generate Cloudinary signed upload params
    const timestamp = Math.round(Date.now() / 1000);
    const folder = `group-ad/avatars`;
    const publicId = `avatar-${session.user.id}`;

    const paramsToSign: Record<string, string | number> = {
      folder,
      public_id: publicId,
      timestamp,
    };

    // Build the signature string: alphabetically sorted key=value pairs joined by &
    const signatureString =
      Object.keys(paramsToSign)
        .sort()
        .map((key) => `${key}=${paramsToSign[key]}`)
        .join('&') + apiSecret;

    const signature = crypto.createHash('sha256').update(signatureString).digest('hex');

    // Upload to Cloudinary
    const cloudinaryForm = new FormData();
    cloudinaryForm.append('file', file);
    cloudinaryForm.append('api_key', apiKey);
    cloudinaryForm.append('timestamp', String(timestamp));
    cloudinaryForm.append('signature', signature);
    cloudinaryForm.append('folder', folder);
    cloudinaryForm.append('public_id', publicId);
    // Overwrite existing avatar with the same public_id
    cloudinaryForm.append('overwrite', 'true');
    cloudinaryForm.append('invalidate', 'true');

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const res = await fetch(uploadUrl, {
      method: 'POST',
      body: cloudinaryForm,
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('Cloudinary avatar upload error:', err);
      return NextResponse.json({ error: err.error?.message || 'Upload failed' }, { status: 500 });
    }

    const data = await res.json();
    const avatarUrl = data.secure_url;

    // Persist the Cloudinary URL to the database
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
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }
}

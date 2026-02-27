import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
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
        const file = formData.get('file') as File;
        const resourceType = (formData.get('resource_type') as string) || 'image';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Size limits: 25MB images, 100MB videos
        const maxSize = resourceType === 'video' ? 100 * 1024 * 1024 : 25 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: `File too large. Max ${resourceType === 'video' ? '100MB' : '25MB'}` },
                { status: 400 }
            );
        }

        // Generate signature for signed upload (no upload preset needed)
        const timestamp = Math.round(Date.now() / 1000);
        const folder = `group-ad/posts/${session.user.id}`;

        const paramsToSign: Record<string, string | number> = {
            folder,
            timestamp,
        };

        // Build the string to sign: alphabetically sorted key=value pairs joined by &
        const signatureString =
            Object.keys(paramsToSign)
                .sort()
                .map((key) => `${key}=${paramsToSign[key]}`)
                .join('&') + apiSecret;

        const signature = crypto.createHash('sha256').update(signatureString).digest('hex');

        // Build upload form for Cloudinary signed upload
        const cloudinaryFormData = new FormData();
        cloudinaryFormData.append('file', file);
        cloudinaryFormData.append('api_key', apiKey);
        cloudinaryFormData.append('timestamp', String(timestamp));
        cloudinaryFormData.append('signature', signature);
        cloudinaryFormData.append('folder', folder);

        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

        const res = await fetch(uploadUrl, {
            method: 'POST',
            body: cloudinaryFormData,
        });

        if (!res.ok) {
            const err = await res.json();
            console.error('Cloudinary error:', err);
            return NextResponse.json({ error: err.error?.message || 'Upload failed' }, { status: 500 });
        }

        const data = await res.json();

        return NextResponse.json({
            url: data.secure_url,
            publicId: data.public_id,
            resourceType: data.resource_type,
            width: data.width,
            height: data.height,
            duration: data.duration, // for video
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}

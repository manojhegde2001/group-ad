import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (!cloudName || !uploadPreset) {
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

        // Build upload form for Cloudinary
        const cloudinaryFormData = new FormData();
        cloudinaryFormData.append('file', file);
        cloudinaryFormData.append('upload_preset', uploadPreset);
        cloudinaryFormData.append('folder', `group-ad/posts/${session.user.id}`);

        // If API secret available, sign request (optional but better)
        if (apiKey) {
            cloudinaryFormData.append('api_key', apiKey);
        }

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

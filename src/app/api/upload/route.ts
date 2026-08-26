import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import crypto from 'crypto';
import { uploadToS3, isS3Configured, getMissingS3Config } from '@/lib/s3';
import { optimizeImage, optimizeVideo } from '@/lib/media-optimize';

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

        const rawBuffer = Buffer.from(await file.arrayBuffer());

        const { buffer, contentType, extension } =
            resourceType === 'video'
                ? await optimizeVideo(rawBuffer)
                : await optimizeImage(rawBuffer, file.type, { maxWidth: 1920, quality: 82 });

        const key = `group-ad/posts/${session.user.id}/${crypto.randomUUID()}.${extension}`;

        const url = await uploadToS3(key, buffer, contentType);

        return NextResponse.json({
            url,
            resourceType,
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}

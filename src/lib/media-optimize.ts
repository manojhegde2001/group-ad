import sharp, { FitEnum } from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import crypto from 'crypto';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Animated formats can't be safely resized/recompressed by sharp (GIF would
// lose its animation), so pass them through as-is. Note: SVG is deliberately
// NOT passed through here — SVG can embed <script> and is a stored-XSS
// vector when served back with an image/svg+xml content type, and nothing
// in the app's upload UI actually offers SVG uploads.
const PASSTHROUGH_IMAGE_TYPES = new Set(['image/gif']);

interface OptimizedMedia {
  buffer: Buffer;
  contentType: string;
  extension: string;
  /** Intrinsic pixel dimensions of the output image, when known. */
  width?: number;
  height?: number;
}

interface OptimizeImageOptions {
  maxWidth: number;
  maxHeight?: number;
  quality?: number;
  fit?: keyof FitEnum;
}

export async function optimizeImage(buffer: Buffer, mimeType: string, options: OptimizeImageOptions): Promise<OptimizedMedia> {
  if (PASSTHROUGH_IMAGE_TYPES.has(mimeType)) {
    const { width, height } = await sharp(buffer).metadata().catch(() => ({ width: undefined, height: undefined }));
    return {
      buffer,
      contentType: mimeType,
      extension: mimeType === 'image/svg+xml' ? 'svg' : 'gif',
      width,
      height,
    };
  }

  const { data, info } = await sharp(buffer)
    .rotate()
    .resize({
      width: options.maxWidth,
      height: options.maxHeight,
      fit: options.fit ?? 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: options.quality ?? 82 })
    .toBuffer({ resolveWithObject: true });

  return { buffer: data, contentType: 'image/webp', extension: 'webp', width: info.width, height: info.height };
}

export async function optimizeVideo(buffer: Buffer, maxWidth = 1280): Promise<OptimizedMedia> {
  const dir = await mkdtemp(path.join(tmpdir(), 'vrutta-video-'));
  const inputPath = path.join(dir, `input-${crypto.randomUUID()}`);
  const outputPath = path.join(dir, `output-${crypto.randomUUID()}.mp4`);

  try {
    await writeFile(inputPath, buffer);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions(['-crf 28', '-preset veryfast', '-movflags +faststart'])
        .videoFilters(`scale='min(${maxWidth},iw)':-2`)
        .on('end', () => resolve())
        .on('error', reject)
        .save(outputPath);
    });

    const optimized = await readFile(outputPath);
    return { buffer: optimized, contentType: 'video/mp4', extension: 'mp4' };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

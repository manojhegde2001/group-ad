'use client';

import Image, { ImageProps } from 'next/image';
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary-utils';
import { cn } from '@/lib/utils';

interface CloudinaryImageProps extends Omit<ImageProps, 'src'> {
  src: string | null | undefined;
  enhance?: boolean;
  crop?: string;
}

// Cap applied to fill-mode images that don't specify a width, so the CDN never
// ships a full-resolution original for what's usually a small/medium container.
// crop stays 'limit', so this only shrinks oversized originals — never upscales.
const FILL_MAX_WIDTH = 1024;

export function CloudinaryImage({
  src,
  alt,
  enhance = false,
  crop = 'limit',
  className,
  width,
  height,
  fill,
  sizes,
  priority,
  ...props
}: CloudinaryImageProps) {
  if (!src) {
    return (
      <div
        className={cn(
          "bg-secondary-100 dark:bg-secondary-800 animate-pulse flex items-center justify-center",
          fill ? "absolute inset-0 w-full h-full" : "",
          className
        )}
        style={!fill ? { width: width, height: height } : undefined}
      >
        <span className="text-secondary-400 text-[10px] uppercase font-bold">No Image</span>
      </div>
    );
  }

  if (!fill) {
    // Fixed-size usage (avatars, logos, etc.): Cloudinary already returns the exact
    // pixel size requested, so there's nothing for Next's optimizer to add.
    const optimizedSrc = getOptimizedCloudinaryUrl(src, {
      width: width as number,
      height: height as number,
      enhance,
      crop,
    });

    return (
      <Image
        src={optimizedSrc}
        alt={alt || ''}
        width={width}
        height={height}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        className={cn("object-cover", className)}
        unoptimized={true}
        {...props}
      />
    );
  }

  // Fill usage (feed/masonry cards, etc.): let Next.js ask this loader for the width it
  // actually needs per breakpoint (from `sizes` + its device-size table) instead of always
  // shipping one FILL_MAX_WIDTH-wide image to every viewport, including small mobile ones.
  const cloudinaryLoader = ({ width: requestedWidth, quality }: { src: string; width: number; quality?: number }) =>
    getOptimizedCloudinaryUrl(src, {
      width: Math.min(requestedWidth, FILL_MAX_WIDTH),
      quality: quality ?? 'auto',
      enhance,
      crop,
    });

  return (
    <Image
      src={src}
      alt={alt || ''}
      fill
      sizes={sizes || "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 25vw, 20vw"}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      className={cn("object-cover", className)}
      loader={cloudinaryLoader}
      {...props}
    />
  );
}

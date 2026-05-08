'use client';

import Image, { ImageProps } from 'next/image';
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary-utils';
import { cn } from '@/lib/utils';

interface CloudinaryImageProps extends Omit<ImageProps, 'src'> {
  src: string | null | undefined;
  enhance?: boolean;
  crop?: string;
}

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
  // Generate optimized URL
  // If fill is true, we don't pass width/height to the utility to keep it responsive via Next.js
  const optimizedSrc = getOptimizedCloudinaryUrl(src, {
    width: fill ? undefined : (width as number),
    height: fill ? undefined : (height as number),
    enhance,
    crop,
  });

  if (!optimizedSrc) {
    return (
      <div 
        className={cn(
          "bg-secondary-100 dark:bg-secondary-800 animate-pulse flex items-center justify-center",
          className
        )}
        style={{ width: width, height: height }}
      >
        <span className="text-secondary-400 text-[10px] uppercase font-bold">No Image</span>
      </div>
    );
  }

  // Generate blur placeholder URL
  const blurSrc = getOptimizedCloudinaryUrl(src, {
    width: 40,
    height: 40,
    blur: 1000,
    quality: 20,
  });

  return (
    <Image
      src={optimizedSrc}
      alt={alt || ''}
      width={width}
      height={height}
      fill={fill}
      sizes={sizes || (fill ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" : undefined)}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      placeholder={blurSrc ? "blur" : "empty"}
      blurDataURL={blurSrc}
      className={cn("object-cover", className)}
      {...props}
    />
  );
}

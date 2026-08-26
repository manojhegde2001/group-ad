'use client';

import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

interface AppImageProps extends Omit<ImageProps, 'src'> {
  src: string | null | undefined;
}

export function AppImage({
  src,
  alt,
  className,
  width,
  height,
  fill,
  sizes,
  priority,
  ...props
}: AppImageProps) {
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

  // Local preview URLs (during upload, before the file has a real remote URL) can't be
  // fetched by Next's image optimizer, so skip optimization for those.
  const isLocalPreview = src.startsWith('blob:') || src.startsWith('data:');

  if (!fill) {
    return (
      <Image
        src={src}
        alt={alt || ''}
        width={width}
        height={height}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        className={cn("object-cover", className)}
        unoptimized={isLocalPreview}
        {...props}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt || ''}
      fill
      sizes={sizes || "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 25vw, 20vw"}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      className={cn("object-cover", className)}
      unoptimized={isLocalPreview}
      {...props}
    />
  );
}

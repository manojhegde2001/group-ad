'use client';

import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary-utils';
import { cn } from '@/lib/utils';
import { VideoHTMLAttributes } from 'react';

interface CloudinaryVideoProps extends Omit<VideoHTMLAttributes<HTMLVideoElement>, 'src'> {
  src: string | null | undefined;
}

export function CloudinaryVideo({
  src,
  className,
  autoPlay = false,
  muted = false,
  loop = false,
  playsInline = true,
  controls = true,
  ...props
}: CloudinaryVideoProps) {
  const optimizedSrc = getOptimizedCloudinaryUrl(src, {
    resourceType: 'video',
  });

  if (!optimizedSrc) {
    return (
      <div className={cn("bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center aspect-video", className)}>
        <span className="text-secondary-400 text-[10px] uppercase font-bold">No Video</span>
      </div>
    );
  }

  return (
    <video
      src={optimizedSrc}
      className={cn("w-full h-auto block", className)}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      playsInline={playsInline}
      controls={controls}
      preload="metadata"
      {...props}
    />
  );
}

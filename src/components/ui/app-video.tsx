'use client';

import { cn } from '@/lib/utils';
import { VideoHTMLAttributes } from 'react';

interface AppVideoProps extends Omit<VideoHTMLAttributes<HTMLVideoElement>, 'src'> {
  src: string | null | undefined;
}

export function AppVideo({
  src,
  className,
  autoPlay = false,
  muted = false,
  loop = false,
  playsInline = true,
  controls = true,
  ...props
}: AppVideoProps) {
  if (!src) {
    return (
      <div className={cn("bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center aspect-video", className)}>
        <span className="text-secondary-400 text-[10px] uppercase font-bold">No Video</span>
      </div>
    );
  }

  return (
    <video
      src={src}
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

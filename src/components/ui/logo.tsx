import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    <div className={cn('text-2xl font-bold text-primary', className)}>
      YourApp
    </div>
  );
}

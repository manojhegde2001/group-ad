'use client';

import Masonry from 'react-masonry-css';

interface MasonryLayoutProps {
  children: React.ReactNode;
}

export function MasonryLayout({ children }: MasonryLayoutProps) {
  const breakpointColumns = {
    default: 4,
    1536: 4,
    1280: 3,
    1024: 3,
    768: 2,
    640: 1,
  };

  return (
    <Masonry
      breakpointCols={breakpointColumns}
      className="flex -ml-6 w-auto"
      columnClassName="pl-6 bg-clip-padding"
    >
      {children}
    </Masonry>
  );
}

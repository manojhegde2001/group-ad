'use client';

import { Tooltip as RizzuiTooltip } from 'rizzui';

interface TooltipProps {
  children: React.ReactElement;
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  color?: 'primary' | 'secondary' | 'danger' | 'invert';
  size?: 'sm' | 'md' | 'lg';
  showArrow?: boolean;
  className?: string;
  arrowClassName?: string;
}

export function Tooltip({
  children,
  content,
  placement = 'top',
  color = 'invert',
  size = 'md',
  showArrow = true,
  className,
  arrowClassName,
}: TooltipProps) {
  return (
    <RizzuiTooltip
      content={content}
      placement={placement}
      color={color}
      size={size}
      showArrow={showArrow}
      className={className}
      arrowClassName={arrowClassName}
    >
      {children}
    </RizzuiTooltip>
  );
}

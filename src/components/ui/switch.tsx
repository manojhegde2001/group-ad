'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, disabled, ...props }, ref) => {
    return (
      <label className={cn("relative inline-flex items-center cursor-pointer", disabled && "opacity-50 cursor-not-allowed", className)}>
        <input type="checkbox" className="sr-only peer" disabled={disabled} ref={ref} {...props} />
        <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
      </label>
    );
  }
);
Switch.displayName = 'Switch';

export { Switch };

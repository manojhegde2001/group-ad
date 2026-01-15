'use client';

import { Password as RizzuiPassword } from 'rizzui';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface PasswordProps {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'outline' | 'flat' | 'text';
  color?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'pill';
  prefix?: React.ReactNode;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  autoComplete?: string;
  className?: string;
}

export const Password = forwardRef<HTMLInputElement, PasswordProps>(
  (
    {
      label,
      error,
      helperText,
      variant = 'outline',
      color = 'primary',
      size = 'md',
      rounded = 'md',
      prefix,
      className,
      required,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium mb-1.5 text-foreground">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <RizzuiPassword
          ref={ref}
          variant={variant}
          color={error ? 'danger' : color}
          size={size}
          rounded={rounded}
          prefix={prefix}
          className={cn(className)}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
        {!error && helperText && (
          <p className="mt-1.5 text-sm text-secondary-600 dark:text-secondary-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Password.displayName = 'Password';

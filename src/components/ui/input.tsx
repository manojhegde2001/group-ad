'use client';

import { Input as RizzuiInput } from 'rizzui';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

type RizzuiInputType = 'text' | 'email' | 'number' | 'tel' | 'search' | 'url' | 'time' | 'date' | 'datetime-local' | 'month' | 'week';

interface InputProps {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'outline' | 'flat' | 'text';
  color?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'pill';
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  type?: RizzuiInputType;
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  name?: string;
  id?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  minLength?: number;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  pattern?: string;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
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
      suffix,
      clearable = false,
      onClear,
      className,
      required,
      type = 'text',
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
        <RizzuiInput
          ref={ref}
          type={type}
          variant={variant}
          color={error ? 'danger' : color}
          size={size}
          rounded={rounded}
          prefix={prefix}
          suffix={suffix}
          clearable={clearable}
          onClear={onClear}
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

Input.displayName = 'Input';

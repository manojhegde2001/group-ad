'use client';

import { Textarea as RizzuiTextarea } from 'rizzui';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface TextareaProps {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'outline' | 'flat' | 'text';
  color?: 'primary' | 'secondary' | 'danger';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'pill';
  textareaClassName?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  rows?: number;
  cols?: number;
  maxLength?: number;
  name?: string;
  id?: string;
  className?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      variant = 'outline',
      color = 'primary',
      rounded = 'md',
      className,
      textareaClassName,
      required,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn('w-full', className)}>
        {label && (
          <label className="block text-sm font-medium mb-1.5 text-foreground">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <RizzuiTextarea
          ref={ref}
          variant={variant}
          color={error ? 'danger' : color}
          rounded={rounded}
          textareaClassName={textareaClassName}
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

Textarea.displayName = 'Textarea';

'use client';

import { Select as RizzuiSelect } from 'rizzui';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface SelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  variant?: 'outline' | 'flat' | 'text';
  color?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'pill';
  disabled?: boolean;
  clearable?: boolean;
  searchable?: boolean;
  required?: boolean;
  name?: string;
  className?: string;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      value,
      onChange,
      placeholder = 'Select...',
      variant = 'outline',
      color = 'primary',
      size = 'md',
      rounded = 'md',
      disabled = false,
      clearable = false,
      searchable = false,
      required = false,
      name,
      className,
    },
    ref
  ) => {
    const handleChange = (selectedValue: unknown) => {
      if (onChange && typeof selectedValue === 'string') {
        onChange(selectedValue);
      }
    };

    return (
      <div className={cn('w-full', className)}>
        {label && (
          <label className="block text-sm font-medium mb-1.5 text-foreground">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <RizzuiSelect
          ref={ref}
          options={options}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          variant={variant}
          color={error ? 'danger' : color}
          size={size}
          rounded={rounded}
          disabled={disabled}
          clearable={clearable}
          searchable={searchable}
          name={name}
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

Select.displayName = 'Select';

'use client';

import { Select as RizzuiSelect } from 'rizzui';
import { cn } from '@/lib/utils';

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

export const Select = ({
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
}: SelectProps) => {
  const handleChange = (selectedValue: unknown) => {
    if (onChange && typeof selectedValue === 'string') {
      onChange(selectedValue);
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium mb-1.5 text-gray-900 dark:text-gray-100">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="[&_.rizzui-select-container]:bg-white [&_.rizzui-select-container]:dark:bg-gray-800 [&_.rizzui-select-container]:border-gray-300 [&_.rizzui-select-container]:dark:border-gray-600 [&_.rizzui-select-trigger]:text-gray-900 [&_.rizzui-select-trigger]:dark:text-gray-100 [&_.rizzui-select-dropdown]:bg-white [&_.rizzui-select-dropdown]:dark:bg-gray-800 [&_.rizzui-select-option]:hover:bg-gray-100 [&_.rizzui-select-option]:dark:hover:bg-gray-700 [&_.rizzui-select-option]:text-gray-900 [&_.rizzui-select-option]:dark:text-gray-100">
        <RizzuiSelect
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
      </div>
      {error && <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{error}</p>}
      {!error && helperText && (
        <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

Select.displayName = 'Select';

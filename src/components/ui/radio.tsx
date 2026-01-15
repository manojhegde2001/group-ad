'use client';

import { Radio as RizzuiRadio, RadioGroup as RizzuiRadioGroup } from 'rizzui';
import { cn } from '@/lib/utils';
import { forwardRef, Dispatch, SetStateAction } from 'react';

export interface RadioOption {
  label: string;
  value: string;
  disabled?: boolean;
  helperText?: string;
}

interface RadioGroupProps {
  label?: string;
  error?: string;
  helperText?: string;
  options: RadioOption[];
  value: string;
  onChange: Dispatch<SetStateAction<string>>;
  color?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'flat' | 'outline';
  direction?: 'horizontal' | 'vertical';
  required?: boolean;
  name?: string;
  className?: string;
}

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      value,
      onChange,
      color = 'primary',
      size = 'md',
      variant = 'flat',
      direction = 'vertical',
      required = false,
      name,
      className,
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn('w-full', className)}>
        {label && (
          <label className="block text-sm font-medium mb-2 text-foreground">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <RizzuiRadioGroup 
          value={value} 
          setValue={onChange}
          className={cn(
            direction === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-2'
          )}
        >
          {options.map((option) => (
            <div key={option.value}>
              <RizzuiRadio
                label={option.label}
                value={option.value}
                disabled={option.disabled}
                color={error ? 'danger' : color}
                size={size}
                variant={variant}
                name={name}
              />
              {option.helperText && (
                <p className="ml-7 mt-0.5 text-xs text-secondary-600 dark:text-secondary-400">
                  {option.helperText}
                </p>
              )}
            </div>
          ))}
        </RizzuiRadioGroup>
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

RadioGroup.displayName = 'RadioGroup';

// Single Radio component export
interface SingleRadioProps {
  label?: string;
  value: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  color?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'flat' | 'outline';
  disabled?: boolean;
  name?: string;
  className?: string;
}

export const Radio = forwardRef<HTMLInputElement, SingleRadioProps>(
  (
    {
      label,
      value,
      checked,
      onChange,
      color = 'primary',
      size = 'md',
      variant = 'flat',
      disabled = false,
      name,
      className,
    },
    ref
  ) => {
    return (
      <RizzuiRadio
        ref={ref}
        label={label}
        value={value}
        checked={checked}
        onChange={onChange}
        color={color}
        size={size}
        variant={variant}
        disabled={disabled}
        name={name}
        className={className}
      />
    );
  }
);

Radio.displayName = 'Radio';

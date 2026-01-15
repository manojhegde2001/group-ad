'use client';

import { Checkbox as RizzuiCheckbox } from 'rizzui';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface CheckboxProps {
    label?: string;
    error?: string;
    helperText?: string;
    checked?: boolean;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    color?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    rounded?: 'none' | 'sm' | 'md' | 'lg';
    disabled?: boolean;
    variant?: 'flat' | 'outline';
    name?: string;
    value?: string;
    className?: string;
    labelClassName?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    (
        {
            label,
            error,
            helperText,
            checked,
            onChange,
            color = 'primary',
            size = 'md',
            rounded = 'md',
            disabled = false,
            variant = 'flat',
            name,
            value,
            className,
            labelClassName,
        },
        ref
    ) => {
        return (
            <div className={cn('w-full', className)}>
                <RizzuiCheckbox
                    ref={ref}
                    label={label}
                    checked={checked}
                    onChange={onChange}
                    color={error ? 'danger' : color}
                    size={size}
                    rounded={rounded}
                    disabled={disabled}
                    variant={variant}
                    name={name}
                    value={value}
                    labelClassName={labelClassName}
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

Checkbox.displayName = 'Checkbox';

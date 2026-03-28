'use client';

import { Fragment } from 'react';
import { Listbox, Transition, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react';
import { ChevronDown, Check } from 'lucide-react';
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

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
  xl: 'px-6 py-4 text-lg',
};

const roundedClasses = {
  none: 'rounded-none',
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  pill: 'rounded-full',
};

const variantClasses = {
  outline: 'border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900',
  flat: 'border-none bg-secondary-100 dark:bg-secondary-800',
  text: 'border-none bg-transparent hover:bg-secondary-50 dark:hover:bg-secondary-800',
};

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
  required = false,
  className,
}: SelectProps) => {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-black mb-2 text-secondary-900 dark:text-white uppercase tracking-tight">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative">
          <ListboxButton
            className={cn(
              'relative w-full text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
              sizeClasses[size],
              roundedClasses[rounded],
              variantClasses[variant],
              error && 'border-red-500 ring-1 ring-red-500/20',
              disabled && 'opacity-50 cursor-not-allowed',
              'flex items-center justify-between gap-2'
            )}
          >
            <span className={cn('block truncate font-bold', !selectedOption && 'text-secondary-400')}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <span className="pointer-events-none flex items-center">
              <ChevronDown
                className={cn('h-4 w-4 text-secondary-400 transition-transform duration-200')}
                aria-hidden="true"
              />
            </span>
          </ListboxButton>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ListboxOptions 
              anchor="bottom start"
              className="z-[70] mt-1 max-h-60 w-[calc(var(--input-width))] min-w-[12rem] [--anchor-gap:4px] overflow-auto rounded-xl bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 py-1 text-sm shadow-2xl ring-1 ring-black/5 focus:outline-none"
            >
              {options.map((option) => (
                <ListboxOption
                  key={option.value}
                  className={({ active, selected }) =>
                    cn(
                      'relative cursor-pointer select-none py-2.5 px-3.5 transition-colors',
                      active ? 'bg-secondary-50 dark:bg-secondary-800 text-primary-600' : 'text-secondary-700 dark:text-secondary-300',
                      selected && 'font-black bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    )
                  }
                  value={option.value}
                >
                  {({ selected }) => (
                    <>
                      <span className={cn('block truncate text-[11px] uppercase tracking-wider', selected ? 'font-black' : 'font-bold')}>
                        {option.label}
                      </span>
                      {selected && (
                        <span className="absolute inset-y-0 right-3 flex items-center">
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>

      {error && <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-red-500">{error}</p>}
      {!error && helperText && (
        <p className="mt-2 text-[10px] font-bold text-secondary-400 uppercase tracking-widest">
          {helperText}
        </p>
      )}
    </div>
  );
};

Select.displayName = 'Select';

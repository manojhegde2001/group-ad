'use client';

import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X 
} from 'lucide-react';
import { cn } from 'rizzui';

type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClose?: () => void;
  closable?: boolean;
  className?: string;
}

const alertVariants = {
  info: {
    container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
    icon: 'text-blue-600 dark:text-blue-400',
    defaultIcon: Info,
  },
  success: {
    container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-200',
    icon: 'text-green-600 dark:text-green-400',
    defaultIcon: CheckCircle,
  },
  warning: {
    container: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    text: 'text-orange-800 dark:text-orange-200',
    icon: 'text-orange-600 dark:text-orange-400',
    defaultIcon: AlertTriangle,
  },
  danger: {
    container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    icon: 'text-red-600 dark:text-red-400',
    defaultIcon: AlertCircle,
  },
};

export function Alert({
  variant = 'info',
  title,
  children,
  icon,
  onClose,
  closable = false,
  className,
}: AlertProps) {
  const variantStyles = alertVariants[variant];
  const DefaultIcon = variantStyles.defaultIcon;

  return (
    <div
      className={cn(
        'border rounded-lg p-4',
        variantStyles.container,
        variantStyles.text,
        className
      )}
      role="alert"
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className={cn('flex-shrink-0', variantStyles.icon)}>
          {icon || <DefaultIcon className="w-5 h-5" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="font-semibold mb-1 text-sm">{title}</h3>
          )}
          <div className="text-sm">{children}</div>
        </div>

        {/* Close Button */}
        {(closable || onClose) && (
          <button
            onClick={onClose}
            className={cn(
              'flex-shrink-0 hover:opacity-70 transition-opacity p-0.5 rounded',
              variantStyles.icon
            )}
            aria-label="Close alert"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Additional Alert variants as shortcuts
export function InfoAlert(props: Omit<AlertProps, 'variant'>) {
  return <Alert variant="info" {...props} />;
}

export function SuccessAlert(props: Omit<AlertProps, 'variant'>) {
  return <Alert variant="success" {...props} />;
}

export function WarningAlert(props: Omit<AlertProps, 'variant'>) {
  return <Alert variant="warning" {...props} />;
}

export function DangerAlert(props: Omit<AlertProps, 'variant'>) {
  return <Alert variant="danger" {...props} />;
}

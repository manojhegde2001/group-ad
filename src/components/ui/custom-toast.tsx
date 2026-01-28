'use client';

import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface CustomToastProps {
  t: any;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
}

export function CustomToast({ t, message, type, title }: CustomToastProps) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-orange-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    warning: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  };

  return (
    <div
      className={`${bgColors[type]} ${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full shadow-lg rounded-lg pointer-events-auto flex border`}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">{icons[type]}</div>
          <div className="ml-3 flex-1">
            {title && (
              <p className="text-sm font-medium text-secondary-900 dark:text-white mb-1">
                {title}
              </p>
            )}
            <p className="text-sm text-secondary-700 dark:text-secondary-300">
              {message}
            </p>
          </div>
        </div>
      </div>
      <div className="flex border-l border-secondary-200 dark:border-secondary-700">
        <button
          onClick={() => toast.dismiss(t.id)}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-secondary-600 dark:text-secondary-400 hover:text-secondary-500 dark:hover:text-secondary-300 focus:outline-none"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Helper functions to show custom toasts
export const customToast = {
  success: (message: string, title?: string) => {
    toast.custom((t) => (
      <CustomToast t={t} message={message} type="success" title={title} />
    ));
  },
  error: (message: string, title?: string) => {
    toast.custom((t) => (
      <CustomToast t={t} message={message} type="error" title={title} />
    ));
  },
  warning: (message: string, title?: string) => {
    toast.custom((t) => (
      <CustomToast t={t} message={message} type="warning" title={title} />
    ));
  },
  info: (message: string, title?: string) => {
    toast.custom((t) => (
      <CustomToast t={t} message={message} type="info" title={title} />
    ));
  },
};

import toast from 'react-hot-toast';

// Custom toast messages with consistent styling
export const Toast = {
  success: (message: string) => {
    toast.success(message, {
      style: {
        background: '#10b981',
        color: '#ffffff',
        fontWeight: '500',
      },
      iconTheme: {
        primary: '#ffffff',
        secondary: '#10b981',
      },
    });
  },

  error: (message: string) => {
    toast.error(message, {
      style: {
        background: '#ef4444',
        color: '#ffffff',
        fontWeight: '500',
      },
      iconTheme: {
        primary: '#ffffff',
        secondary: '#ef4444',
      },
    });
  },

  loading: (message: string) => {
    return toast.loading(message, {
      style: {
        background: '#3b82f6',
        color: '#ffffff',
        fontWeight: '500',
      },
      iconTheme: {
        primary: '#ffffff',
        secondary: '#3b82f6',
      },
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages, {
      style: {
        minWidth: '250px',
      },
      success: {
        duration: 3000,
      },
      error: {
        duration: 4000,
      },
    });
  },

  custom: (message: string, options?: { duration?: number; icon?: string }) => {
    toast(message, {
      icon: options?.icon || '👋',
      duration: options?.duration || 4000,
    });
  },

  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },

  dismissAll: () => {
    toast.dismiss();
  },
};

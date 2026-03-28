'use client';

import { X, AlertTriangle, Trash2, HelpCircle } from 'lucide-react';
import { Button, Modal, ActionIcon } from 'rizzui';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'primary' | 'warning';
    isLoading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger',
    isLoading = false,
}: ConfirmModalProps) {
    const icons = {
        danger: <Trash2 className="w-6 h-6 text-red-600" />,
        primary: <HelpCircle className="w-6 h-6 text-primary-600" />,
        warning: <AlertTriangle className="w-6 h-6 text-amber-600" />,
    };

    const variantStyles = {
        danger: 'bg-red-50 dark:bg-red-950/30 ring-red-100 dark:ring-red-900',
        primary: 'bg-primary-50 dark:bg-primary-950/30 ring-primary-100 dark:ring-primary-900',
        warning: 'bg-amber-50 dark:bg-amber-950/30 ring-amber-100 dark:ring-amber-900',
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            containerClassName="flex items-center justify-center p-4"
        >
            <div className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white dark:bg-secondary-900 p-6 text-left align-middle shadow-2xl transition-all border border-secondary-100 dark:border-secondary-800 m-auto">
                <div className="flex items-start justify-between mb-5">
                    <div className={`p-3 rounded-2xl ring-4 ${variantStyles[variant]}`}>
                        {icons[variant]}
                    </div>
                    <ActionIcon
                        variant="flat"
                        rounded="full"
                        onClick={onClose}
                    >
                        <X className="w-5 h-5" />
                    </ActionIcon>
                </div>

                <h3 className="text-xl font-bold leading-6 text-secondary-900 dark:text-white mb-2">
                    {title}
                </h3>
                <div className="mt-2">
                    <p className="text-sm text-secondary-500 dark:text-secondary-400 leading-relaxed">
                        {message}
                    </p>
                </div>

                <div className="mt-8 flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="flex-1 rounded-2xl py-6 font-semibold"
                        onClick={onClose}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant="solid"
                        color={variant === 'danger' ? 'danger' : 'primary'}
                        className="flex-1 rounded-2xl py-6 font-semibold shadow-lg"
                        onClick={onConfirm}
                        isLoading={isLoading}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

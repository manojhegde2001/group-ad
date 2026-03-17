'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, AlertTriangle, AlertCircle, Trash2, HelpCircle } from 'lucide-react';
import { Button } from './button';

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
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[1000]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-[2px]" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white dark:bg-secondary-900 p-6 text-left align-middle shadow-2xl transition-all border border-secondary-100 dark:border-secondary-800">
                                <div className="flex items-start justify-between mb-5">
                                    <div className={`p-3 rounded-2xl ring-4 ${variantStyles[variant]}`}>
                                        {icons[variant]}
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-1.5 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-400 transition-colors flex items-center"
                                    >
                                        <span className="sm:hidden text-xs font-bold mr-1">Close</span>
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <Dialog.Title
                                    as="h3"
                                    className="text-xl font-bold leading-6 text-secondary-900 dark:text-white mb-2"
                                >
                                    {title}
                                </Dialog.Title>
                                <div className="mt-2">
                                    <p className="text-sm text-secondary-500 dark:text-secondary-400 leading-relaxed">
                                        {message}
                                    </p>
                                </div>

                                <div className="mt-8 flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        color="secondary"
                                        className="flex-1 rounded-2xl py-6 font-semibold"
                                        onClick={onClose}
                                        disabled={isLoading}
                                    >
                                        {cancelLabel}
                                    </Button>
                                    <Button
                                        variant="solid"
                                        color={variant === 'danger' ? 'danger' : 'primary'}
                                        className="flex-1 rounded-2xl py-6 font-semibold shadow-lg shadow-red-200 dark:shadow-none"
                                        onClick={onConfirm}
                                        isLoading={isLoading}
                                        disabled={isLoading}
                                    >
                                        {confirmLabel}
                                    </Button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

'use client';

import { useState, useRef } from 'react';
import { Modal, Button, Text, Avatar } from 'rizzui';
import { Upload, X, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProfileImageUploadProps {
    userId: string;
    currentAvatar?: string | null;
    onClose: () => void;
}

export default function ProfileImageUpload({
    userId,
    currentAvatar,
    onClose,
}: ProfileImageUploadProps) {
    const [preview, setPreview] = useState<string | null>(currentAvatar || null);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file: File) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        setFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error('Please select an image');
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('/api/user/upload-avatar', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();

            toast.success('Profile picture updated successfully');
            onClose();

            // Refresh the page to show new avatar
            window.location.reload();
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemove = () => {
        setFile(null);
        setPreview(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <Modal isOpen onClose={onClose}>
            <div className="m-auto px-6 py-6 max-w-md bg-white dark:bg-gray-900 rounded-xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <Text className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Update Profile Picture
                    </Text>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                {/* Preview Section */}
                <div className="flex justify-center mb-6">
                    {preview ? (
                        <div className="relative">
                            <Avatar
                                name="Avatar"
                                src={preview}
                                size="xl"
                                customSize="150"
                                className="ring-4 ring-gray-200 dark:ring-gray-700"
                            />
                            {file && (
                                <button
                                    onClick={handleRemove}
                                    className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-colors shadow-lg"
                                    aria-label="Remove image"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="w-36 h-36 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-gray-200 dark:border-gray-700">
                            <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                        </div>
                    )}
                </div>

                {/* Upload Area */}
                <div
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                        dragActive
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-800/50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleChange}
                        className="hidden"
                        aria-label="File input"
                    />

                    <Upload className="w-10 h-10 mx-auto mb-4 text-gray-400 dark:text-gray-500" />

                    <Text className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">
                        Drag and drop your image here, or
                    </Text>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => inputRef.current?.click()}
                        className="mx-auto bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        Browse Files
                    </Button>

                    <Text className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                        PNG, JPG, GIF up to 5MB
                    </Text>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        disabled={isUploading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpload}
                        className="flex-1 bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!file || isUploading}
                        isLoading={isUploading}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4 mr-2" />
                                Upload
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

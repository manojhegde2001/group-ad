'use client';

import { useState, useRef } from 'react';
import { Upload, X, Check, Loader2, ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar } from '@/components/ui/avatar';

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
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

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

            toast.success('Profile picture updated successfully');
            onClose();
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
        setPreview(currentAvatar || null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <>
          {/* Backdrop with blur */}
          <div 
            className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-md transition-all duration-300"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Centered Modal - Compact Design */}
          <div className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center p-4">
            <div 
              className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl transform transition-all animate-in zoom-in duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Compact Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Update Profile Picture
                </h2>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Compact Body */}
              <div className="px-6 py-5">
                
                {/* Small Avatar Preview (80px) */}
                <div className="flex justify-center mb-5">
                  {preview ? (
                    <div className="relative">
                      <Avatar
                        name="Preview"
                        src={preview}
                        size="lg"
                        className="ring-4 ring-primary-200 dark:ring-primary-800"
                      />
                      {file && (
                        <button
                          onClick={handleRemove}
                          className="absolute -top-1 -right-1 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg hover:scale-110"
                          aria-label="Remove"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center border-4 border-gray-300 dark:border-gray-600">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Compact Upload Area */}
                <div
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                      dragActive
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-[1.02]'
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
                  />

                  <div className="flex justify-center mb-3">
                    <div className="p-2.5 bg-primary-100 dark:bg-primary-900/30 rounded-full">
                      <Upload className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-2">
                    Drag & drop or
                  </p>

                  <button
                    onClick={() => inputRef.current?.click()}
                    className="px-4 py-2 text-sm font-semibold bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Browse Files
                  </button>

                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                    PNG, JPG, GIF • Max 5MB
                  </p>
                </div>
              </div>

              {/* Compact Footer */}
              <div className="flex gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
                <button
                  onClick={onClose}
                  disabled={isUploading}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
    );
}

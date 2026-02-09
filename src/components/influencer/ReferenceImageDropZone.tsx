'use client';

import React, { useCallback, useState } from 'react';
import { X, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_MB } from '@/lib/constants';

export interface UploadedImage {
    id: string;
    url: string;
    file?: File;
}

interface ReferenceImageDropZoneProps {
    imageType: 'face' | 'body' | 'boobs' | 'pussy';
    label: string;
    description?: string;
    images: UploadedImage[];
    onImagesChange: (images: UploadedImage[]) => void;
    maxImages?: number;
    className?: string;
    isPornMode?: boolean;
}

export function ReferenceImageDropZone({
    imageType,
    label,
    description,
    images,
    onImagesChange,
    maxImages = 5,
    className,
    isPornMode = false,
}: ReferenceImageDropZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const processFile = useCallback((file: File) => {
        setError(null);

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        // Validate file size
        if (file.size > MAX_UPLOAD_SIZE_BYTES) {
            setError(`File too large. Maximum size is ${MAX_UPLOAD_SIZE_MB}MB`);
            return;
        }

        // Check max images
        if (images.length >= maxImages) {
            setError(`Maximum ${maxImages} images allowed`);
            return;
        }

        // Convert to base64 for preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target?.result as string;
            const newImage: UploadedImage = {
                id: `${imageType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                url: imageUrl,
                file: file,
            };
            onImagesChange([...images, newImage]);
        };
        reader.readAsDataURL(file);
    }, [images, maxImages, imageType, onImagesChange]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        files.forEach(processFile);
    }, [processFile]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        files.forEach(processFile);
        e.target.value = ''; // Reset input
    }, [processFile]);

    const removeImage = useCallback((id: string) => {
        onImagesChange(images.filter(img => img.id !== id));
    }, [images, onImagesChange]);

    // Determine color scheme based on whether it's porn mode content
    const isPornContent = imageType === 'boobs' || imageType === 'pussy';
    const accentColor = isPornContent ? 'amber' : 'violet';

    return (
        <div className={cn('space-y-3', className)}>
            {/* Label */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className={cn(
                        'text-sm font-medium',
                        isPornContent ? 'text-amber-300' : 'text-zinc-300'
                    )}>
                        {label}
                        {isPornContent && (
                            <span className="ml-2 text-xs text-amber-500/70">(Porn mode)</span>
                        )}
                    </h3>
                    {description && (
                        <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
                    )}
                </div>
                <span className="text-xs text-zinc-500">
                    {images.length}/{maxImages}
                </span>
            </div>

            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    'relative border-2 border-dashed rounded-xl p-4 transition-all duration-200',
                    isDragging
                        ? isPornContent
                            ? 'border-amber-500 bg-amber-500/10'
                            : 'border-violet-500 bg-violet-500/10'
                        : isPornContent
                            ? 'border-amber-800/50 bg-amber-950/20 hover:border-amber-700/50'
                            : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600',
                    images.length >= maxImages && 'opacity-50 pointer-events-none'
                )}
            >
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    disabled={images.length >= maxImages}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />

                <div className="flex flex-col items-center gap-2 py-2">
                    <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                        isDragging
                            ? isPornContent ? 'bg-amber-500/20' : 'bg-violet-500/20'
                            : isPornContent ? 'bg-amber-900/40' : 'bg-zinc-700'
                    )}>
                        <Upload className={cn(
                            'w-5 h-5 transition-colors',
                            isDragging
                                ? isPornContent ? 'text-amber-400' : 'text-violet-400'
                                : isPornContent ? 'text-amber-500' : 'text-zinc-400'
                        )} />
                    </div>
                    <div className="text-center">
                        <p className={cn(
                            'text-sm',
                            isPornContent ? 'text-amber-300/80' : 'text-zinc-400'
                        )}>
                            {isDragging ? 'Drop images here' : 'Drag & drop or click'}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Max {MAX_UPLOAD_SIZE_MB}MB per file
                        </p>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </p>
            )}

            {/* Uploaded Images Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                    {images.map((img) => (
                        <div key={img.id} className="relative group aspect-square">
                            <img
                                src={img.url}
                                alt={`${label} reference`}
                                className={cn(
                                    'w-full h-full object-cover rounded-lg border',
                                    isPornContent
                                        ? 'border-amber-800/50'
                                        : 'border-zinc-700'
                                )}
                            />
                            <button
                                type="button"
                                onClick={() => removeImage(img.id)}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-400 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

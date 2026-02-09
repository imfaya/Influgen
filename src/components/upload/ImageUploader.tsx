'use client';

// Image uploader with drag-and-drop functionality

import React, { useCallback, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useGenerationStore } from '@/store';
import { MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_MB } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { filterReferenceImagesByMode } from '@/lib/filterByContentMode';

export function ImageUploader() {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { referenceImages, addReferenceImage, removeReferenceImage, selectedInfluencer, contentMode, clearSeries } = useGenerationStore();
    const isSensual = contentMode === 'sensual';
    const isPorn = contentMode === 'porn';

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

        // Convert to base64 for preview (in production, upload to Supabase storage)
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target?.result as string;
            addReferenceImage({
                influencer_name: selectedInfluencer.name,
                image_url: imageUrl,
                image_type: 'face',
            });
            clearSeries(); // Clear any ongoing series when a new image is uploaded
        };
        reader.readAsDataURL(file);
    }, [addReferenceImage, selectedInfluencer.name]);

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

    // referenceImages already contains only the current influencer's images
    // (managed by the store when switching influencers)
    // Filter images based on content mode
    const filteredImages = useMemo(() => {
        return filterReferenceImagesByMode(referenceImages, contentMode);
    }, [referenceImages, contentMode]);

    return (
        <div className="space-y-3">
            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    'relative border-2 border-dashed rounded-lg p-4 transition-all duration-200 text-center',
                    isDragging
                        ? (isSensual
                            ? 'border-rose-500 bg-rose-500/5'
                            : isPorn ? 'border-amber-500 bg-amber-500/5' : 'border-[#FF6B9D] bg-[#FF6B9D]/5')
                        : (isSensual
                            ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 hover:border-rose-400'
                            : isPorn
                                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 hover:border-amber-400'
                                : 'border-gray-200 dark:border-gray-600 hover:border-[#FF6B9D]/50')
                )}
            >
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="flex flex-col items-center gap-2">
                    <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                        isDragging
                            ? (isSensual ? 'bg-rose-500/10' : isPorn ? 'bg-amber-500/10' : 'bg-[#FF6B9D]/10')
                            : (isSensual
                                ? 'bg-rose-100 dark:bg-rose-900/40'
                                : isPorn
                                    ? 'bg-amber-100 dark:bg-amber-900/40'
                                    : 'bg-gray-100 dark:bg-gray-700')
                    )}>
                        <svg
                            className={cn(
                                'w-5 h-5 transition-colors',
                                isDragging
                                    ? (isSensual ? 'text-rose-500' : isPorn ? 'text-amber-500' : 'text-[#FF6B9D]')
                                    : (isSensual ? 'text-rose-500' : isPorn ? 'text-amber-500' : 'text-gray-400')
                            )}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                    </div>
                    <div>
                        <p className={cn(
                            "text-sm",
                            isSensual
                                ? "text-rose-700 dark:text-rose-300"
                                : isPorn
                                    ? "text-amber-600 dark:text-amber-300"
                                    : "text-gray-600 dark:text-gray-300"
                        )}>
                            {isDragging ? 'Drop image here' : 'Drag & drop or click'}
                        </p>
                        <p className={cn(
                            "text-xs mt-0.5",
                            isSensual
                                ? "text-rose-400 dark:text-rose-500"
                                : isPorn
                                    ? "text-amber-500 dark:text-amber-500"
                                    : "text-gray-400 dark:text-gray-500"
                        )}>
                            Max {MAX_UPLOAD_SIZE_MB}MB per file
                        </p>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </p>
            )}

            {/* Uploaded Images - Show filtered images based on content mode */}
            {filteredImages.length > 0 && (
                <div className="space-y-2">
                    <p className={cn(
                        "text-xs",
                        isSensual ? "text-rose-600 dark:text-rose-400" : isPorn ? "text-amber-600 dark:text-amber-400" : "text-gray-500 dark:text-gray-400"
                    )}>{filteredImages.length} reference image(s)</p>
                    <div className="grid grid-cols-3 gap-2">
                        {filteredImages.map((img) => (
                            <div key={img.id} className="relative group aspect-square">
                                <img
                                    src={img.image_url}
                                    alt="Reference"
                                    className={cn(
                                        "w-full h-full object-cover rounded-lg border",
                                        isSensual
                                            ? "border-rose-200 dark:border-rose-800"
                                            : isPorn
                                                ? "border-amber-200 dark:border-amber-800"
                                                : "border-gray-200 dark:border-gray-600"
                                    )}
                                />
                                <button
                                    onClick={() => removeReferenceImage(img.id)}
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/50 text-white text-[10px] rounded">
                                    {img.image_type}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

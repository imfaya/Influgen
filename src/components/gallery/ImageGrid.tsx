'use client';

// Image grid displaying generated images

import React from 'react';
import { ImageCard } from './ImageCard';
import { useGenerationStore } from '@/store';
import { useGeneration } from '@/hooks/useGeneration';
import { cn } from '@/lib/utils';

export function ImageGrid() {
    const { currentImages, isGenerating, parameters } = useGenerationStore();
    const { continueSeries } = useGeneration();

    if (currentImages.length === 0 && !isGenerating) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6B9D]/10 to-[#4ECDC4]/10 flex items-center justify-center mb-4">
                    <svg
                        className="w-10 h-10 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-1">No images yet</h3>
                <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">
                    Write a prompt and click Generate to create your first AI image
                </p>
            </div>
        );
    }

    // Calculate grid columns based on number of outputs
    const gridCols = parameters.numOutputs >= 4 ? 'grid-cols-2 md:grid-cols-4' :
        parameters.numOutputs === 2 ? 'grid-cols-2' : 'grid-cols-1 max-w-lg mx-auto';

    return (
        <div className="space-y-4">
            {/* Loading state */}
            {isGenerating && (
                <div className="flex items-center justify-center py-8">
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-[#FF6B9D]/20 rounded-full"></div>
                            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-[#FF6B9D] rounded-full animate-spin"></div>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Creating your images...</p>
                    </div>
                </div>
            )}

            {/* Image grid */}
            {currentImages.length > 0 && (
                <div className={cn('grid gap-4', gridCols)}>
                    {currentImages.map((imageUrl, index) => (
                        <ImageCard
                            key={`${imageUrl}-${index}`}
                            imageUrl={imageUrl}
                            index={index}
                            onContinueSeries={() => continueSeries(imageUrl)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

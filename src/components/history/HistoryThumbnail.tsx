'use client';

// Premium thumbnail component for Instagram-style history grid
// OPTIMIZED: Using CSS for hover states instead of useState to reduce re-renders

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { useSeriesCreator } from './SeriesCreatorBubble';
import { Check } from 'lucide-react';
import { getThumbnailUrl } from '@/lib/imageUtils';

interface HistoryThumbnailProps {
    imageUrl: string;
    generationId: string;
    isSeries: boolean;
    isSeriesOrigin?: boolean;
    onClick: () => void;
    onSchedule?: (e: React.MouseEvent) => void;
    isSensual?: boolean;
    isPorn?: boolean;
    isStealIt?: boolean;
}

// Memoized component to prevent unnecessary re-renders
export const HistoryThumbnail = memo(function HistoryThumbnail({
    imageUrl,
    generationId,
    isSeries,
    isSeriesOrigin = false,
    onClick,
    onSchedule,
    isSensual = false,
    isPorn = false,
    isStealIt = false
}: HistoryThumbnailProps) {
    const [isLoaded, setIsLoaded] = React.useState(false);

    // Get selection mode context
    const seriesCreator = useSeriesCreator();
    const isSelectionMode = seriesCreator?.isSelectionMode ?? false;
    const selectedCount = seriesCreator?.getPhotoCount(imageUrl) ?? null;
    const isSelected = selectedCount !== null;

    // Handle click - either select or open modal
    const handleClick = React.useCallback(() => {
        if (isSelectionMode && seriesCreator) {
            seriesCreator.togglePhoto(imageUrl, generationId);
        } else {
            onClick();
        }
    }, [isSelectionMode, seriesCreator, imageUrl, generationId, onClick]);

    // Determine color theme class
    const themeClass = isPorn ? 'thumbnail-porn' : isSensual ? 'thumbnail-sensual' : 'thumbnail-social';

    return (
        <div
            className={cn(
                "history-thumbnail",
                themeClass,
                "relative aspect-square rounded-xl overflow-hidden cursor-pointer",
                "group",
                isSelected && "is-selected",
                isPorn && isSelected && "ring-amber-500",
                isSensual && isSelected && "ring-rose-400",
                !isPorn && !isSensual && isSelected && "ring-cyan-400"
            )}
            onClick={handleClick}
        >
            {/* Loading skeleton */}
            {!isLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 animate-pulse" />
            )}

            {/* Image with CSS hover zoom */}
            <img
                src={getThumbnailUrl(imageUrl, { width: 400 })}
                alt="Generated image"
                className={cn(
                    "thumbnail-image w-full h-full object-cover",
                    isLoaded ? "opacity-100" : "opacity-0"
                )}
                loading="lazy"
                onLoad={() => setIsLoaded(true)}
            />

            {/* Gradient overlay - CSS handles hover intensity */}
            <div className="thumbnail-overlay absolute inset-0 pointer-events-none" />

            {/* Selection mode overlay */}
            {isSelectionMode && (
                <div
                    className={cn(
                        "absolute inset-0 pointer-events-none",
                        isSelected ? "bg-black/30" : "bg-transparent"
                    )}
                />
            )}

            {/* Selection checkmark */}
            {isSelected && (
                <div className={cn(
                    "absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center",
                    isPorn ? "bg-amber-500" : isSensual ? "bg-rose-500" : "bg-cyan-500"
                )}>
                    <Check className="w-4 h-4 text-white" />
                </div>
            )}

            {/* Count badge when selected */}
            {isSelected && selectedCount && selectedCount > 0 && (
                <div className={cn(
                    "absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center",
                    "text-[11px] font-bold text-white",
                    isPorn ? "bg-amber-500" : isSensual ? "bg-rose-500" : "bg-cyan-500"
                )}>
                    {selectedCount}
                </div>
            )}

            {/* Glow ring on hover (only when not in selection mode) - CSS controlled */}
            {!isSelectionMode && (
                <div className="thumbnail-ring absolute inset-0 rounded-xl pointer-events-none border-2 border-transparent" />
            )}

            {/* Steal It Indicator */}
            {isStealIt && (
                <div className={cn(
                    "absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center",
                    "bg-red-500/15 backdrop-blur-md border border-red-500/20 shadow-sm text-red-500 z-10",
                    "group-hover:bg-red-500/25 transition-colors"
                )} title="Steal It Generation">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C10.5 2 9.22 3.05 8.87 4.45C7.2 4.7 6 6.2 6 8V12L4 14V15H20V14L18 12V8C18 6.2 16.8 4.7 15.13 4.45C14.78 3.05 13.5 2 12 2ZM5 16V17H19V16H5ZM12 18C10.9 18 10 18.9 10 20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20C14 18.9 13.1 18 12 18Z" opacity="0" />
                        <path d="M18.5 7C18.5 7 19 5.5 21 5L20 4.5C20 4.5 18.5 5 18 7H18.5Z" />
                        <path d="M5.5 7C5.5 7 5 5.5 3 5L4 4.5C4 4.5 5.5 5 6 7H5.5Z" />
                        <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM10 11C10 10.45 10.45 10 11 10C11.55 10 12 10.45 12 11C12 11.55 11.55 12 11 12C10.45 12 10 11.55 10 11ZM14 11C14 10.45 14.45 10 15 10C15.55 10 16 10.45 16 11C16 11.55 15.55 12 15 12C14.45 12 14 11.55 14 11ZM12 16C10.33 16 9 14.67 9 13H15C15 14.67 13.67 16 12 16Z" />
                    </svg>
                </div>
            )}



            {/* Hover zoom icon - center of image (only when not in selection mode) - CSS controlled */}
            {!isSelectionMode && (
                <>
                    <div className="thumbnail-zoom-icon absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className={cn(
                            "p-3 rounded-full",
                            "bg-white/20 border border-white/30 backdrop-blur-sm"
                        )}>
                            <svg
                                className="w-6 h-6 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Quick Schedule Button - Top Left */}
                    {onSchedule && (
                        <button
                            onClick={onSchedule}
                            className={cn(
                                "thumbnail-action-btn absolute top-2 left-2 p-2 rounded-full",
                                "bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10",
                                "text-white transition-all duration-200 z-20",
                                "opacity-0 group-hover:opacity-100 transform translate-y-[-10px] group-hover:translate-y-0"
                            )}
                            title="Schedule Post"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </button>
                    )}
                </>
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison function - only re-render if these props change
    return (
        prevProps.imageUrl === nextProps.imageUrl &&
        prevProps.generationId === nextProps.generationId &&
        prevProps.isSeries === nextProps.isSeries &&
        prevProps.isSeriesOrigin === nextProps.isSeriesOrigin &&
        prevProps.isSensual === nextProps.isSensual &&
        prevProps.isPorn === nextProps.isPorn &&
        prevProps.isStealIt === nextProps.isStealIt
        // onClick and onSchedule are intentionally excluded - they change on every parent render
    );
});

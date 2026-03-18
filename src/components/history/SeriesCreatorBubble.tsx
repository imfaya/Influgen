'use client';

// Series Creator Panel - Inline control panel for batch series creation
// When active, existing history thumbnails become selectable
// UPDATED: Shows as inline panel (not floating) + parallel generation

import React, { useState, useMemo, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, Plus, Minus, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useGeneration } from '@/hooks/useGeneration';
import { cn } from '@/lib/utils';

// Context for selection mode
interface SeriesCreatorContextType {
    isSelectionMode: boolean;
    selectedPhotos: Map<string, { imageUrl: string; generationId: string; count: number }>;
    togglePhoto: (imageUrl: string, generationId: string) => void;
    updateCount: (imageUrl: string, delta: number) => void;
    getPhotoCount: (imageUrl: string) => number | null;
    contentMode: 'social' | 'sensual' | 'porn';
}

const SeriesCreatorContext = createContext<SeriesCreatorContextType | null>(null);

export function useSeriesCreator() {
    return useContext(SeriesCreatorContext);
}

interface SeriesCreatorBubbleProps {
    isVisible: boolean;
    contentMode: 'social' | 'sensual' | 'porn';
    children?: React.ReactNode;
}

export function SeriesCreatorBubble({ isVisible, contentMode, children }: SeriesCreatorBubbleProps) {
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedPhotos, setSelectedPhotos] = useState<Map<string, { imageUrl: string; generationId: string; count: number }>>(new Map());
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });

    const { continueSeries } = useGeneration();

    const isSensual = contentMode === 'sensual';
    const isPorn = contentMode === 'porn';

    // Toggle photo selection
    const togglePhoto = useCallback((imageUrl: string, generationId: string) => {
        setSelectedPhotos(prev => {
            const next = new Map(prev);
            if (next.has(imageUrl)) {
                next.delete(imageUrl);
            } else {
                next.set(imageUrl, { imageUrl, generationId, count: 1 });
            }
            return next;
        });
    }, []);

    // Update count for a selected photo
    const updateCount = useCallback((imageUrl: string, delta: number) => {
        setSelectedPhotos(prev => {
            const next = new Map(prev);
            const photo = next.get(imageUrl);
            if (photo) {
                const newCount = Math.max(1, Math.min(10, photo.count + delta));
                next.set(imageUrl, { ...photo, count: newCount });
            }
            return next;
        });
    }, []);

    // Get count for a photo (null if not selected)
    const getPhotoCount = useCallback((imageUrl: string) => {
        const photo = selectedPhotos.get(imageUrl);
        return photo ? photo.count : null;
    }, [selectedPhotos]);

    // Calculate total series to create
    const totalSeries = useMemo(() => {
        return Array.from(selectedPhotos.values()).reduce((sum, p) => sum + p.count, 0);
    }, [selectedPhotos]);

    // Create all series - NOW IN PARALLEL!
    const handleCreateSeries = useCallback(async () => {
        if (selectedPhotos.size === 0) return;

        setIsGenerating(true);
        setGenerationProgress({ current: 0, total: totalSeries });
        toast(`🚀 ${totalSeries} series generation${totalSeries > 1 ? 's' : ''} launched!`);

        try {
            // Build array of all generation promises
            const allPromises: Promise<void>[] = [];
            let completed = 0;

            for (const photo of selectedPhotos.values()) {
                for (let i = 0; i < photo.count; i++) {
                    // Create promise that tracks completion
                    const promise = continueSeries(photo.imageUrl, photo.generationId).then(() => {
                        completed++;
                        setGenerationProgress({ current: completed, total: totalSeries });
                    });
                    allPromises.push(promise);
                }
            }

            // Run ALL generations in parallel!
            await Promise.all(allPromises);

            // Success - clear selection and exit mode
            setSelectedPhotos(new Map());
            setIsSelectionMode(false);
        } catch (error) {
            console.error('Series creation error:', error);
        } finally {
            setIsGenerating(false);
            setGenerationProgress({ current: 0, total: 0 });
        }
    }, [selectedPhotos, totalSeries, continueSeries]);

    // Cancel selection mode
    const handleCancel = useCallback(() => {
        setSelectedPhotos(new Map());
        setIsSelectionMode(false);
    }, []);

    // Color scheme based on mode
    const colors = {
        primary: isPorn ? 'amber' : isSensual ? 'rose' : 'cyan',
        bg: isPorn
            ? 'bg-amber-500/10 border-amber-500/30'
            : isSensual
                ? 'bg-rose-500/10 border-rose-500/30'
                : 'bg-cyan-500/10 border-cyan-500/30',
        text: isPorn ? 'text-amber-400' : isSensual ? 'text-rose-400' : 'text-cyan-400',
        button: isPorn
            ? 'bg-amber-500 hover:bg-amber-600'
            : isSensual
                ? 'bg-rose-500 hover:bg-rose-600'
                : 'bg-cyan-500 hover:bg-cyan-600',
        border: isPorn ? 'border-amber-500/50' : isSensual ? 'border-rose-500/50' : 'border-cyan-500/50',
    };

    // Provide context to children (HistoryGrid)
    const contextValue: SeriesCreatorContextType = {
        isSelectionMode,
        selectedPhotos,
        togglePhoto,
        updateCount,
        getPhotoCount,
        contentMode,
    };

    if (!isVisible) return <>{children}</>;

    return (
        <SeriesCreatorContext.Provider value={contextValue}>
            {/* Inline Series Creator Panel - shows above the grid */}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div
                            className={cn(
                                "mx-3 mb-3 rounded-xl overflow-hidden",
                                "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm",
                                "border",
                                colors.border
                            )}
                        >
                            {!isSelectionMode ? (
                                // Inactive state - Compact trigger banner
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className={cn(
                                        "p-3 flex items-center justify-between cursor-pointer hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors",
                                    )}
                                    onClick={() => setIsSelectionMode(true)}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center",
                                            colors.bg
                                        )}>
                                            <Layers className={cn("w-4 h-4", colors.text)} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                Series Creator
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Click to create multiple series
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        className={cn(
                                            "h-8 px-3 rounded-lg font-medium text-white",
                                            colors.button
                                        )}
                                    >
                                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                                        Activate
                                    </Button>
                                </motion.div>
                            ) : (
                                // Active state - Full control panel
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-3"
                                >
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className={cn("w-4 h-4", colors.text)} />
                                            <span className="font-bold text-sm text-gray-900 dark:text-white">
                                                Selection Mode
                                            </span>
                                            <span className={cn(
                                                "text-xs px-2 py-0.5 rounded-full",
                                                colors.bg, colors.text
                                            )}>
                                                {selectedPhotos.size} photo{selectedPhotos.size > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <button
                                            onClick={handleCancel}
                                            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <X className="w-4 h-4 text-gray-500" />
                                        </button>
                                    </div>

                                    {/* Help text */}
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                        Click on the photos below to select them
                                    </p>

                                    {/* Selected Photos Preview */}
                                    {selectedPhotos.size > 0 && (
                                        <div className="mb-3">
                                            <div className="flex flex-wrap gap-2 pb-1">
                                                {Array.from(selectedPhotos.values()).map((photo) => (
                                                    <div
                                                        key={photo.imageUrl}
                                                        className="relative flex-shrink-0 group"
                                                    >
                                                        <img
                                                            src={photo.imageUrl}
                                                            alt=""
                                                            className={cn(
                                                                "w-12 h-12 rounded-lg object-cover ring-2",
                                                                isPorn ? "ring-amber-500" : isSensual ? "ring-rose-500" : "ring-cyan-500"
                                                            )}
                                                        />
                                                        {/* Count Controls */}
                                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-black/80 rounded-full px-1 py-0.5">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); updateCount(photo.imageUrl, -1); }}
                                                                className="w-4 h-4 flex items-center justify-center text-white/70 hover:text-white"
                                                            >
                                                                <Minus className="w-3 h-3" />
                                                            </button>
                                                            <span className={cn("text-[10px] font-bold min-w-[14px] text-center", colors.text)}>
                                                                {photo.count}
                                                            </span>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); updateCount(photo.imageUrl, 1); }}
                                                                className="w-4 h-4 flex items-center justify-center text-white/70 hover:text-white"
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                        {/* Remove button */}
                                                        <button
                                                            onClick={() => togglePhoto(photo.imageUrl, photo.generationId)}
                                                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X className="w-3 h-3 text-white" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCancel}
                                            className="flex-1 h-9 rounded-lg"
                                            disabled={isGenerating}
                                        >
                                            Cancel
                                        </Button>

                                        {isGenerating ? (
                                            <div className={cn(
                                                "flex-[2] h-9 rounded-lg flex items-center justify-center gap-2",
                                                colors.button
                                            )}>
                                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                                <span className="text-sm font-medium text-white">
                                                    {generationProgress.current}/{generationProgress.total}
                                                </span>
                                            </div>
                                        ) : (
                                            <Button
                                                onClick={handleCreateSeries}
                                                disabled={selectedPhotos.size === 0}
                                                className={cn(
                                                    "flex-[2] h-9 rounded-lg font-bold text-white transition-all",
                                                    selectedPhotos.size > 0 ? colors.button : "bg-gray-300 dark:bg-gray-700"
                                                )}
                                            >
                                                <Sparkles className="w-4 h-4 mr-1" />
                                                Create {totalSeries} series ⚡
                                            </Button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {children}
        </SeriesCreatorContext.Provider>
    );
}

'use client';

// Instagram-style grid layout for history thumbnails
// OPTIMIZED: Memoized callbacks and shallow comparisons

import React, { useState, useMemo, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';

import { useHistory } from '@/hooks/useHistory';
import { useGeneration } from '@/hooks/useGeneration';
import { useGenerationStore } from '@/store';
import { HistoryThumbnail } from './HistoryThumbnail';
import { ImageDetailModal } from './ImageDetailModal';
import { SchedulePostModal } from '@/components/scheduler/SchedulePostModal';
import { ContentMode, Generation } from '@/types';
import { cn } from '@/lib/utils';

interface HistoryGridProps {
    filterMode?: ContentMode;
    historyFilter?: 'all' | 'continued' | 'not_continued';
    isTrashView?: boolean;
}


interface FlattenedImage {
    imageUrl: string;
    generation: Generation;
    imageIndex: number;
}

export const HistoryGrid = memo(function HistoryGrid({ filterMode, historyFilter = 'all', isTrashView = false }: HistoryGridProps) {
    // 0. Specific selectors to avoid re-renders on unrelated state changes
    const generations = useGenerationStore(useCallback(state => state.generations, []));
    const deleteGeneration = useHistory().deleteGeneration;
    const reusePrompt = useHistory().reusePrompt;
    const downloadImage = useHistory().downloadImage;
    const { continueSeries, boostRealism, boostRealismPremium } = useGeneration();
    const selectedInfluencerId = useGenerationStore(useCallback(state => state.selectedInfluencer.id, []));
    const trash = useGenerationStore(useCallback(state => state.trash, []));
    const influencers = useGenerationStore(useCallback(state => state.influencers, []));
    const getCustomBasePrompt = useGenerationStore(useCallback(state => state.getCustomBasePrompt, []));

    const [selectedImage, setSelectedImage] = useState<FlattenedImage | null>(null);
    const [schedulingGeneration, setSchedulingGeneration] = useState<Generation | null>(null);
    const [renderLimit, setRenderLimit] = useState(60);

    const isSensual = filterMode === 'sensual';
    const isPorn = filterMode === 'porn';

    // 1 & 2 & 3. Consolidated Single-Pass Filtering and Flattening
    const { flattenedImages, hasMore } = useMemo(() => {
        let items: FlattenedImage[] = [];
        const activeMode = filterMode || 'social';

        if (isTrashView) {
            // Trash Mode: Map trash items (Optimized pass)
            for (let i = 0; i < trash.length; i++) {
                const item = trash[i];
                if (item.type === 'full_generation' && item.generationData) {
                    const gen = item.generationData;
                    if (gen.influencer_id === selectedInfluencerId && (gen.content_mode || 'social') === activeMode) {
                        const urls = gen.image_urls;
                        for (let j = urls.length - 1; j >= 0; j--) {
                            items.push({ imageUrl: urls[j], generation: gen, imageIndex: j });
                            if (items.length >= renderLimit + 1) break;
                        }
                    }
                } else if (item.type === 'single_image' && item.imageUrl) {
                    const gen = generations.find(g => g.id === item.originalGenerationId) || item.generationData;
                    if (gen && gen.influencer_id === selectedInfluencerId && (gen.content_mode || 'social') === activeMode) {
                        items.push({ imageUrl: item.imageUrl, generation: gen, imageIndex: item.imageIndex || 0 });
                    }
                }
                if (items.length >= renderLimit + 1) break;
            }
        } else {
            // Normal Mode: Filter and Flatten (Optimized single pass)
            for (let i = 0; i < generations.length; i++) {
                const gen = generations[i];

                // Fast path filters - use ID for reliability
                if (gen.influencer_id !== selectedInfluencerId) continue;
                if ((gen.content_mode || 'social') !== activeMode) continue;

                const isSeries = gen.is_series === true || (gen.image_urls && gen.image_urls.length > (gen.parameters?.numOutputs || 8));
                const isStealIt = gen.tags?.includes('steal-it');

                // History Filter Logic
                let matchesFilter = true;
                if (historyFilter !== 'all') {
                    if (isStealIt) {
                        matchesFilter = (historyFilter === 'continued' && isSeries);
                    } else if (historyFilter === 'continued') {
                        matchesFilter = isSeries;
                    } else if (historyFilter === 'not_continued') {
                        matchesFilter = !isSeries;
                    }
                }

                if (!matchesFilter) continue;

                // Flattening
                if (historyFilter === 'all' || historyFilter === 'not_continued') {
                    const urls = gen.image_urls;
                    for (let j = urls.length - 1; j >= 0; j--) {
                        items.push({ imageUrl: urls[j], generation: gen, imageIndex: j });
                        if (items.length >= renderLimit + 1) break;
                    }
                } else if (historyFilter === 'continued' && isSeries && gen.image_urls.length > 0) {
                    items.push({ imageUrl: gen.image_urls[0], generation: gen, imageIndex: 0 });
                }

                if (items.length >= renderLimit + 1) break;
            }
        }

        const more = items.length > renderLimit;
        return {
            flattenedImages: more ? items.slice(0, renderLimit) : items,
            hasMore: more
        };
    }, [generations, trash, filterMode, historyFilter, isTrashView, selectedInfluencerId, renderLimit]);

    // Get images in the same series as the selected image
    // Get images in the same series as the selected image - REFRESHED from store
    const activeGeneration = useMemo(() => {
        if (!selectedImage) return null;
        return generations.find(g => g.id === selectedImage.generation.id) || selectedImage.generation;
    }, [selectedImage, generations]);

    const seriesImages = useMemo(() => {
        if (!activeGeneration) return [];
        return activeGeneration.image_urls;
    }, [activeGeneration]);

    const currentSeriesIndex = selectedImage?.imageIndex ?? 0;

    // Extract user prompt - memoized
    const userPromptOnly = useMemo(() => {
        if (!selectedImage) return '';

        const generation = selectedImage.generation;
        const fullPrompt = generation.prompt;

        const influencer = influencers.find(i => i.name === generation.influencer_name);
        if (!influencer) return fullPrompt;

        const basePrompt = getCustomBasePrompt(influencer.id) || influencer.basePrompt;

        if (fullPrompt.startsWith(basePrompt)) {
            let userPart = fullPrompt.slice(basePrompt.length);
            if (userPart.startsWith('. ')) {
                userPart = userPart.slice(2);
            } else if (userPart.startsWith('.')) {
                userPart = userPart.slice(1);
            }
            return userPart.trim();
        }

        return fullPrompt;
    }, [selectedImage, getCustomBasePrompt, influencers]);

    // Memoized handlers to prevent child re-renders
    const handleSeriesPrev = useCallback(() => {
        if (!selectedImage || currentSeriesIndex <= 0) return;
        setSelectedImage({
            ...selectedImage,
            imageUrl: selectedImage.generation.image_urls[currentSeriesIndex - 1],
            imageIndex: currentSeriesIndex - 1,
        });
    }, [selectedImage, currentSeriesIndex]);

    const handleSeriesNext = useCallback(() => {
        if (!selectedImage) return;
        const nextIndex = currentSeriesIndex + 1;
        if (nextIndex >= selectedImage.generation.image_urls.length) return;
        setSelectedImage({
            ...selectedImage,
            imageUrl: selectedImage.generation.image_urls[nextIndex],
            imageIndex: nextIndex,
        });
    }, [selectedImage, currentSeriesIndex]);

    const handleContinueSeries = useCallback(() => {
        if (!selectedImage) return;
        continueSeries(selectedImage.imageUrl, selectedImage.generation.id);
    }, [selectedImage, continueSeries]);

    const handleRealismBoost = useCallback(() => {
        if (!selectedImage) return;
        boostRealism(selectedImage.imageUrl, selectedImage.generation.id);
    }, [selectedImage, boostRealism]);

    const handleRealismBoostPremium = useCallback(() => {
        if (!selectedImage) return;
        boostRealismPremium(selectedImage.imageUrl, selectedImage.generation.id);
    }, [selectedImage, boostRealismPremium]);

    const handleCloseModal = useCallback(() => {
        setSelectedImage(null);
    }, []);

    const handleDownload = useCallback((url: string) => {
        downloadImage(url);
    }, [downloadImage]);

    const handleReusePrompt = useCallback(() => {
        if (selectedImage) {
            reusePrompt(selectedImage.generation);
        }
    }, [selectedImage, reusePrompt]);

    const handleDelete = useCallback(() => {
        if (selectedImage) {
            deleteGeneration(selectedImage.generation.id);
            setSelectedImage(null);
        }
    }, [selectedImage, deleteGeneration]);

    // Handle thumbnail click - memoized per image
    const handleThumbnailClick = useCallback((item: FlattenedImage) => {
        setSelectedImage(item);
    }, []);

    const handleSchedule = useCallback((e: React.MouseEvent, generation: Generation) => {
        e.stopPropagation();
        setSchedulingGeneration(generation);
    }, []);

    const handleSeriesSelect = useCallback((index: number) => {
        if (!selectedImage || !activeGeneration) return;
        if (index < 0 || index >= activeGeneration.image_urls.length) return;

        // We need to keep the generation object updated too if possible, but mainly the URL and index
        setSelectedImage({
            ...selectedImage,
            imageUrl: activeGeneration.image_urls[index],
            imageIndex: index,
            // Update generation reference to latest to avoid drift
            generation: activeGeneration
        });
    }, [selectedImage, activeGeneration]);

    // Global Navigation Handlers
    const handleGlobalPrev = useCallback(() => {
        if (!selectedImage) return;

        // Find the First Index of the CURRENT generation in the flattened list
        // (Even if we are on Image 2 and it's not in the list, searching by ID will find Image 0 which IS in the list)
        const firstCurrentIndex = flattenedImages.findIndex(
            item => item.generation.id === selectedImage.generation.id
        );

        if (firstCurrentIndex > 0) {
            // The item immediately before the current generation belongs to the Previous Generation
            const prevGenItem = flattenedImages[firstCurrentIndex - 1];
            const prevGenId = prevGenItem.generation.id;

            // Now find the START of that previous generation
            const firstPrevIndex = flattenedImages.findIndex(item => item.generation.id === prevGenId);

            if (firstPrevIndex !== -1) {
                setSelectedImage(flattenedImages[firstPrevIndex]);
            } else {
                // Fallback (shouldn't happen if list is consistent)
                setSelectedImage(prevGenItem);
            }
        }
    }, [selectedImage, flattenedImages]);

    const handleGlobalNext = useCallback(() => {
        if (!selectedImage) return;

        // Find the index of the first item that belongs to a DIFFERENT (subsequent) generation
        let foundCurrentGen = false;
        let nextGenIndex = -1;

        for (let i = 0; i < flattenedImages.length; i++) {
            if (flattenedImages[i].generation.id === selectedImage.generation.id) {
                foundCurrentGen = true;
            } else if (foundCurrentGen) {
                // We found the current gen, and now we found a different one!
                nextGenIndex = i;
                break;
            }
        }

        if (nextGenIndex !== -1) {
            setSelectedImage(flattenedImages[nextGenIndex]);
        } else if (foundCurrentGen && hasMore) {
            setRenderLimit(prev => prev + 60);
        }
    }, [selectedImage, flattenedImages, hasMore]);

    if (flattenedImages.length === 0) {
        return (
            <div className="text-center py-8">
                <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3",
                    isSensual ? "bg-rose-500/10" : "bg-gray-100 dark:bg-gray-800"
                )}>
                    <svg className={cn(
                        "w-8 h-8",
                        isSensual ? "text-rose-400" : "text-gray-300"
                    )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {isTrashView ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        )}
                    </svg>
                </div>
                <p className={cn(
                    "text-sm",
                    isSensual ? "text-rose-300" : "text-gray-500 dark:text-gray-400"
                )}>{isTrashView ? "Trash Empty" : "No history"}</p>
                <p className={cn(
                    "text-xs mt-1",
                    isSensual ? "text-rose-300/60" : "text-gray-400 dark:text-gray-500"
                )}>
                    {isTrashView ? "Trash is empty" : "Generated images will appear here"}
                </p>
            </div>
        );
    }


    return (
        <div className="space-y-3">
            {/* Thumbnail Grid - Instagram style */}
            <div className="grid grid-cols-3 gap-1">
                {flattenedImages.map((item) => (
                    <HistoryThumbnail
                        key={`${item.generation.id}-${item.imageIndex}`}
                        imageUrl={item.imageUrl}
                        generationId={item.generation.id}
                        isSeries={item.generation.is_series}
                        isSeriesOrigin={item.generation.is_series && item.imageIndex === 0}
                        isStealIt={item.generation.tags?.includes('steal-it')}
                        onClick={() => handleThumbnailClick(item)}
                        onSchedule={(e) => handleSchedule(e, item.generation)}
                        isSensual={isSensual}
                        isPorn={isPorn}
                    />
                ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
                <div className="flex justify-center pt-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "text-xs font-medium uppercase tracking-wider",
                            isSensual ? "text-rose-400 hover:text-rose-300" : "text-[#4ECDC4] hover:text-[#4ECDC4]/80"
                        )}
                        onClick={() => setRenderLimit(prev => prev + 60)}
                    >
                        Load More Results
                    </Button>
                </div>
            )}

            {/* Empty filtered state */}
            {flattenedImages.length === 0 && generations.length > 0 && (
                <div className="text-center py-6">
                    <p className={cn(
                        "text-sm",
                        isSensual ? "text-rose-300" : "text-gray-500 dark:text-gray-400"
                    )}>No results</p>
                    <Button
                        variant="link"
                        size="sm"
                        className={cn(
                            isSensual ? "text-rose-400" : "text-[#4ECDC4]"
                        )}
                    >
                        Reset filters
                    </Button>
                </div>
            )}

            {/* Image Detail Modal */}
            <ImageDetailModal
                isOpen={!!selectedImage}
                onClose={handleCloseModal}
                imageUrl={selectedImage?.imageUrl || ''}
                generation={selectedImage?.generation || null}
                imageIndex={selectedImage?.imageIndex || 0}
                seriesImages={seriesImages}
                currentSeriesIndex={currentSeriesIndex}
                onSeriesPrev={handleSeriesPrev}
                onSeriesNext={handleSeriesNext}
                onDownload={handleDownload}
                onReusePrompt={handleReusePrompt}
                onContinueSeries={handleContinueSeries}
                onDelete={handleDelete}
                onRealismBoost={handleRealismBoost}
                onRealismBoostPremium={handleRealismBoostPremium}
                onSeriesSelect={handleSeriesSelect}
                userPromptOnly={userPromptOnly}
                isSensual={isSensual}
                isTrashMode={isTrashView}
                onGlobalPrev={handleGlobalPrev}
                onGlobalNext={handleGlobalNext}
            />

            {/* Schedule Post Modal - Quick Action */}
            <SchedulePostModal
                isOpen={!!schedulingGeneration}
                onClose={() => setSchedulingGeneration(null)}
                images={schedulingGeneration?.image_urls || []}
                defaultCaption={schedulingGeneration ? (
                    (schedulingGeneration.caption || '') +
                    ((schedulingGeneration.hashtags && schedulingGeneration.hashtags.length > 0) ? '\n\n' + schedulingGeneration.hashtags.map(h => `#${h}`).join(' ') : '')
                ) : ''}
                influencerId={schedulingGeneration?.influencer_id || selectedInfluencerId}
            />
        </div>
    );
});

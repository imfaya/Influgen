'use client';

import React, { useState, useMemo, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SchedulePostModal } from '@/components/scheduler/SchedulePostModal';
import { useGenerationStore } from '@/store';

// Context for selection mode
interface PostSchedulerContextType {
    isSelectionMode: boolean;
    selectedSeries: Set<string>; // Set of Generation IDs (series)
    toggleSeries: (generationId: string) => void;
    isSeriesSelected: (generationId: string) => boolean;
}

const PostSchedulerContext = createContext<PostSchedulerContextType | null>(null);

export function usePostScheduler() {
    return useContext(PostSchedulerContext);
}

interface PostSchedulerBubbleProps {
    isVisible: boolean;
    contentMode: 'social' | 'sensual' | 'porn';
    children?: React.ReactNode;
}

export function PostSchedulerBubble({ isVisible, contentMode, children }: PostSchedulerBubbleProps) {
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedSeries, setSelectedSeries] = useState<Set<string>>(new Set());
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { generations, selectedInfluencer } = useGenerationStore();

    // Determine images for the selected series
    // For now, we only support scheduling ONE series at a time properly (as one post), 
    // or maybe multiple posts? The prompt says "take caption and photo generated...". 
    // Let's assume selecting one series = one carousel post.
    // If multiple series selected -> multiple posts? 
    // For MVP, let's limit to 1 series selection if possible, or handle multiple.
    // Let's stick to: Select ONE series -> Schedule. 
    // BUT the bubble UI suggests multiple selection. 
    // Let's allow multiple selection, and when clicking "Schedule", we ask "Schedule as Carousel (combine) or Separate Posts?".
    // Actually, "Send to Calendar" implies scheduling. 
    // Let's just make it simple: Select 1 series -> Schedule. 
    // Update: user prompt "selectionné des series... enverrai les series qui sont complètes". Plural.
    // So probably batch scheduling?
    // Let's just pass the selected images to the modal. If multiple series, we flatten them? 
    // Or maybe we open the modal for the first one?
    // Use Case: Pick a series of 4 images -> Schedule as 1 carousel post.
    // Use Case: Pick 2 different series -> Schedule 2 different posts?
    // Let's just support selecting 1 series for now to avoid complexity in the modal.
    // Or multiple images from multiple series.

    // Actually, looking at `SeriesCreatorBubble`, it map(photo).
    // Here we select SERIES (generations).

    const toggleSeries = useCallback((generationId: string) => {
        setSelectedSeries(prev => {
            const next = new Set(prev);
            if (next.has(generationId)) {
                next.delete(generationId);
            } else {
                next.add(generationId);
            }
            return next;
        });
    }, []);

    const isSeriesSelected = useCallback((id: string) => selectedSeries.has(id), [selectedSeries]);

    const handleScheduleClick = () => {
        if (selectedSeries.size === 0) return;
        setIsModalOpen(true);
    };

    const selectedImages = useMemo(() => {
        const images: string[] = [];
        selectedSeries.forEach(id => {
            const gen = generations.find(g => g.id === id);
            if (gen) {
                images.push(...gen.image_urls);
            }
        });
        return images;
    }, [selectedSeries, generations]);

    // Color scheme
    const isSensual = contentMode === 'sensual';
    const isPorn = contentMode === 'porn';

    const colors = {
        primary: isPorn ? 'amber' : isSensual ? 'rose' : 'purple',
        bg: isPorn ? 'bg-amber-500/10 border-amber-500/30' : isSensual ? 'bg-rose-500/10 border-rose-500/30' : 'bg-purple-500/10 border-purple-500/30',
        text: isPorn ? 'text-amber-400' : isSensual ? 'text-rose-400' : 'text-purple-400',
        button: isPorn ? 'bg-amber-500 hover:bg-amber-600' : isSensual ? 'bg-rose-500 hover:bg-rose-600' : 'bg-purple-500 hover:bg-purple-600',
    };

    const defaultCaption = useMemo(() => {
        if (selectedSeries.size === 0) return '';
        const firstId = Array.from(selectedSeries)[0];
        const gen = generations.find(g => g.id === firstId);
        if (!gen) return '';
        let text = gen.caption || '';
        if (gen.hashtags && gen.hashtags.length > 0) {
            text += '\n\n' + gen.hashtags.map(h => `#${h}`).join(' ');
        }
        return text;
    }, [selectedSeries, generations]);

    const contextValue: PostSchedulerContextType = {
        isSelectionMode,
        selectedSeries,
        toggleSeries,
        isSeriesSelected
    };

    if (!isVisible) return <>{children}</>;

    return (
        <PostSchedulerContext.Provider value={contextValue}>
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className={cn(
                            "mx-3 mb-3 rounded-xl overflow-hidden backdrop-blur-sm border",
                            "bg-white/80 dark:bg-gray-800/80",
                            colors.bg
                        )}>
                            {!isSelectionMode ? (
                                <div
                                    onClick={() => setIsSelectionMode(true)}
                                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", colors.bg)}>
                                            <Calendar className={cn("w-4 h-4", colors.text)} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Post Scheduler</p>
                                            <p className="text-xs text-gray-500">Select series to schedule</p>
                                        </div>
                                    </div>
                                    <Button size="sm" className={cn("h-8 px-3 text-white", colors.button)}>
                                        Start
                                    </Button>
                                </div>
                            ) : (
                                <div className="p-3">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Calendar className={cn("w-4 h-4", colors.text)} />
                                            <span className="font-bold text-sm">Select Series</span>
                                            <span className={cn("text-xs px-2 py-0.5 rounded-full", colors.bg, colors.text)}>
                                                {selectedSeries.size} selected
                                            </span>
                                        </div>
                                        <button onClick={() => setIsSelectionMode(false)} className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedSeries(new Set())}
                                            className="flex-1 h-9"
                                        >
                                            Clear
                                        </Button>
                                        <Button
                                            onClick={handleScheduleClick}
                                            disabled={selectedSeries.size === 0}
                                            className={cn("flex-[2] h-9 text-white", colors.button)}
                                        >
                                            Schedule Post
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {children}

            <SchedulePostModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                images={selectedImages}
                defaultCaption={defaultCaption}
                influencerId={useMemo(() => {
                    if (selectedSeries.size === 0) return selectedInfluencer?.id;
                    const firstId = Array.from(selectedSeries)[0];
                    const gen = generations.find(g => g.id === firstId);
                    return gen?.influencer_id || selectedInfluencer?.id;
                }, [selectedSeries, generations, selectedInfluencer])}
            />
        </PostSchedulerContext.Provider>
    );
}

'use client';

// Central history display - Premium design with cinematic cards
// OPTIMIZED: Memoized card component and callbacks to reduce re-renders

import React, { useState, useMemo, useCallback, memo } from 'react';
import { Settings, RotateCcw, User, Sparkles, Database, Trash2, Undo2, Ban } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useGenerationStore } from '@/store';
import { useGeneration } from '@/hooks/useGeneration';
import { ImageDetailModal } from '@/components/history/ImageDetailModal';
import { useHistory } from '@/hooks/useHistory';
// Influencers are now loaded from the store, not the constant
import { Generation, PendingGeneration } from '@/types';
import { cn } from '@/lib/utils';
import { getThumbnailUrl } from '@/lib/imageUtils';

interface SelectedImage {
    imageUrl: string;
    generation: Generation;
    imageIndex: number;
}

// Memoized card component for individual generations
const GenerationCard = memo(function GenerationCard({
    generation,
    userPrompt,
    isFirstCard,
    isSensual,
    isPorn,
    hasPendingGenerations,
    influencer,
    onClick
}: {
    generation: Generation;
    userPrompt: string;
    isFirstCard: boolean;
    isSensual: boolean;
    isPorn: boolean;
    hasPendingGenerations: boolean;
    influencer: { name: string; thumbnail: string } | undefined;
    onClick: () => void;
}) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const firstImage = generation.image_urls[0];
    const hasMultipleImages = generation.image_urls.length > 1;
    const isStealIt = generation.tags?.includes('steal-it');

    return (
        <div
            className={cn(
                "generation-card relative w-full h-52 md:h-60 rounded-2xl overflow-hidden cursor-pointer",
                "transition-all duration-300 ease-out group",
                "border border-white/5",
                "hover:border-white/10",
                // First card highlight (only if no pending generations)
                isFirstCard && !hasPendingGenerations && isSensual && "border-rose-500/30",
                isFirstCard && !hasPendingGenerations && isPorn && "border-white/20",
                isFirstCard && !hasPendingGenerations && !isSensual && !isPorn && "border-cyan-500/30"
            )}
            onClick={onClick}
        >
            {/* Loading placeholder */}
            {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 animate-pulse" />
            )}

            {/* Background image - GPU accelerated with will-change */}
            <img
                src={getThumbnailUrl(firstImage, { width: 800 })}
                alt="Generation"
                className={cn(
                    "generation-card-image w-full h-full object-cover",
                    imageLoaded ? "opacity-100" : "opacity-0"
                )}
                style={{ objectPosition: 'center 35%' }}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
            />

            {/* Multi-layer gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30 pointer-events-none" />

            {/* Subtle vignette effect */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)'
            }} />

            {/* Top bar with influencer info and series badge */}
            <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-start">
                {/* Influencer avatar + name - always visible, with fallback */}
                <div className="flex items-center gap-2.5">
                    {influencer?.thumbnail ? (
                        <img
                            src={influencer.thumbnail}
                            alt={influencer.name}
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-white/20"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 ring-2 ring-white/20 flex items-center justify-center text-xs font-bold text-white">
                            {(influencer?.name || generation.influencer_name || '?').charAt(0).toUpperCase()}
                        </div>
                    )}
                    <span className="text-sm font-light text-white/80 tracking-wide">
                        {influencer?.name || generation.influencer_name || 'Unknown'}
                    </span>
                </div>

                {hasMultipleImages && !isStealIt && (
                    <div className={cn(
                        "ml-auto px-3 py-1.5 rounded-full text-xs font-medium tracking-wider",
                        "bg-black/50 backdrop-blur-sm border",
                        isSensual
                            ? "border-rose-500/30 text-rose-300"
                            : isPorn
                                ? "border-neutral-700 text-neutral-300"
                                : "border-cyan-500/30 text-cyan-300"
                    )}>
                        <span className="opacity-60">SERIES</span>
                        <span className="ml-1.5 font-semibold">+{generation.image_urls.length - 1}</span>
                    </div>
                )}
                {isStealIt && (
                    <div className={cn(
                        "ml-auto px-3 py-1.5 rounded-full text-xs font-bold tracking-widest flex items-center gap-1.5",
                        "bg-gradient-to-r from-red-600/80 to-red-800/80 backdrop-blur-sm border border-red-400/50 text-white shadow-lg shadow-red-900/40"
                    )}>
                        <Sparkles className="w-3 h-3 fill-current" />
                        <span>STEAL IT</span>
                        {hasMultipleImages && (
                            <span className="ml-1.5 pl-1.5 border-l border-white/20">
                                <span className="opacity-60 text-[10px] mr-1">SERIES</span>
                                +{generation.image_urls.length - 1}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom content area */}
            <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                {/* Prompt text - left aligned */}
                <p className={cn(
                    "text-base md:text-lg font-light tracking-wide leading-relaxed",
                    "text-white/90 line-clamp-2",
                    "transition-transform duration-300 group-hover:translate-y-[2px]"
                )}>
                    {userPrompt || (
                        <span className="text-white/30 italic">
                            Default generation
                        </span>
                    )}
                </p>

                {/* Centered accent line */}
                <div className="flex justify-center">
                    <div className={cn(
                        "mt-2 h-[1px] w-16 rounded-full opacity-0 group-hover:opacity-100",
                        "transition-all duration-500 group-hover:w-32 group-hover:translate-y-[1px]",
                        isSensual
                            ? "bg-gradient-to-r from-transparent via-rose-500 to-transparent"
                            : isPorn
                                ? "bg-gradient-to-r from-transparent via-neutral-500 to-transparent"
                                : "bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
                    )} />
                </div>
            </div>

            {/* Hover glow overlay */}
            <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                "pointer-events-none",
                isSensual
                    ? "bg-gradient-to-t from-rose-500/10 to-transparent"
                    : isPorn
                        ? "bg-gradient-to-t from-black/80 to-transparent"
                        : "bg-gradient-to-t from-cyan-500/10 to-transparent"
            )} />
        </div>
    );
});

// Grouped pending generation card - shows source image + count
interface PendingSeriesGroup {
    sourceGenerationId: string;
    sourceImageUrl: string;
    count: number;
    pendingIds: string[];
    actionType: 'continue' | 'iphone' | 'iphone_premium';
}

// Grouped pending BATCH card - for parallel OG generations
interface PendingBatchGroup {
    batchId: string;
    count: number;
    pendingIds: string[];
    influencerIds: string[];
}

const PendingBatchCard = memo(function PendingBatchCard({
    group,
    isSensual,
    isPorn,
    influencers
}: {
    group: PendingBatchGroup;
    isSensual: boolean;
    isPorn: boolean;
    influencers: any[];
}) {
    return (
        <div
            className={cn(
                "relative w-full h-52 md:h-60 rounded-2xl overflow-hidden",
                "border",
                isSensual
                    ? "bg-gradient-to-r from-rose-950/60 via-pink-900/40 to-rose-950/60 border-rose-500/30"
                    : isPorn
                        ? "bg-gradient-to-r from-neutral-900 via-stone-800/50 to-neutral-900 border-white/20"
                        : "bg-gradient-to-r from-indigo-950/60 via-violet-900/40 to-indigo-950/60 border-violet-500/30"
            )}
        >
            {/* Animated shimmer effect - simpler for batch */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={cn(
                    "absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite]",
                    isSensual
                        ? "bg-gradient-to-r from-transparent via-rose-500/10 to-transparent"
                        : isPorn
                            ? "bg-gradient-to-r from-transparent via-white/5 to-transparent"
                            : "bg-gradient-to-r from-transparent via-violet-500/10 to-transparent"
                )} />
            </div>

            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 z-10">

                {/* Influencer Avatars Stack (Top Left) */}
                {group.influencerIds && group.influencerIds.length > 0 && (
                    <div className="absolute top-3 left-3 flex -space-x-2">
                        {group.influencerIds.map((id, idx) => {
                            const inf = influencers.find(i => i.id === id);
                            if (!inf) return null;
                            return (
                                <img
                                    key={id}
                                    src={inf.thumbnail || inf.avatar}
                                    alt={inf.name}
                                    className="w-10 h-10 rounded-full ring-2 ring-black/50 object-cover"
                                    style={{ zIndex: 10 - idx }}
                                    title={inf.name}
                                />
                            );
                        })}
                    </div>
                )}

                {/* Visual Icon */}
                <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3",
                    isSensual
                        ? "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/50"
                        : isPorn
                            ? "bg-neutral-800 text-neutral-300 ring-1 ring-white/20"
                            : "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/50"
                )}>
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {/* Count badge */}
                    <div className={cn(
                        "absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center",
                        "text-xs font-bold shadow-md",
                        isSensual
                            ? "bg-rose-500 text-white"
                            : isPorn
                                ? "bg-white text-black"
                                : "bg-violet-500 text-white"
                    )}>
                        {group.count}
                    </div>
                </div>

                {/* Progress Indicators */}
                <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className={cn(
                                "w-2 h-2 rounded-full",
                                isSensual ? "bg-rose-400" : isPorn ? "bg-white/50" : "bg-violet-400"
                            )}
                            style={{
                                animation: `pulse 1s ease-in-out infinite`,
                                animationDelay: `${i * 0.15}s`
                            }}
                        />
                    ))}
                </div>

                <div className="text-center">
                    <p className={cn(
                        "text-lg font-light tracking-wide mb-1",
                        isSensual ? "text-rose-200" : isPorn ? "text-neutral-300" : "text-violet-200"
                    )}>
                        Batch Creation
                    </p>
                    <p className={cn(
                        "text-xs uppercase tracking-widest",
                        isSensual ? "text-rose-400/70" : isPorn ? "text-neutral-500" : "text-violet-400/70"
                    )}>
                        Generating {group.count} Photos...
                    </p>
                </div>
            </div>
        </div>
    );
});

const PendingSeriesCard = memo(function PendingSeriesCard({
    group,
    isSensual,
    isPorn
}: {
    group: PendingSeriesGroup;
    isSensual: boolean;
    isPorn: boolean;
}) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const isIphone = group.actionType === 'iphone' || group.actionType === 'iphone_premium';

    // Action-specific colors
    const actionColors = isIphone
        ? {
            border: 'border-emerald-500/40',
            bg: 'bg-gradient-to-r from-emerald-950/50 via-green-900/30 to-emerald-950/50',
            shimmer: 'bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent',
            ring: 'ring-emerald-500/60',
            badge: 'bg-emerald-500 text-white',
            dots: 'bg-emerald-400',
            text: 'text-emerald-300/90',
            label: '📱 iPhone Boost',
            labelBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        }
        : {
            border: isSensual ? 'border-rose-500/40' : isPorn ? 'border-white/20' : 'border-cyan-500/40',
            bg: isSensual
                ? 'bg-gradient-to-r from-rose-950/50 via-rose-900/30 to-rose-950/50'
                : isPorn
                    ? 'bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950'
                    : 'bg-gradient-to-r from-gray-800/60 via-cyan-900/30 to-gray-800/60',
            shimmer: isSensual
                ? 'bg-gradient-to-r from-transparent via-rose-500/20 to-transparent'
                : isPorn
                    ? 'bg-gradient-to-r from-transparent via-white/10 to-transparent'
                    : 'bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent',
            ring: isSensual ? 'ring-rose-500/60' : isPorn ? 'ring-white/30' : 'ring-cyan-500/60',
            badge: isSensual ? 'bg-rose-500 text-white' : isPorn ? 'bg-white text-black' : 'bg-cyan-500 text-white',
            dots: isSensual ? 'bg-rose-400' : isPorn ? 'bg-white/50' : 'bg-cyan-400',
            text: isSensual ? 'text-rose-300/90' : isPorn ? 'text-neutral-400' : 'text-cyan-300/90',
            label: '🚀 Continue Series',
            labelBg: isSensual ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : isPorn ? 'bg-white/10 text-neutral-300 border-white/20' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        };

    return (
        <div
            className={cn(
                "relative w-full h-52 md:h-60 rounded-2xl overflow-hidden",
                "border",
                actionColors.border,
                actionColors.bg
            )}
        >
            {/* Background source image (blurred) */}
            {group.sourceImageUrl && (
                <>
                    <img
                        src={getThumbnailUrl(group.sourceImageUrl, { width: 400 })}
                        alt=""
                        className={cn(
                            "absolute inset-0 w-full h-full object-cover",
                            imageLoaded ? "opacity-30" : "opacity-0",
                            "blur-sm scale-105"
                        )}
                        onLoad={() => setImageLoaded(true)}
                    />
                    <div className="absolute inset-0 bg-black/50" />
                </>
            )}

            {/* Animated shimmer effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={cn(
                    "absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]",
                    actionColors.shimmer
                )} />
            </div>

            {/* Action type badge - Top left */}
            <div className="absolute top-3 left-3 z-20">
                <div className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold tracking-wider border backdrop-blur-sm",
                    actionColors.labelBg
                )}>
                    {actionColors.label}
                </div>
            </div>

            {/* Content - Source image thumbnail + count */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
                {/* Source image thumbnail - prominent */}
                {group.sourceImageUrl && (
                    <div className="relative">
                        <img
                            src={getThumbnailUrl(group.sourceImageUrl, { width: 200 })}
                            alt="Source"
                            className={cn(
                                "w-24 h-24 rounded-xl object-cover ring-2 shadow-2xl",
                                actionColors.ring
                            )}
                        />
                        {/* Count badge */}
                        {group.count > 1 && (
                            <div className={cn(
                                "absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center",
                                "text-sm font-bold shadow-lg",
                                actionColors.badge
                            )}>
                                {group.count}
                            </div>
                        )}
                    </div>
                )}

                {/* Pulsing dots */}
                <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className={cn("w-2.5 h-2.5 rounded-full", actionColors.dots)}
                            style={{
                                animation: `pulse 1.4s ease-in-out infinite`,
                                animationDelay: `${i * 0.2}s`
                            }}
                        />
                    ))}
                </div>

                <p className={cn("text-base font-light tracking-wider", actionColors.text)}>
                    {isIphone ? 'Boosting realism...' : `Continuing series...`}
                </p>
            </div>
        </div>
    );
});

// Helper for time ago
function formatTimeAgo(date: Date) {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

// Simple pending card for single generations without source
const PendingCard = memo(({ pending, isPorn, isSensual, influencer }: { pending: PendingGeneration, isPorn: boolean, isSensual: boolean, influencer?: any }) => {

    const isStealIt = pending.tags?.includes('steal-it');

    // Override styles if Steal It (Force Red/Forbidden look even in Social mode)
    const borderColor = isStealIt
        ? "border-red-600/50"
        : isSensual
            ? "border-rose-500/20"
            : isPorn
                ? "border-white/20"
                : "border-cyan-500/20";

    const bgGradient = isStealIt
        ? "bg-gradient-to-r from-red-950/60 via-red-900/40 to-red-950/60"
        : isSensual
            ? "bg-gradient-to-r from-rose-950/40 via-rose-900/30 to-rose-950/40"
            : isPorn
                ? "bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950"
                : "bg-gradient-to-r from-gray-800/60 via-cyan-900/30 to-gray-800/60";

    const pulseColor = isStealIt
        ? "bg-red-500"
        : isSensual ? "bg-rose-400" : isPorn ? "bg-white/50" : "bg-cyan-400";

    const textColor = isStealIt
        ? "text-red-400"
        : isSensual ? "text-rose-300/80" : isPorn ? "text-neutral-400" : "text-cyan-300/80";

    return (
        <div
            className={cn(
                "relative w-full h-52 md:h-60 rounded-2xl overflow-hidden",
                "border",
                borderColor,
                bgGradient
            )}
        >
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 overflow-hidden">
                <div className={cn(
                    "absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]",
                    isStealIt
                        ? "bg-gradient-to-r from-transparent via-red-500/10 to-transparent"
                        : isSensual
                            ? "bg-gradient-to-r from-transparent via-rose-500/10 to-transparent"
                            : isPorn
                                ? "bg-gradient-to-r from-transparent via-white/5 to-transparent"
                                : "bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent"
                )} />
            </div>

            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                {/* Pulsing dots */}
                <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className={cn(
                                "w-3 h-3 rounded-full",
                                pulseColor
                            )}
                            style={{
                                animation: `pulse 1.4s ease-in-out infinite`,
                                animationDelay: `${i * 0.2}s`
                            }}
                        />
                    ))}
                </div>
                <p className={cn(
                    "text-lg font-light tracking-wider",
                    textColor
                )}>
                    {isStealIt ? "Stealing Reality..." : "Creation in progress..."}
                </p>
                {influencer && (
                    <div className="flex items-center gap-2 mt-1 opacity-70">
                        <img
                            src={influencer.thumbnail || influencer.avatar}
                            className="w-5 h-5 rounded-full"
                        />
                        <span className={cn("text-xs", textColor)}>{influencer.name}</span>
                    </div>
                )}
            </div>

            {/* Prompt preview */}
            {pending.prompt && (
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <p className={cn(
                        "text-sm font-light truncate opacity-70",
                        isSensual ? "text-rose-200" : isPorn ? "text-neutral-300" : "text-cyan-200"
                    )}>
                        {pending.prompt}
                    </p>
                </div>
            )}
        </div>
    );
});

export function CentralHistoryDisplay() {
    // 0. Specific selectors for better performance
    const generations = useGenerationStore(useCallback(state => state.generations, []));
    const contentMode = useGenerationStore(useCallback(state => state.contentMode, []));
    const pendingGenerations = useGenerationStore(useCallback(state => state.pendingGenerations, []));
    const influencers = useGenerationStore(useCallback(state => state.influencers, []));
    const selectedInfluencer = useGenerationStore(useCallback(state => state.selectedInfluencer, []));
    const getCustomBasePrompt = useGenerationStore(useCallback(state => state.getCustomBasePrompt, []));

    const { continueSeries, boostRealism, boostRealismPremium } = useGeneration();
    const { deleteGeneration, reusePrompt, downloadImage } = useHistory();
    const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
    const [renderLimit, setRenderLimit] = useState(20);

    const isSensual = contentMode === 'sensual';
    const isPorn = contentMode === 'porn';

    // 1. Efficient Filtered List with Render Capping
    const { modeGenerations, hasMore } = useMemo(() => {
        let items: Generation[] = [];
        for (let i = 0; i < generations.length; i++) {
            const gen = generations[i];
            if ((gen.content_mode || 'social') === contentMode) {
                items.push(gen);
            }
            if (items.length >= renderLimit + 1) break;
        }
        const more = items.length > renderLimit;
        return {
            modeGenerations: more ? items.slice(0, renderLimit) : items,
            hasMore: more
        };
    }, [generations, contentMode, renderLimit]);

    // Helper: Extract user prompt only (without base prompt) - memoized
    const extractUserPrompt = useCallback((generation: Generation): string => {
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
    }, [getCustomBasePrompt, influencers]);

    // Precompute user prompts for all generations
    const userPrompts = useMemo(() => {
        const prompts: Record<string, string> = {};
        modeGenerations.forEach(gen => {
            prompts[gen.id] = extractUserPrompt(gen);
        });
        return prompts;
    }, [modeGenerations, extractUserPrompt]);

    // Get images in the same series as the selected image
    const seriesImages = useMemo(() => {
        if (!selectedImage) return [];
        return selectedImage.generation.image_urls;
    }, [selectedImage]);

    const currentSeriesIndex = selectedImage?.imageIndex ?? 0;

    const userPromptOnly = useMemo(() => {
        if (!selectedImage) return '';
        return extractUserPrompt(selectedImage.generation);
    }, [selectedImage, extractUserPrompt]);

    // Memoized navigation handlers
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

    // Filter pending generations by mode ONLY (Show all active batches for this mode)
    const modePendingGenerations = useMemo(() =>
        pendingGenerations.filter((g: { contentMode: string }) =>
            g.contentMode === contentMode
        ),
        [pendingGenerations, contentMode]
    );

    // Group pending generations by sourceGenerationId (for series) OR batchId (for batch shoots)
    const { groupedPending, batchPending, ungroupedPending } = useMemo(() => {
        const grouped = new Map<string, PendingSeriesGroup>();
        const batches = new Map<string, PendingBatchGroup>();
        const ungrouped: PendingGeneration[] = [];

        for (const pending of modePendingGenerations) {
            if (pending.batchId) {
                // Handle Batch Groups
                const existing = batches.get(pending.batchId);
                // Find influencer for this pending item to show avatar
                const influencerId = pending.influencer_id;

                if (existing) {
                    existing.count++;
                    existing.pendingIds.push(pending.id);
                    // Add influencer ID if not already in the list (for multi-influencer batches)
                    if (influencerId && !existing.influencerIds.includes(influencerId)) {
                        existing.influencerIds.push(influencerId);
                    }
                } else {
                    batches.set(pending.batchId, {
                        batchId: pending.batchId,
                        count: 1,
                        pendingIds: [pending.id],
                        influencerIds: influencerId ? [influencerId] : []
                    });
                }
            } else if (pending.sourceGenerationId && pending.sourceImageUrl) {
                // Determine action type from tags
                const actionType: 'continue' | 'iphone' | 'iphone_premium' = 
                    pending.tags?.includes('realism_boost_premium') || pending.tags?.includes('realism_boost_fallback') ? 'iphone_premium'
                    : pending.tags?.includes('realism_boost') ? 'iphone'
                    : 'continue';

                // Group by sourceGenerationId + actionType for separate cards
                const groupKey = `${pending.sourceGenerationId}_${actionType}`;
                const existing = grouped.get(groupKey);
                if (existing) {
                    existing.count++;
                    existing.pendingIds.push(pending.id);
                } else {
                    grouped.set(groupKey, {
                        sourceGenerationId: pending.sourceGenerationId,
                        sourceImageUrl: pending.sourceImageUrl,
                        count: 1,
                        pendingIds: [pending.id],
                        actionType
                    });
                }
            } else {
                ungrouped.push(pending);
            }
        }

        return {
            groupedPending: Array.from(grouped.values()),
            batchPending: Array.from(batches.values()),
            ungroupedPending: ungrouped
        };
    }, [modePendingGenerations]);

    // ...

    return (
        <div className="w-full relative pb-32">
            {/* Pending generation placeholders */}
            {
                modePendingGenerations.length > 0 && (
                    <div className="flex flex-col gap-3 mb-5">
                        {/* Series pending cards (Continue / iPhone) */}
                        {groupedPending.map((group) => (
                            <PendingSeriesCard
                                key={group.pendingIds[0]}
                                group={group}
                                isSensual={isSensual}
                                isPorn={isPorn}
                            />
                        ))}
                        {/* Batch pending cards */}
                        {batchPending.map((group) => (
                            <PendingBatchCard
                                key={group.batchId}
                                group={group}
                                isSensual={isSensual}
                                isPorn={isPorn}
                                influencers={influencers} // Pass full list to look up avatars
                            />
                        ))}
                        {/* Ungrouped pending cards (regular generations without source) */}
                        {ungroupedPending.map((pending) => (
                            <PendingCard
                                key={pending.id}
                                pending={pending}
                                isSensual={isSensual}
                                isPorn={isPorn}
                                influencer={influencers.find(i => i.id === pending.influencer_id)}
                            />
                        ))}
                    </div>
                )
            }

            {/* Cinematic cards for each GENERATION */}
            <div className="flex flex-col gap-5">
                {modeGenerations.map((generation, genIndex) => {
                    // Try to find influencer by ID first, then by name
                    const cardInfluencer = influencers.find(i => i.id === generation.influencer_id)
                        || influencers.find(i => i.name === generation.influencer_name);
                    return (
                        <GenerationCard
                            key={generation.id}
                            generation={generation}
                            userPrompt={userPrompts[generation.id]}
                            isFirstCard={genIndex === 0}
                            isSensual={isSensual}
                            isPorn={isPorn}
                            hasPendingGenerations={modePendingGenerations.length > 0}
                            influencer={cardInfluencer}
                            onClick={() => setSelectedImage({
                                imageUrl: generation.image_urls[0],
                                generation,
                                imageIndex: 0,
                            })}
                        />
                    );
                })}
            </div>

            {/* Load More Button for Main Gallery */}
            {
                hasMore && (
                    <div className="flex justify-center py-6">
                        <Button
                            variant="outline"
                            className={cn(
                                "px-8 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-light tracking-widest uppercase transition-all duration-300",
                                isSensual ? "text-rose-300 border-rose-500/20" : "text-cyan-300 border-cyan-500/20"
                            )}
                            onClick={() => setRenderLimit(prev => prev + 20)}
                        >
                            Load More Generations
                        </Button>
                    </div>
                )
            }

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
                onSeriesSelect={(index) => {
                    if (!selectedImage) return;
                    const images = selectedImage.generation.image_urls;
                    if (index >= 0 && index < images.length) {
                        setSelectedImage({
                            ...selectedImage,
                            imageUrl: images[index],
                            imageIndex: index
                        });
                    }
                }}
                userPromptOnly={userPromptOnly}
                isSensual={isSensual}
            />
        </div >
    );
}

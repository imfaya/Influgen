'use client';

// Premium fullscreen image modal with fluid animations
// Features: Copy prompt (without base), Continue series button, Series navigation

import React, { useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Generation } from '@/types';
import { cn } from '@/lib/utils';
import { useGenerationStore } from '@/store'; // Import store
import { supabase } from '@/lib/supabase';
import { Reorder, AnimatePresence, motion } from 'framer-motion';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';


interface ImageDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    generation: Generation | null;
    imageIndex: number;
    // Series navigation
    seriesImages: string[];
    currentSeriesIndex: number;
    onSeriesPrev: () => void;
    onSeriesNext: () => void;
    // Actions
    onDownload: (url: string) => void;
    onReusePrompt: () => void;
    onContinueSeries: () => void;
    onDelete: () => void;
    // User prompt only (without base prompt)
    userPromptOnly: string;
    isSensual?: boolean;
    onSeriesSelect?: (index: number) => void;
    onRealismBoost?: () => void;
    onRealismBoostPremium?: () => void;
    isTrashMode?: boolean;
    // Context-aware navigation (Global history)
    onGlobalPrev?: () => void;
    onGlobalNext?: () => void;
}

export function ImageDetailModal({
    isOpen,
    onClose,
    imageUrl: propImageUrl,
    generation: propGeneration,
    imageIndex,
    seriesImages,
    currentSeriesIndex,
    onSeriesPrev,
    onSeriesNext,
    onDownload,
    onReusePrompt,
    onContinueSeries,
    onDelete,
    userPromptOnly: propUserPromptOnly,
    isSensual = false,
    onSeriesSelect,
    onRealismBoost,
    onRealismBoostPremium,
    isTrashMode = false,
    onGlobalPrev,
    onGlobalNext,
}: ImageDetailModalProps) {
    // Store access
    const { updateGeneration, moveToTrash, restoreFromTrash, permanentDelete, trash } = useGenerationStore();


    // Cache data to persist it during exit animation
    const [cachedGeneration, setCachedGeneration] = useState<Generation | null>(null);
    const [cachedImageUrl, setCachedImageUrl] = useState<string>('');
    const [cachedUserPrompt, setCachedUserPrompt] = useState<string>('');

    // Update cache when props are valid
    useEffect(() => {
        if (propGeneration) setCachedGeneration(propGeneration);
        if (propImageUrl) setCachedImageUrl(propImageUrl);
        if (propUserPromptOnly) setCachedUserPrompt(propUserPromptOnly);
    }, [propGeneration, propImageUrl, propUserPromptOnly]);

    // Use cached data if props are null (during closing)
    const generation = propGeneration || cachedGeneration;
    const imageUrl = propImageUrl || cachedImageUrl;
    const userPromptOnly = propUserPromptOnly || cachedUserPrompt;

    const [imageLoaded, setImageLoaded] = useState(false);
    const [copied, setCopied] = useState(false);
    const [localImages, setLocalImages] = useState<string[]>(seriesImages);
    const [isDownloadingSeries, setIsDownloadingSeries] = useState(false);

    // Sync local images with prop when modal opens or series changes
    useEffect(() => {
        setLocalImages(seriesImages);
    }, [seriesImages]);

    // State for mounting/unmounting with animation
    const [isRendered, setIsRendered] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Copy user prompt to clipboard
    const handleCopyPrompt = useCallback(async () => {
        if (!userPromptOnly) return;
        try {
            await navigator.clipboard.writeText(userPromptOnly);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }, [userPromptOnly]);

    // Lock body AND main element scroll when modal opens
    useEffect(() => {
        const mainElement = document.querySelector('main');

        if (isOpen) {
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = `${scrollbarWidth}px`;

            if (mainElement) {
                mainElement.style.overflow = 'hidden';
            }

            setIsRendered(true);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setIsVisible(true);
                });
            });
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => {
                setIsRendered(false);
            }, 300);
            return () => {
                clearTimeout(timer);
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
                if (mainElement) mainElement.style.overflow = '';
            };
        }

        return () => {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            if (mainElement) mainElement.style.overflow = '';
        };
    }, [isOpen]);

    // Reset image loaded state when image changes
    useEffect(() => {
        setImageLoaded(false);
    }, [imageUrl]);

    // Only allow keyboard navigation if this is a series
    const hasSeriesNav = seriesImages.length > 1;
    const canGoPrev = hasSeriesNav && currentSeriesIndex > 0;
    const canGoNext = hasSeriesNav && currentSeriesIndex < seriesImages.length - 1;

    // Keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return;

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            // Prioritize series navigation if available, otherwise global
            if (canGoPrev) {
                onSeriesPrev();
            } else if (onGlobalPrev) {
                onGlobalPrev();
            }
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            // Prioritize series navigation if available, otherwise global
            if (canGoNext) {
                onSeriesNext();
            } else if (onGlobalNext) {
                onGlobalNext();
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    }, [isOpen, canGoPrev, canGoNext, onSeriesPrev, onSeriesNext, onGlobalPrev, onGlobalNext, onClose]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const { selectedInfluencer, contentMode } = useGenerationStore();
    const isPorn = contentMode === 'porn';
    const [caption, setCaption] = useState('');
    const [hashtags, setHashtags] = useState<string[]>([]);
    const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
    const [captionCopied, setCaptionCopied] = useState(false);

    // Resizable prompt height
    const [promptHeight, setPromptHeight] = useState(80);
    const [isResizingPrompt, setIsResizingPrompt] = useState(false);

    // Reset caption/hashtags when image changes or load from existing generation
    useEffect(() => {
        if (generation) {
            setCaption(generation.caption || '');
            setHashtags(generation.hashtags || []);
        } else {
            setCaption('');
            setHashtags([]);
        }
    }, [imageUrl, generation]); // Depend on imageUrl to reset, generic generation update might cause loops if not careful? No, generation object ref changes on update


    // Auto-generate caption for Quick Post or Series
    useEffect(() => {
        // Check generation.caption immediately to avoid race condition with state hydration
        const hasExistingCaption = !!generation?.caption || !!caption;

        if (!isOpen || !generation || hasExistingCaption || isGeneratingCaption || captionCopied) return;

        const isQuickPost = generation.tags?.includes('quick_post');
        const isSeries = generation.is_series;

        if (isQuickPost || isSeries) {
            generateCaption();
        }
    }, [isOpen, generation, caption, isGeneratingCaption]);


    // Auto-generate caption if it's a series image (Simulated by checking prop if needed, or manual trigger)
    // User requested "automatically generate". But to be safe and save costs, let's trigger it 
    // only if the user expands the dedicated section or maybe just a button.
    // For now, let's keep it manual via button but highly visible.

    const generateCaption = async () => {
        setIsGeneratingCaption(true);
        try {
            const response = await fetch('/api/generate-caption', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    influencerName: selectedInfluencer.name,
                    imageDescription: userPromptOnly || 'A generated influencer photo',
                    contentMode: contentMode,
                }),
            });
            const data = await response.json();
            if (data.caption) {
                setCaption(data.caption);
                setHashtags(data.hashtags || []);
                // Save immediately
                await saveCaptionToGraph(data.caption, data.hashtags || []);
            }

        } catch (error) {
            console.error('Failed to generate caption', error);
        } finally {
            setIsGeneratingCaption(false);
        }
    };

    const saveCaptionToGraph = async (newCaption: string, newHashtags: string[]) => {
        if (!generation) return;

        // Update local store
        updateGeneration(generation.id, {
            caption: newCaption,
            hashtags: newHashtags
        });

        // Update DB
        try {
            await supabase
                .from('generations')
                .update({
                    caption: newCaption,
                    hashtags: newHashtags
                })
                .eq('id', generation.id);
        } catch (err) {
            console.error('Failed to save caption to DB', err);
        }
    };

    const handleBlur = () => {
        if (caption !== generation?.caption || JSON.stringify(hashtags) !== JSON.stringify(generation?.hashtags)) {
            saveCaptionToGraph(caption, hashtags);
        }
    };


    const copyCaptionData = () => {
        const text = `${caption}\n\nSuggested #: ${hashtags.map(h => `#${h}`).join(' ')}`;
        navigator.clipboard.writeText(text);
        setCaptionCopied(true);
        setTimeout(() => setCaptionCopied(false), 2000);
    };

    const handleReorder = (newOrder: string[]) => {
        setLocalImages(newOrder);
        // Look up the NEW index of the CURRENT image to keep the view consistent if possible
        // But for now, we just update order.

        // Update Store
        if (generation) {
            updateGeneration(generation.id, {
                image_urls: newOrder
            });

            // Persist to DB
            supabase.from('generations')
                .update({ image_urls: newOrder })
                .eq('id', generation.id)
                .then(({ error }: { error: any }) => {
                    if (error) console.error("Failed to reorder", error);
                });
        }
    };

    const handleDeleteImage = (indexToDelete: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!generation) return;

        // Optimistic UI update handled by store, but we need to handle the "Close Modal" if it was the last image
        // Or "Switch Image" if it was the current image.

        const imageToDelete = localImages[indexToDelete];
        const isCurrent = imageToDelete === imageUrl;
        const remainingImages = localImages.filter((_, i) => i !== indexToDelete);

        // 1. Move to trash (Store update)
        const trashId = moveToTrash(generation.id, imageToDelete, indexToDelete);

        // 2. Show Undo Toast
        toast("Image moved to trash", {
            action: {
                label: 'Undo',
                onClick: () => restoreFromTrash(trashId),
            },
            duration: 4000,
        });

        // 3. Handle Navigation / Close
        if (remainingImages.length === 0) {
            onDelete(); // Close modal effectively
            return;
        }

        // Update local state to reflect change immediately (animation)
        setLocalImages(remainingImages);

        // If we deleted the active image, switch to neighbor
        if (isCurrent) {
            const nextIndex = Math.min(indexToDelete, remainingImages.length - 1);
            if (onSeriesSelect) {
                onSeriesSelect(nextIndex);
            }
        }
    };

    const handleRestore = useCallback(() => {
        if (!generation) return;

        // Find the trash item ID by generation ID or Image URL
        // Store doesn't easily give us trash ID from generation ID unless we search
        // But we passed generation object which might be the one stored in trash

        const trashItem = trash.find(t =>
            (t.type === 'full_generation' && t.originalGenerationId === generation.id) ||
            (t.type === 'single_image' && t.imageUrl === imageUrl)
        );

        if (trashItem) {
            restoreFromTrash(trashItem.id);
            onDelete(); // Close modal
            toast("Restored from trash");
        } else {
            // Fallback if not found (shouldn't happen)
            toast.error("Could not restore item");
        }
    }, [generation, imageUrl, trash, restoreFromTrash, onDelete]);

    const handlePermanentDelete = useCallback(() => {
        if (!generation) return;

        const trashItem = trash.find(t =>
            (t.type === 'full_generation' && t.originalGenerationId === generation.id) ||
            (t.type === 'single_image' && t.imageUrl === imageUrl)
        );

        if (trashItem) {
            permanentDelete(trashItem.id);
            onDelete(); // Close modal
            toast("Permanently deleted");
        }
    }, [generation, imageUrl, trash, permanentDelete, onDelete]);


    const handleDownloadSeries = async () => {
        if (isDownloadingSeries) return;
        setIsDownloadingSeries(true);
        try {
            const zip = new JSZip();
            const folder = zip.folder("series");

            if (!folder) return;

            // Add caption
            const captionText = `${caption}\n\n${hashtags.map(t => `#${t}`).join(' ')}\n\nPrompt: ${userPromptOnly}`;
            folder.file("caption.txt", captionText);

            // Add images
            const promises = localImages.map(async (url, i) => {
                try {
                    const response = await fetch(url);
                    const blob = await response.blob();
                    folder.file(`image_${i + 1}.png`, blob);
                } catch (e) {
                    console.error("Failed to fetch image", url, e);
                }
            });

            await Promise.all(promises);

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `series_${generation?.id?.slice(0, 8) || 'download'}.zip`);

        } catch (error) {
            console.error("Failed to zip series", error);
        } finally {
            setIsDownloadingSeries(false);
        }
    };

    if (!isRendered) return null;
    if (!generation) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 0.3s ease-out',
                pointerEvents: 'auto'
            }}
            onClick={onClose}
            onWheel={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
            onTouchMove={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
        >
            {/* Side Glow Effects - Visual cue for navigation - Refined: Rounder & Centered */}
            {onGlobalPrev && (
                <div className={cn(
                    "fixed left-0 top-1/2 -translate-y-1/2 h-[50vh] w-32 pointer-events-none z-[100] transition-opacity duration-500 ease-in-out",
                    "rounded-r-full blur-[60px] opacity-40",
                    isSensual ? "bg-rose-500" :
                        isPorn ? "bg-white" :
                            "bg-cyan-500"
                )} />
            )}

            {onGlobalNext && (
                <div className={cn(
                    "fixed right-0 top-1/2 -translate-y-1/2 h-[50vh] w-32 pointer-events-none z-[100] transition-opacity duration-500 ease-in-out",
                    "rounded-l-full blur-[60px] opacity-40",
                    isSensual ? "bg-rose-500" :
                        isPorn ? "bg-white" :
                            "bg-cyan-500"
                )} />
            )}

            {/* Global Previous Arrow - "Outside of everything" */}
            {onGlobalPrev && (
                <button
                    onClick={(e) => { e.stopPropagation(); onGlobalPrev(); }}
                    className="fixed left-4 md:left-8 top-1/2 -translate-y-1/2 z-[110] p-4 rounded-full bg-black/40 hover:bg-black/80 backdrop-blur-md text-white/50 hover:text-white transition-all duration-300 border border-white/5 hover:border-white/20 group hidden md:flex"
                    aria-label="Previous Image"
                >
                    <svg className="w-8 h-8 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            )}

            {/* Global Next Arrow - "Outside of everything" */}
            {onGlobalNext && (
                <button
                    onClick={(e) => { e.stopPropagation(); onGlobalNext(); }}
                    className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-[110] p-4 rounded-full bg-black/40 hover:bg-black/80 backdrop-blur-md text-white/50 hover:text-white transition-all duration-300 border border-white/5 hover:border-white/20 group hidden md:flex"
                    aria-label="Next Image"
                >
                    <svg className="w-8 h-8 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            )}

            <div className="flex flex-col lg:flex-row items-center justify-center gap-6 p-4 lg:p-8 max-w-7xl w-full h-full relative">
                {/* Image & Series Card Wrapper - Flex column to align cards with image */}
                <div className="flex flex-col items-center justify-center relative flex-1 w-full max-w-5xl">
                    {/* Image Container */}
                    <div
                        className="relative flex items-center justify-center w-full mb-20 lg:mb-24" // Added margin bottom for cards space
                        style={{
                            transform: isVisible ? 'scale(1)' : 'scale(0.9)',
                            opacity: isVisible ? 1 : 0,
                            transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease-out',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className={cn(
                                "absolute inset-0 rounded-2xl blur-3xl opacity-20",
                                isSensual ? "bg-rose-500" : isPorn ? "bg-white/20" : "bg-cyan-500"
                            )}
                            style={{ transform: 'scale(1.05)' }}
                        />

                        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                            {canGoPrev && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onSeriesPrev(); }}
                                    className={cn(
                                        "absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full",
                                        "bg-black/50 hover:bg-black/70 backdrop-blur-sm",
                                        "border border-white/20",
                                        "transition-all duration-200",
                                        "hover:scale-110 active:scale-95",
                                        "text-white"
                                    )}
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                            )}

                            {canGoNext && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onSeriesNext(); }}
                                    className={cn(
                                        "absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full",
                                        "bg-black/50 hover:bg-black/70 backdrop-blur-sm",
                                        "border border-white/20",
                                        "transition-all duration-200",
                                        "hover:scale-110 active:scale-95",
                                        "text-white"
                                    )}
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            )}

                            {/* Trash Mode Overlays */}
                            {isTrashMode && (
                                <div className="absolute inset-0 bg-red-900/10 pointer-events-none z-10 border-4 border-red-500/30 rounded-2xl flex items-start justify-center pt-8">
                                    <Badge className="bg-red-500 text-white border-none shadow-lg px-4 py-1.5 text-sm z-20 pointer-events-auto">
                                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Deleted Item
                                    </Badge>
                                </div>
                            )}

                            <img

                                src={imageUrl}
                                alt="Detailed Image"
                                className={cn(
                                    "max-h-[60vh] lg:max-h-[75vh] w-auto", // Slightly reduced max-height to fit cards better
                                    "transition-opacity duration-300 ease-out",
                                    imageLoaded ? "opacity-100" : "opacity-0"
                                )}
                                onLoad={() => setImageLoaded(true)}
                                draggable={false}
                            />

                            {!imageLoaded && (
                                <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-pulse min-w-[300px] min-h-[400px]" />
                            )}

                            {hasSeriesNav && (
                                <div className={cn(
                                    "absolute top-3 left-3 z-20",
                                    "px-3 py-1.5 rounded-full",
                                    "bg-black/70 backdrop-blur-md border border-white/20",
                                    "text-sm font-semibold shadow-lg"
                                )}>
                                    <span className={isSensual ? "text-rose-400" : isPorn ? "text-neutral-400" : "text-cyan-400"}>{currentSeriesIndex + 1}</span>
                                    <span className="text-gray-400 mx-1">/</span>
                                    <span className="text-gray-300">{seriesImages.length}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Series "Hand of Cards" Manager - Now positioned relative to this column */}
                    {generation && localImages.length > 1 && (

                        <div
                            className="absolute bottom-0 left-0 right-0 z-[110] flex justify-center pointer-events-none"
                            style={{ transform: "translateY(20px)" }} // Small offset adjustment
                        >
                            <div className="rounded-2xl p-4 pointer-events-auto overflow-visible flex justify-center items-end h-32 w-full perspective-[1000px]">
                                <Reorder.Group
                                    axis="x"
                                    values={localImages}
                                    onReorder={handleReorder}
                                    className="flex items-end justify-center min-w-min"
                                    style={{
                                        // Reduced overlap for better dropping zone
                                        marginLeft: localImages.length > 1 ? '-20px' : 0
                                    }}
                                >
                                    {localImages.map((img, index) => {
                                        const centerIndex = (localImages.length - 1) / 2;
                                        const dist = index - centerIndex;
                                        // Rotation: spread out from center
                                        const rotate = dist * 5;
                                        // Y Offset: Absolute distance from center pushes down (inverted U)
                                        const yOffset = Math.abs(dist) * 8;

                                        return (
                                            <Reorder.Item
                                                key={img}
                                                value={img}
                                                whileDrag={{ scale: 1.1, zIndex: 100, y: -10 }}
                                                style={{
                                                    rotate: rotate,
                                                    y: yOffset,
                                                    zIndex: localImages.length - Math.abs(Math.round(dist)), // Higher overlap for center items
                                                    marginLeft: index === 0 ? 0 : '-20px', // Less overlap
                                                    transformOrigin: "bottom center",
                                                }}
                                                className="relative group origin-bottom"
                                            >
                                                <motion.div
                                                    whileHover={{
                                                        scale: 1.25,
                                                        y: -30,
                                                        rotate: 0,
                                                        zIndex: 200,
                                                        transition: { type: "spring", stiffness: 400, damping: 25 }
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSeriesSelect?.(index);
                                                    }}
                                                    className={cn(
                                                        "w-16 h-24 lg:w-20 lg:h-28 rounded-xl cursor-pointer transition-shadow shadow-2xl border-2 relative bg-gray-900",
                                                        img === imageUrl
                                                            ? (isSensual ? "border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.6)]" : isPorn ? "border-white shadow-[0_0_20px_rgba(255,255,255,0.6)]" : "border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.6)]")
                                                            : "border-white/20 hover:border-white/80"
                                                    )}
                                                >
                                                    <div className="relative w-full h-full rounded-[10px] overflow-hidden">
                                                        <img src={img} className="w-full h-full object-cover" alt="" draggable={false} />

                                                        {/* Index Badge */}
                                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent text-[9px] text-white text-center py-1 pt-2 pointer-events-none font-medium">
                                                            {index + 1}
                                                        </div>
                                                    </div>

                                                    {/* Delete Button (hover) - Improved visibility */}
                                                    <button
                                                        onClick={(e) => handleDeleteImage(index, e)}
                                                        className="absolute -top-3 -right-3 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 z-[200] shadow-lg scale-0 group-hover:scale-100 border-2 border-white/20 input-cursor-pointer"
                                                        title="Remove from series"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </motion.div>
                                            </Reorder.Item>
                                        );
                                    })}
                                </Reorder.Group>
                            </div>
                        </div>
                    )}
                </div>

                {/* Info Panel with Caption Generator */}
                <div
                    className={cn(
                        "w-full lg:w-80 flex-shrink-0 relative", // Increased width
                        "bg-gray-900/95 backdrop-blur-xl",
                        "rounded-2xl",
                        "border border-white/10",
                        "p-5 overflow-y-auto max-h-[80vh]",
                        "shadow-2xl"
                    )}
                    style={{
                        transform: isVisible ? 'translateX(0)' : 'translateX(30px)',
                        opacity: isVisible ? 1 : 0,
                        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.1s, opacity 0.3s ease-out 0.1s',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {isTrashMode ? (
                        <div className="flex flex-col h-full justify-between items-center py-10">
                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 rounded-full bg-red-400/20 flex items-center justify-center mx-auto text-red-400">
                                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-white">Deleted Item</h3>
                                <p className="text-sm text-gray-400 max-w-xs mx-auto">
                                    This item is in the trash. You can restore it to your gallery or permanently delete it.
                                </p>
                            </div>

                            <div className="w-full space-y-3 px-6">
                                <Button
                                    className="w-full bg-white text-black hover:bg-gray-200"
                                    onClick={handleRestore}
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                    </svg>
                                    Restore to Gallery
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                    onClick={handlePermanentDelete}
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                    </svg>
                                    Permanently Delete
                                </Button>
                            </div>

                            <div className="absolute top-3 right-3 z-10">
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="absolute top-3 right-3 z-10">

                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4 mt-8">
                                {generation.is_series && (
                                    <Badge className={cn("text-xs px-2.5 py-0.5", isSensual ? "bg-rose-500/20 text-rose-300 border-rose-500/30" : isPorn ? "bg-neutral-800 text-neutral-300 border-neutral-700" : "bg-cyan-500/20 text-cyan-300 border-cyan-500/30")}>
                                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                                        </svg>
                                        Series
                                    </Badge>
                                )}
                                <Badge variant="outline" className="text-xs px-2.5 py-0.5 text-gray-400 border-gray-600">
                                    {generation.parameters.aspectRatio}
                                </Badge>
                            </div>

                            <div className="space-y-4">
                                {/* Caption Generator Section */}
                                <div className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 p-4 border border-white/10">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                                            <span className="text-lg">✨</span> Post Caption
                                        </h4>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={generateCaption}
                                            disabled={isGeneratingCaption}
                                            className={cn(
                                                "h-6 w-6 p-0 rounded-full",
                                                "text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
                                            )}
                                            title="Regenerate Caption"
                                        >
                                            <svg className={cn("w-3.5 h-3.5", isGeneratingCaption && "animate-spin")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </Button>
                                    </div>
                                    {caption || hashtags.length > 0 ? (
                                        <div className="space-y-3">
                                            <div className="relative">
                                                <div className="absolute top-2 right-2 z-10">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-6 w-6 text-gray-400 hover:text-white hover:bg-white/10"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(caption);
                                                            setCaptionCopied(true);
                                                            setTimeout(() => setCaptionCopied(false), 2000);
                                                        }}
                                                        title="Copy Caption"
                                                    >
                                                        {captionCopied ? (
                                                            <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                                            </svg>
                                                        )}
                                                    </Button>
                                                </div>
                                                <textarea
                                                    value={caption}
                                                    onChange={(e) => setCaption(e.target.value)}
                                                    onBlur={handleBlur}
                                                    className="w-full bg-black/30 border-0 rounded-lg p-3 pr-10 text-sm text-gray-200 focus:ring-1 focus:ring-white/20 min-h-[160px] resize-y"
                                                    placeholder="Caption..."
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex justify-between items-center px-1">
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Suggested #</p>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-5 w-5 text-gray-500 hover:text-white hover:bg-white/10"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(hashtags.map(h => `#${h}`).join(' '));
                                                        }}
                                                        title="Copy Hashtags"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                                        </svg>
                                                    </Button>
                                                </div>

                                                <div
                                                    className="bg-black/30 rounded-lg p-2 min-h-[60px] flex flex-wrap gap-1.5 content-start cursor-text hover:bg-black/40 transition-colors"
                                                    onClick={() => document.getElementById('hashtag-detail-input')?.focus()}
                                                >
                                                    {hashtags.map((tag, i) => (
                                                        <span
                                                            key={i}
                                                            className="group flex items-center gap-1 text-xs text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded hover:bg-purple-500/20 transition-colors"
                                                        >
                                                            #{tag}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const newTags = [...hashtags];
                                                                    newTags.splice(i, 1);
                                                                    setHashtags(newTags);
                                                                }}
                                                                className="ml-0.5 text-purple-300/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all font-bold"
                                                            >
                                                                ×
                                                            </button>
                                                        </span>
                                                    ))}
                                                    <input
                                                        id="hashtag-detail-input"
                                                        className="flex-1 bg-transparent border-0 text-xs text-gray-300 focus:ring-0 p-0 min-w-[60px] placeholder:text-gray-600 h-6"
                                                        placeholder={hashtags.length === 0 ? "Add tags..." : ""}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                const val = e.currentTarget.value.trim().replace(/^#/, '');
                                                                if (val && !hashtags.includes(val)) {
                                                                    setHashtags([...hashtags, val]);
                                                                    e.currentTarget.value = '';
                                                                } else if (val && hashtags.includes(val)) {
                                                                    e.currentTarget.value = ''; // Clear if duplicate
                                                                }
                                                            }
                                                            if (e.key === 'Backspace' && e.currentTarget.value === '' && hashtags.length > 0) {
                                                                const newTags = [...hashtags];
                                                                newTags.pop();
                                                                setHashtags(newTags);
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 px-2 border border-dashed border-white/10 rounded-lg">
                                            <p className="text-xs text-gray-400 mb-2">Create a caption for this post</p>
                                            <Button
                                                size="sm"
                                                onClick={generateCaption}
                                                disabled={isGeneratingCaption}
                                                className={cn(
                                                    "w-full h-8 text-xs font-semibold",
                                                    isSensual
                                                        ? "bg-rose-500 hover:bg-rose-600 text-white"
                                                        : isPorn
                                                            ? "bg-neutral-100 hover:bg-white text-black"
                                                            : "bg-cyan-500 hover:bg-cyan-600 text-black"
                                                )}
                                            >
                                                {isGeneratingCaption ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                                        Generating...
                                                    </span>
                                                ) : (
                                                    "GENERATE CAPTION"
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Prompt Info - Resizable */}
                                <div
                                    className="p-2.5 rounded-lg bg-white/5 relative"
                                    style={{ minHeight: '60px' }}
                                >
                                    <h4 className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Prompt</h4>
                                    {userPromptOnly && (
                                        <button
                                            onClick={handleCopyPrompt}
                                            className="absolute top-2 right-2 p-1 rounded bg-white/5 hover:bg-white/15 text-white/50 hover:text-white transition-all"
                                            title="Copy prompt"
                                        >
                                            {copied ? (
                                                <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            )}
                                        </button>
                                    )}
                                    <div
                                        className="text-sm text-gray-300 leading-relaxed overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10"
                                        style={{ height: `${promptHeight}px`, resize: 'vertical', minHeight: '40px', maxHeight: '300px' }}
                                    >
                                        {userPromptOnly || <span className="text-gray-500 italic">No custom prompt</span>}
                                    </div>
                                    {/* Resize Handle */}
                                    <div
                                        className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize flex items-center justify-center hover:bg-white/10 rounded-b-lg transition-colors group"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            setIsResizingPrompt(true);
                                            const startY = e.clientY;
                                            const startHeight = promptHeight;

                                            const handleMouseMove = (moveEvent: MouseEvent) => {
                                                const delta = moveEvent.clientY - startY;
                                                const newHeight = Math.min(300, Math.max(40, startHeight + delta));
                                                setPromptHeight(newHeight);
                                            };

                                            const handleMouseUp = () => {
                                                setIsResizingPrompt(false);
                                                document.removeEventListener('mousemove', handleMouseMove);
                                                document.removeEventListener('mouseup', handleMouseUp);
                                            };

                                            document.addEventListener('mousemove', handleMouseMove);
                                            document.addEventListener('mouseup', handleMouseUp);
                                        }}
                                    >
                                        <div className="w-8 h-1 bg-gray-600 rounded-full group-hover:bg-gray-400 transition-colors" />
                                    </div>
                                </div>

                                {/* Date */}
                                <div className="p-2.5 rounded-lg bg-white/5">
                                    <h4 className="text-[10px] uppercase tracking-widest text-gray-500 mb-0.5">Created</h4>
                                    <p className="text-xs text-gray-300">{formatDate(generation.created_at)}</p>
                                </div>
                            </div>

                            <div className="space-y-2 mt-5 pt-4 border-t border-white/10">
                                <Button
                                    size="sm"
                                    className={cn(
                                        "w-full justify-center h-10 font-semibold transition-all",
                                        isSensual
                                            ? "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white"
                                            : isPorn
                                                ? "bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700"
                                                : "bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
                                    )}
                                    onClick={() => { onContinueSeries(); onClose(); }}
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                    </svg>
                                    Continue Series
                                </Button>

                                {/* Realism Boost Buttons - Split into Standard and Premium */}
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        size="sm"
                                        className={cn(
                                            "w-full justify-center h-10 font-semibold transition-all text-xs",
                                            "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                                        )}
                                        onClick={() => { onRealismBoost?.(); onClose(); }}
                                    >
                                        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                        iPhone
                                    </Button>
                                    <Button
                                        size="sm"
                                        className={cn(
                                            "w-full justify-center h-10 font-semibold transition-all text-xs",
                                            "bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30",
                                            "text-amber-300 border border-amber-500/30"
                                        )}
                                        onClick={() => { onRealismBoostPremium?.(); onClose(); }}
                                    >
                                        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                        </svg>
                                        Premium
                                    </Button>
                                </div>

                                {/* Series Download Button */}
                                {localImages.length > 1 && (
                                    <Button
                                        size="sm"
                                        className="w-full justify-center bg-indigo-500/10 hover:bg-indigo-500/20 border-0 text-indigo-400 mb-2"
                                        onClick={handleDownloadSeries}
                                        disabled={isDownloadingSeries}
                                    >
                                        {isDownloadingSeries ? (
                                            <span className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                                Zipping...
                                            </span>
                                        ) : (
                                            <>
                                                <svg className="w-3.5 h-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                Download Series ({localImages.length})
                                            </>
                                        )}
                                    </Button>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        size="sm"
                                        className="w-full justify-center bg-white/10 hover:bg-white/15 border-0 text-white"
                                        onClick={() => onDownload(imageUrl)}
                                    >
                                        <svg className="w-3.5 h-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download
                                    </Button>

                                    <Button
                                        size="sm"
                                        className="w-full justify-center bg-red-500/10 hover:bg-red-500/20 border-0 text-red-400"
                                        onClick={onDelete}
                                    >
                                        <svg className="w-3.5 h-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete All
                                    </Button>
                                </div>
                            </div>
                        </>

                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

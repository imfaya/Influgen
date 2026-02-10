'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useGenerationStore } from '@/store';
import { cn } from '@/lib/utils';

interface CustomScrollbarProps {
    scrollContainerRef: React.RefObject<HTMLElement | null>;
}

/**
 * Custom Floating Scrollbar Component
 * A stylized, futuristic scrollbar that replaces the native browser scrollbar
 * - Positioned on the right side of the workspace
 * - Mode-aware theming (cyan/rose/amber)
 * - Smooth animations and neon glow effects
 */
export function CustomScrollbar({ scrollContainerRef }: CustomScrollbarProps) {
    const { contentMode, isHistoryPanelOpen } = useGenerationStore();
    const [scrollPercentage, setScrollPercentage] = useState(0);
    const [thumbHeight, setThumbHeight] = useState(100);
    const [isDragging, setIsDragging] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [dragOffset, setDragOffset] = useState(0); // Offset from top of thumb when drag starts
    const trackRef = useRef<HTMLDivElement>(null);

    // Update scroll position
    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
            const maxScroll = scrollHeight - clientHeight;

            if (maxScroll <= 0) {
                setScrollPercentage(0);
                setThumbHeight(100);
                return;
            }

            const percentage = (scrollTop / maxScroll) * 100;
            setScrollPercentage(percentage);

            // Calculate thumb height based on viewport vs total height ratio
            const viewportRatio = (clientHeight / scrollHeight) * 100;
            setThumbHeight(Math.max(viewportRatio, 10)); // Minimum 10%
        };

        handleScroll(); // Initial calculation
        scrollContainer.addEventListener('scroll', handleScroll);

        // Recalculate on resize
        const resizeObserver = new ResizeObserver(handleScroll);
        resizeObserver.observe(scrollContainer);

        return () => {
            scrollContainer.removeEventListener('scroll', handleScroll);
            resizeObserver.disconnect();
        };
    }, [scrollContainerRef]);

    // Handle drag to scroll
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();

        const track = trackRef.current;
        const scrollContainer = scrollContainerRef.current;
        if (!track || !scrollContainer) return;

        const trackRect = track.getBoundingClientRect();
        const clickY = e.clientY - trackRect.top;
        const trackHeight = trackRect.height;

        // Calculate current thumb position in pixels
        const thumbHeightPx = (thumbHeight / 100) * trackHeight;
        const thumbTopPx = (scrollPercentage * (100 - thumbHeight) / 100 / 100) * trackHeight;

        // Check if clicking on thumb itself
        const clickedOnThumb = clickY >= thumbTopPx && clickY <= thumbTopPx + thumbHeightPx;

        if (clickedOnThumb) {
            // Store offset from top of thumb
            setDragOffset(clickY - thumbTopPx);
        } else {
            // Clicked on track - jump to position with animation
            const percentage = Math.max(0, Math.min(1, clickY / trackHeight));
            const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
            const targetScroll = percentage * maxScroll;

            // Custom smooth scroll animation (fast and professional)
            const startScroll = scrollContainer.scrollTop;
            const distance = targetScroll - startScroll;
            const duration = 200; // 200ms - quick but smooth
            const startTime = performance.now();

            const animateScroll = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease out cubic for smooth deceleration
                const easeOutCubic = 1 - Math.pow(1 - progress, 3);

                scrollContainer.scrollTop = startScroll + (distance * easeOutCubic);

                if (progress < 1) {
                    requestAnimationFrame(animateScroll);
                }
            };

            requestAnimationFrame(animateScroll);
            setDragOffset(0); // Reset offset for track clicks
        }

        // Set dragging for continuous movement
        setIsDragging(true);
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const scrollContainer = scrollContainerRef.current;
            const track = trackRef.current;
            if (!scrollContainer || !track) return;

            const trackRect = track.getBoundingClientRect();
            const trackHeight = trackRect.height;
            const mouseY = e.clientY - trackRect.top;

            // Adjust for drag offset to keep cursor at same position on thumb
            const adjustedMouseY = mouseY - dragOffset;

            // Calculate scroll position based on adjusted position
            const percentage = Math.max(0, Math.min(1, adjustedMouseY / trackHeight));
            const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
            scrollContainer.scrollTop = percentage * maxScroll;
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, scrollContainerRef, dragOffset]);

    // Sober dark monochrome color scheme (no mode variations)
    const colors = {
        track: 'bg-gradient-to-b from-gray-800/30 via-gray-700/40 to-gray-800/30',
        trackBorder: 'border border-gray-700/20',
        trackShadow: 'shadow-[inset_0_0_8px_rgba(0,0,0,0.3)]',
        thumb: 'bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800',
        thumbBorder: 'border border-gray-600/50',
        thumbShadow: 'shadow-[0_0_8px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.1),inset_0_-1px_2px_rgba(0,0,0,0.3)]',
    };

    // Don't show if content doesn't scroll
    if (thumbHeight >= 100) return null;

    return (
        <div
            className={cn(
                'fixed top-16 bottom-0 z-40 transition-all duration-300 flex items-center justify-center',
                isHistoryPanelOpen ? 'right-[380px]' : 'right-[30px]',
                'w-20' // Wider container for better centering
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Track - Centered and compact */}
            <div
                ref={trackRef}
                className={cn(
                    'relative h-[60vh] w-10 rounded-2xl transition-opacity duration-300 backdrop-blur-sm',
                    colors.track,
                    colors.trackBorder,
                    colors.trackShadow,
                    'opacity-70' // Static opacity, no hover changes
                )}
                onMouseDown={handleMouseDown}
                style={{
                    scrollBehavior: 'smooth',
                    scrollbarWidth: 'none'
                }}
            >
                {/* Center line decoration */}
                <div className="absolute inset-y-2 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-gray-600/30 to-transparent" />

                {/* Thumb - Instant visual updates */}
                <div
                    className={cn(
                        'absolute inset-x-1 rounded-xl cursor-grab active:cursor-grabbing',
                        colors.thumb,
                        colors.thumbBorder,
                        colors.thumbShadow // Static shadow always
                    )}
                    style={{
                        height: `${thumbHeight}%`,
                        top: `${scrollPercentage * (100 - thumbHeight) / 100}%`,
                    }}
                    onMouseDown={handleMouseDown}
                >
                    {/* Top highlight for 3D effect */}
                    <div className="absolute inset-x-2 top-1 h-1/3 bg-gradient-to-b from-white/40 via-white/20 to-transparent rounded-t-xl" />

                    {/* Center grip lines */}
                    <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                        <div className="w-px h-3 bg-white/30 rounded-full" />
                        <div className="w-px h-3 bg-white/30 rounded-full" />
                        <div className="w-px h-3 bg-white/30 rounded-full" />
                    </div>

                    {/* Bottom shadow for depth */}
                    <div className="absolute inset-x-2 bottom-1 h-1/4 bg-gradient-to-t from-black/30 to-transparent rounded-b-xl" />
                </div>
            </div>
        </div>
    );
}

'use client';

import React, { useEffect, useRef } from 'react';
import { useGenerationStore } from '@/store';
import { ContentMode } from '@/types';

// Color Palettes for different modes (More subtle variants)
const PALETTES: Record<ContentMode, string[]> = {
    social: [
        'rgba(6, 182, 212, 0.3)',    // Cyan-500 (Subtle)
        'rgba(139, 92, 246, 0.25)',  // Violet-500 (Subtle)
        'rgba(37, 99, 235, 0.25)'    // Blue-600 (Subtle)
    ],
    sensual: [
        'rgba(244, 63, 94, 0.35)',   // Rose-500 (Softer)
        'rgba(236, 72, 153, 0.3)',   // Pink-500 (Softer)
        'rgba(168, 85, 247, 0.25)'   // Purple-500 (Softer)
    ],
    porn: [
        'rgba(245, 158, 11, 0.35)',  // Amber-500 (Softer)
        'rgba(239, 68, 68, 0.35)',   // Red-500 (Softer)
        'rgba(217, 119, 6, 0.3)'     // Amber-600 (Softer)
    ]
};

/**
 * Premium Fluid Background V2
 * - Mode-Aware: Changes colors based on content mode (Cyan/Rose/Amber)
 * - Aurora Style: Large, smooth gradient meshes
 * - High Performance: Optimized canvas rendering
 */
export function FluidBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contentMode = useGenerationStore((state) => state.contentMode);

    // Refs for animation state to avoid re-renders or stale closures in loop
    const modeRef = useRef(contentMode);
    const orbsRef = useRef<any[]>([]);

    // Update mode ref when state changes
    useEffect(() => {
        console.log('[FluidBackground] Mode changed to:', contentMode);
        modeRef.current = contentMode;
    }, [contentMode]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let time = 0; // Global time for color cycling

        // Mouse state (smooth interpolation)
        const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

        // Helper: Parse rgba string to [r,g,b,a]
        function parseColor(colorStr: string) {
            const result = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (!result) return [0, 0, 0, 0];
            return [
                parseInt(result[1]),
                parseInt(result[2]),
                parseInt(result[3]),
                parseFloat(result[4] || '1')
            ];
        }

        // Helper: Format [r,g,b,a] to string
        function formatColor(rgba: number[]) {
            return `rgba(${Math.round(rgba[0])}, ${Math.round(rgba[1])}, ${Math.round(rgba[2])}, ${rgba[3]})`;
        }

        // Helper: Linear Interpolation for arrays
        function lerpColor(current: number[], target: number[], speed: number) {
            return current.map((c, i) => c + (target[i] - c) * speed);
        }

        // Initialize Orbs (Subtle, ambient particles)
        const initOrbs = () => {
            const orbCount = 8; // Reduced for subtlety
            const newOrbs = [];

            for (let i = 0; i < orbCount; i++) {
                newOrbs.push(createOrb(true)); // true = initial spawn (can be anywhere)
            }
            orbsRef.current = newOrbs;
        };

        // Create a single orb
        const createOrb = (initial = false) => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const currentPalette = PALETTES[modeRef.current];
            const colorIndex = Math.floor(Math.random() * currentPalette.length);

            return {
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.3, // Slower, more ambient movement
                vy: (Math.random() - 0.5) * 0.3,
                r: Math.random() * 150 + 200, // Smaller radius: 200 - 350
                colorIndex: colorIndex,
                currentColor: parseColor(currentPalette[colorIndex]),
                opacity: initial ? Math.random() * 0.1 : 0, // Start very subtle
                targetOpacity: Math.random() * 0.12 + 0.05, // Max opacity 0.05 - 0.17 (Very subtle)
                life: 0,
                maxLife: Math.random() * 600 + 400, // Longer life cycles for smoother transitions
                phase: initial ? 'sustain' : 'in' // in, sustain, out
            };
        };

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            ctx.scale(dpr, dpr);
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouse.targetX = e.clientX;
            mouse.targetY = e.clientY;
        };

        const render = () => {
            if (!ctx || !canvas) return;

            time += 0.005;

            // Clear with deep base (Zinc-950/Black)
            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

            // Smooth mouse
            mouse.x += (mouse.targetX - mouse.x) * 0.05;
            mouse.y += (mouse.targetY - mouse.y) * 0.05;

            // Get target palette based on current mode
            const targetPalette = PALETTES[modeRef.current];

            // Update and Render Orbs
            orbsRef.current.forEach((orb, i) => {
                // Lifecycle Management
                if (orb.phase === 'in') {
                    orb.opacity += 0.005;
                    if (orb.opacity >= orb.targetOpacity) {
                        orb.opacity = orb.targetOpacity;
                        orb.phase = 'sustain';
                    }
                } else if (orb.phase === 'sustain') {
                    orb.life++;
                    if (orb.life > orb.maxLife) {
                        orb.life = 0;
                        orb.phase = 'out';
                    }
                } else if (orb.phase === 'out') {
                    orb.opacity -= 0.005;
                    if (orb.opacity <= 0) {
                        // Respawn
                        const newOrb = createOrb();
                        Object.assign(orb, newOrb); // Update existing object to avoid GC
                    }
                }

                // Color Transition
                const targetColorStr = targetPalette[orb.colorIndex % targetPalette.length];
                let targetColor = parseColor(targetColorStr);

                // Lerp current color
                orb.currentColor = lerpColor(orb.currentColor, targetColor, 0.05);

                // Apply current opacity to color
                const renderColor = [...orb.currentColor];
                renderColor[3] = orb.opacity;

                // Move
                orb.x += orb.vx;
                orb.y += orb.vy;

                // Bounce off edges (keep them in view mostly) or wrap? 
                // Let's wrap but with a buffer so they don't pop
                const buffer = orb.r;
                const width = window.innerWidth;
                const height = window.innerHeight;

                if (orb.x < -buffer) orb.x = width + buffer;
                if (orb.x > width + buffer) orb.x = -buffer;
                if (orb.y < -buffer) orb.y = height + buffer;
                if (orb.y > height + buffer) orb.y = -buffer;

                // Draw Gradient
                const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
                gradient.addColorStop(0, formatColor(renderColor));
                gradient.addColorStop(1, 'rgba(0,0,0,0)');

                ctx.globalCompositeOperation = 'screen';
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
                ctx.fill();
            });

            // --- Interactive Mouse Spotlight with Color Cycling ---
            // Cycle through palette colors based on time
            const colorCount = targetPalette.length;
            const period = 5; // seconds per color cycle approx
            const t = (time % period) / period * colorCount;
            const index1 = Math.floor(t) % colorCount;
            const index2 = (index1 + 1) % colorCount;
            const mix = t - Math.floor(t);

            const c1 = parseColor(targetPalette[index1]);
            const c2 = parseColor(targetPalette[index2]);
            const spotColorRgba = lerpColor(c1, c2, mix);

            const spotlightGradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 600);

            // Adjust opacity for spotlight (very subtle)
            const spotColorStr = `rgba(${Math.round(spotColorRgba[0])}, ${Math.round(spotColorRgba[1])}, ${Math.round(spotColorRgba[2])}, 0.06)`; // Much more subtle
            spotlightGradient.addColorStop(0, spotColorStr);
            spotlightGradient.addColorStop(1, 'rgba(0,0,0,0)');

            ctx.fillStyle = spotlightGradient;
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 600, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalCompositeOperation = 'source-over';
            animationFrameId = requestAnimationFrame(render);
        };

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleMouseMove);

        resize();
        initOrbs();
        render();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []); // Empty dependency array - logic handles updates via refs

    return (
        <div className="fixed inset-0 -z-10 bg-[#050505] overflow-hidden pointer-events-none transition-colors duration-1000">
            {/* Grid Overlay */}
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
                    backgroundSize: '30px 30px'
                }}
            />

            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full block mix-blend-screen"
            />
        </div>
    );
}

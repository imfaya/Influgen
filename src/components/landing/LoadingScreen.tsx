'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface LoadingScreenProps {
    onLoadingComplete: () => void;
}

const loadingMessages = [
    "Initializing creative engine...",
    "Loading AI models...",
    "Preparing your studio...",
    "Almost ready...",
];

export function LoadingScreen({ onLoadingComplete }: LoadingScreenProps) {
    const [progress, setProgress] = useState(0);
    const [messageIndex, setMessageIndex] = useState(0);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Progress animation
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    return 100;
                }
                // Easing: faster at start, slower near end
                const increment = Math.max(1, Math.floor((100 - prev) / 10));
                return Math.min(100, prev + increment);
            });
        }, 50);

        // Message cycling
        const messageInterval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
        }, 600);

        // Complete after ~2.5s
        const completeTimeout = setTimeout(() => {
            setIsExiting(true);
            setTimeout(onLoadingComplete, 600); // Wait for exit animation
        }, 2500);

        return () => {
            clearInterval(progressInterval);
            clearInterval(messageInterval);
            clearTimeout(completeTimeout);
        };
    }, [onLoadingComplete]);

    return (
        <div
            className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0a] transition-all duration-600 ${isExiting ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
                }`}
        >
            {/* Flowing wave background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="loading-wave loading-wave-1" />
                <div className="loading-wave loading-wave-2" />
                <div className="loading-wave loading-wave-3" />
            </div>

            {/* Organic blob shapes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="loading-blob loading-blob-1" />
                <div className="loading-blob loading-blob-2" />
                <div className="loading-blob loading-blob-3" />
            </div>

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center">
                {/* Animated Logo */}
                <div className="loading-logo-container mb-8">
                    <div className="loading-logo-glow" />
                    <div className="loading-logo-ring" />
                    <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-2xl relative z-10 loading-logo">
                        <Image
                            src="/logo.jpg"
                            alt="InfluGen"
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                            priority
                        />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-bold mb-4 loading-title">
                    <span className="loading-title-text">InfluGen Studio</span>
                </h1>

                {/* Loading message */}
                <p className="text-gray-400 text-sm mb-8 h-5 loading-message">
                    {loadingMessages[messageIndex]}
                </p>

                {/* Progress bar */}
                <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden relative">
                    <div className="loading-progress-glow" />
                    <div
                        className="loading-progress-bar h-full rounded-full transition-all duration-100"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Percentage */}
                <p className="text-gray-500 text-xs mt-3 font-mono">
                    {progress}%
                </p>
            </div>
        </div>
    );
}

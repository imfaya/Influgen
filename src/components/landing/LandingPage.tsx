'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface LandingPageProps {
    onStartCreating: () => void;
}

// Function to play the welcome sound
function playWelcomeSound() {
    const audio = new Audio('/audio/welcome-sound.wav');
    audio.volume = 0.5;
    audio.currentTime = 2; // Skip the first 2 seconds
    audio.play().catch(() => { });
}

export function LandingPage({ onStartCreating }: LandingPageProps) {
    const [isVisible, setIsVisible] = useState(false);

    const handleStartCreating = () => {
        playWelcomeSound();
        onStartCreating();
    };

    useEffect(() => {
        // Fade in on mount
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 100);

        return () => {
            clearTimeout(timer);
        };
    }, []);

    return (
        <div className={`min-h-screen relative overflow-hidden landing-page transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Animated gradient background */}
            <div className="landing-gradient-bg" />

            {/* Flowing wave shapes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="landing-wave landing-wave-1" />
                <div className="landing-wave landing-wave-2" />
                <div className="landing-wave landing-wave-3" />
            </div>

            {/* Organic blob shapes - slow drift */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="landing-blob landing-blob-1" />
                <div className="landing-blob landing-blob-2" />
                <div className="landing-blob landing-blob-3" />
            </div>

            {/* Main content */}
            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
                {/* Glass card hero */}
                <div className="landing-glass-card p-12 max-w-2xl w-full text-center">
                    {/* Logo */}
                    <div className="landing-logo-container mx-auto mb-8">
                        <div className="landing-logo-glow" />
                        <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl relative z-10">
                            <Image
                                src="/logo.jpg"
                                alt="InfluGen"
                                width={80}
                                height={80}
                                className="w-full h-full object-cover"
                                priority
                            />
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-5xl md:text-6xl font-bold mb-4 landing-title">
                        InfluGen Studio
                    </h1>

                    {/* Subtitle */}
                    <p className="text-gray-400 text-lg md:text-xl mb-3 landing-subtitle">
                        Create stunning AI-generated content
                    </p>

                    {/* Tagline */}
                    <p className="text-gray-500 text-sm mb-10">
                        Powered by cutting-edge AI • Designed for creators
                    </p>

                    {/* CTA Button */}
                    <button
                        onClick={handleStartCreating}
                        className="landing-cta-button group"
                    >
                        <span className="landing-cta-glow" />
                        <span className="landing-cta-content">
                            <span>Start Creating</span>
                            <svg
                                className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </span>
                    </button>

                    {/* Feature badges */}
                    <div className="flex flex-wrap justify-center gap-3 mt-10">
                        <span className="landing-badge">
                            <span className="landing-badge-dot" />
                            AI-Powered
                        </span>
                        <span className="landing-badge">
                            <span className="landing-badge-dot" />
                            Real-time Generation
                        </span>
                        <span className="landing-badge">
                            <span className="landing-badge-dot" />
                            Premium Quality
                        </span>
                    </div>
                </div>

                {/* Bottom gradient line */}
                <div className="landing-bottom-line mt-16" />
            </div>
        </div>
    );
}

'use client';

// Category selector for switching between Social and Sensual content modes

import React from 'react';
import { useGenerationStore } from '@/store';
import { ContentMode } from '@/types';

// Instagram + TikTok combined icon for social mode
const SocialIcon = () => (
    <div className="relative w-12 h-12 flex items-center justify-center">
        {/* Instagram icon */}
        <svg viewBox="0 0 24 24" className="w-8 h-8 absolute -left-1" fill="none">
            <defs>
                <linearGradient id="ig-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FFDC80" />
                    <stop offset="25%" stopColor="#FCAF45" />
                    <stop offset="50%" stopColor="#F77737" />
                    <stop offset="75%" stopColor="#F56040" />
                    <stop offset="100%" stopColor="#C13584" />
                </linearGradient>
            </defs>
            <rect x="2" y="2" width="20" height="20" rx="6" stroke="url(#ig-gradient)" strokeWidth="2" fill="none" />
            <circle cx="12" cy="12" r="4" stroke="url(#ig-gradient)" strokeWidth="2" fill="none" />
            <circle cx="18" cy="6" r="1.5" fill="url(#ig-gradient)" />
        </svg>
        {/* TikTok icon */}
        <svg viewBox="0 0 24 24" className="w-7 h-7 absolute -right-1 -bottom-0.5" fill="none">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.88 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .55.04.81.11V9.4a6.27 6.27 0 00-.81-.05A6.34 6.34 0 003.14 15.7a6.34 6.34 0 006.35 6.35 6.34 6.34 0 006.35-6.35V9.72a8.16 8.16 0 004.75 1.52V7.79a4.85 4.85 0 01-1-.1z" fill="#25F4EE" />
            <path d="M17.47 6.69a4.83 4.83 0 01-3.77-4.25V2h-1.33v13.67a2.89 2.89 0 01-2.88 2.88 2.89 2.89 0 01-2.6-1.64 2.89 2.89 0 004.48-2.39V2h2.13v.44a4.83 4.83 0 003.97 4.25z" fill="#FE2C55" opacity="0.8" />
        </svg>
    </div>
);

// Flame/Sensual icon for erotic mode
const SensualIcon = () => (
    <div className="relative w-12 h-12 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none">
            <defs>
                <linearGradient id="flame-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ff4757" />
                    <stop offset="50%" stopColor="#c93a5e" />
                    <stop offset="100%" stopColor="#8b1e3f" />
                </linearGradient>
            </defs>
            {/* Flame shape */}
            <path
                d="M12 2C12 2 8 6 8 10c0 2.5 1.5 4 3 5-1-1-1.5-2.5-1-4 .5 2 2 3 3 3s2-1 2-2.5c0-1-1-2-1-2s1.5 0.5 2.5 2c1 1.5 1.5 3.5 1.5 5 0 3.5-3 6-6 6s-6-2.5-6-6c0-4 4-8 4-8"
                fill="url(#flame-gradient)"
            />
            {/* Inner glow */}
            <path
                d="M12 8c0 0 -1.5 2 -1.5 4 0 1.5 1 2.5 2 3 0.5-0.5 1-1.5 1-2.5 0-1.5-1.5-4.5-1.5-4.5z"
                fill="#ff6b7a"
                opacity="0.7"
            />
        </svg>
    </div>
);

// 18+ Icon for Porn Mode
const PornIcon = () => (
    <div className="relative w-12 h-12 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none">
            <defs>
                <linearGradient id="gold-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#B8860B" />
                    <stop offset="50%" stopColor="#DAA520" />
                    <stop offset="100%" stopColor="#FFD700" />
                </linearGradient>
            </defs>
            {/* Circle Outline */}
            <circle cx="12" cy="12" r="10" stroke="url(#gold-gradient)" strokeWidth="1.5" fill="none" opacity="0.8" />

            {/* 18+ Text */}
            <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="url(#gold-gradient)" fontSize="9" fontWeight="bold" letterSpacing="-0.5">
                18+
            </text>
        </svg>
    </div>
);

interface CategoryCardProps {
    mode: ContentMode;
    icon: React.ReactNode;
    title: string;
    description: string;
    isActive: boolean;
    onClick: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
    mode,
    icon,
    title,
    description,
    isActive,
    onClick,
}) => {
    const isSensual = mode === 'sensual';
    const isPorn = mode === 'porn';

    return (
        <button
            onClick={onClick}
            className={`
                group relative flex flex-col items-center justify-center p-5 rounded-2xl
                transition-all duration-300 ease-out cursor-pointer
                border-2 min-w-[140px]
                ${isActive
                    ? isSensual
                        ? 'bg-gradient-to-br from-rose-900/40 to-purple-900/40 border-rose-500/60 shadow-lg shadow-rose-500/20'
                        : isPorn
                            ? 'bg-gradient-to-br from-neutral-900/60 to-amber-900/40 border-amber-400/60 shadow-lg shadow-amber-500/20'
                            : 'bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/30 dark:to-orange-900/30 border-pink-400/60 shadow-lg shadow-pink-500/20'
                    : 'bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
                hover:scale-[1.02]
            `}
        >
            <div className="relative z-10 flex flex-col items-center gap-2">
                <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                    {icon}
                </div>

                <div className="text-center">
                    <h3 className={`font-semibold text-sm ${isActive
                        ? isSensual
                            ? 'text-rose-300'
                            : isPorn
                                ? 'text-amber-300'
                                : 'text-gray-900 dark:text-white'
                        : 'text-gray-700 dark:text-gray-300'
                        }`}>
                        {title}
                    </h3>
                    <p className={`text-xs mt-0.5 ${isActive && isSensual
                        ? 'text-rose-400/80'
                        : isPorn
                            ? 'text-amber-400/80'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                        {description}
                    </p>
                </div>
            </div>
        </button>
    );
};

export function CategorySelector() {
    const { contentMode, setContentMode } = useGenerationStore();

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Category cards */}
            <div className="flex gap-4 justify-center">
                <CategoryCard
                    mode="social"
                    icon={<SocialIcon />}
                    title="Social"
                    description="Instagram & TikTok"
                    isActive={contentMode === 'social'}
                    onClick={() => setContentMode('social')}
                />

                <CategoryCard
                    mode="sensual"
                    icon={<SensualIcon />}
                    title="Sensual"
                    description="Boudoir & Intimate"
                    isActive={contentMode === 'sensual'}
                    onClick={() => setContentMode('sensual')}
                />

                <CategoryCard
                    mode="porn"
                    icon={<PornIcon />}
                    title="PORN"
                    description="X-Rated & Explicit"
                    isActive={contentMode === 'porn'}
                    onClick={() => setContentMode('porn')}
                />
            </div>

            {/* Mode indicator */}
            <p className={`text-sm font-medium transition-colors duration-300 ${contentMode === 'sensual'
                ? 'text-rose-400'
                : contentMode === 'porn'
                    ? 'text-amber-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                {contentMode === 'social'
                    ? '✨ Create stunning social media content'
                    : contentMode === 'porn'
                        ? '🔞 Generate explicit, high-quality adult content'
                        : '🔥 Generate alluring, artistic imagery'
                }
            </p>
        </div>
    );
}

'use client';

// Header component for InfluGen Studio

import React from 'react';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme-toggle';
import { useGenerationStore } from '@/store';
import { cn } from '@/lib/utils';

export function Header() {
    const { contentMode } = useGenerationStore();
    const isSensual = contentMode === 'sensual';
    const isPorn = contentMode === 'porn';

    const [hasMounted, setHasMounted] = React.useState(false);

    React.useEffect(() => {
        setHasMounted(true);
    }, []);

    // Prevent hydration mismatch by ensuring content matches server-side default until mounted
    if (!hasMounted) {
        return (
            <header className="h-16 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg">
                        <Image
                            src="/logo.jpg"
                            alt="InfluGen Logo"
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold gradient-text-clip" style={{
                            background: 'linear-gradient(90deg, #FF6B9D, #FF9E80, #4ECDC4, #FF9E80, #FF6B9D)',
                            backgroundSize: '200% auto',
                            animation: 'titleShimmer 3s ease-in-out infinite',
                        }}>InfluGen Studio</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">AI Image Generation</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-20 h-5 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                </div>
            </header>
        );
    }

    return (
        <header className={cn(
            "h-16 border-b backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-50 transition-colors duration-300",
            isSensual ? "border-rose-200 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-950/20" :
                isPorn ? "border-amber-500/20 dark:border-amber-500/20 bg-amber-50/50 dark:bg-[#0a0a00]/50" :
                    "border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80"
        )}>
            <div className="flex items-center gap-3">
                {/* Logo */}
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg">
                    <Image
                        src="/logo.jpg"
                        alt="InfluGen Logo"
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Title */}
                <div>
                    {isSensual ? (
                        <h1
                            key="sensual-title"
                            className="text-xl font-bold gradient-text-clip"
                            style={{
                                background: 'linear-gradient(90deg, #8b1e3f, #c93a5e, #e8849a, #c93a5e, #8b1e3f)',
                                backgroundSize: '200% auto',
                                animation: 'titleShimmer 3s ease-in-out infinite',
                            }}
                        >
                            InfluGen Studio
                        </h1>
                    ) : isPorn ? (
                        <h1
                            key="porn-title"
                            className="text-xl font-bold gradient-text-clip"
                            style={{
                                background: 'linear-gradient(90deg, #B8860B, #FFD700, #FFFACD, #FFD700, #B8860B)',
                                backgroundSize: '200% auto',
                                animation: 'titleShimmer 3s ease-in-out infinite',
                            }}
                        >
                            InfluGen Studio
                        </h1>
                    ) : (
                        <h1
                            key="social-title"
                            className="text-xl font-bold gradient-text-clip"
                            style={{
                                background: 'linear-gradient(90deg, #FF6B9D, #FF9E80, #4ECDC4, #FF9E80, #FF6B9D)',
                                backgroundSize: '200% auto',
                                animation: 'titleShimmer 3s ease-in-out infinite',
                            }}
                        >
                            InfluGen Studio
                        </h1>
                    )}
                    <p className={cn(
                        "text-xs font-medium",
                        isSensual ? "text-rose-400" : isPorn ? "text-amber-500" : "text-gray-500 dark:text-gray-400"
                    )}>
                        {isSensual ? 'Sensual Boudoir' : isPorn ? 'X-Rated & Explicit' : 'AI Image Generation'}
                    </p>
                </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-4">
                <div className={cn(
                    "text-sm",
                    isSensual ? "text-rose-300" : isPorn ? "text-amber-500" : "text-gray-500 dark:text-gray-400"
                )}>
                    <span className="inline-flex items-center gap-1">
                        <span className={cn(
                            "w-2 h-2 rounded-full animate-pulse",
                            isSensual ? "bg-rose-400" : isPorn ? "bg-amber-500" : "bg-green-400"
                        )}></span>
                        Ready
                    </span>
                </div>
                <ThemeToggle />
            </div>
        </header>
    );
}

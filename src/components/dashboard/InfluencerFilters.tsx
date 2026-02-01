'use client';

import React from 'react';
import { Filter, User } from 'lucide-react';

interface InfluencerFiltersProps {
    statusFilter: 'all' | 'active' | 'inactive';
    sortOrder: 'newest' | 'oldest';
    onStatusChange: (status: 'all' | 'active' | 'inactive') => void;
    onSortChange: (sort: 'newest' | 'oldest') => void;
}

export const InfluencerFilters: React.FC<InfluencerFiltersProps> = ({
    statusFilter,
    sortOrder,
    onStatusChange,
    onSortChange,
}) => {
    return (
        <div className="flex flex-col md:flex-row gap-4 items-center justify-end">
            {/* Sort Toggle Button */}
            <button
                onClick={() => onSortChange(sortOrder === 'newest' ? 'oldest' : 'newest')}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-full border border-gray-200 dark:border-white/5 transition-all hover:bg-white/10 dark:hover:bg-white/5 group"
            >
                <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-cyan-500 transition-colors" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
                </span>
            </button>

            {/* Status Filter (Fluid Slider) */}
            <div
                className="relative flex items-center bg-white/5 dark:bg-black/20 backdrop-blur-md p-1 rounded-full border border-gray-200 dark:border-white/5 h-12 w-[300px] cursor-pointer touch-none select-none"
                onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    if (percent < 0.33) onStatusChange('all');
                    else if (percent < 0.66) onStatusChange('active');
                    else onStatusChange('inactive');
                }}
                onPointerMove={(e) => {
                    if (e.buttons > 0) { // dragging
                        const rect = e.currentTarget.getBoundingClientRect();
                        const percent = (e.clientX - rect.left) / rect.width;
                        if (percent < 0.33) onStatusChange('all');
                        else if (percent < 0.66) onStatusChange('active');
                        else onStatusChange('inactive');
                    }
                }}
            >
                {/* Sliding Bubble Background */}
                <div
                    className={`absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-out z-0 ${statusFilter === 'active'
                        ? 'bg-green-500/10 border border-green-500/50 shadow-[0_0_20px_rgba(74,222,128,0.3)]'
                        : statusFilter === 'inactive'
                            ? 'bg-gray-200 dark:bg-zinc-800/50 border border-gray-300 dark:border-white/10' // Inactive: Visible but subtle
                            : 'bg-white dark:bg-zinc-800 shadow-sm border border-gray-200 dark:border-white/5' // All
                        }`}
                    style={{
                        left: statusFilter === 'all' ? '4px' : statusFilter === 'active' ? '33.33%' : '66.66%',
                        width: 'calc(33.33% - 4px)',
                        // Adjust position slightly for the middle/end items to account for padding
                        transform: statusFilter === 'active' ? 'translateX(2px)' : statusFilter === 'inactive' ? 'translateX(-2px)' : 'none'
                    }}
                />

                {(['all', 'active', 'inactive'] as const).map((status) => (
                    <div
                        key={status}
                        className={`relative z-10 w-1/3 h-full rounded-full text-sm font-medium transition-colors duration-300 flex items-center justify-center pointer-events-none ${statusFilter === status
                            ? status === 'active'
                                ? 'text-green-500'
                                : 'text-gray-900 dark:text-white'
                            : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        {status === 'all' && 'All'}
                        {status === 'active' && 'Active'}
                        {status === 'inactive' && 'Inactive'}
                    </div>
                ))}
            </div>
        </div>
    );
};

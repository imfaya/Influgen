'use client';

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import InstagramCallbackContent from './InstagramCallbackContent';

// Loading fallback for Suspense
function LoadingFallback() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
            <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Loading...</h1>
        </div>
    );
}

export default function InstagramCallbackPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <InstagramCallbackContent />
        </Suspense>
    );
}

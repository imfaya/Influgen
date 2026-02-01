'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { InfluencerWorkspace } from '@/components/workspace/InfluencerWorkspace';

export default function WorkspacePage() {
    const router = useRouter();
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const handleBack = () => {
        router.push('/');
    };

    if (!hasMounted) {
        return null;
    }

    return <InfluencerWorkspace onBack={handleBack} />;
}

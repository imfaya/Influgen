'use client';

// Main application page - Influencer Hub (Grid)
import React from 'react';
import { useRouter } from 'next/navigation';
import { InfluencerGrid } from '@/components/dashboard/InfluencerGrid';
import { useGenerationStore } from '@/store';

export default function Home() {
  const router = useRouter();
  const { setSelectedInfluencer, influencers } = useGenerationStore();

  const handleSelectInfluencer = (id: string) => {
    // Find the influencer in our dynamic list
    const influencer = influencers.find(i => i.id === id);
    if (influencer) {
      setSelectedInfluencer(influencer);
    }
    // Navigate to the workspace page
    router.push('/workspace');
  };

  return <InfluencerGrid onSelectInfluencer={handleSelectInfluencer} />;
}

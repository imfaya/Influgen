'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthContext';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (user && profile) {
      // Authenticated - redirect to user dashboard
      router.replace(`/${profile.username}/dashboard`);
    } else {
      // Not authenticated - redirect to login
      router.replace('/auth/login');
    }
  }, [user, profile, loading, router]);

  // Show loading while checking auth state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
        <p className="text-zinc-400">Loading InfluGen...</p>
      </div>
    </div>
  );
}

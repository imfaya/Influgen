'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Clock,
    Trash2,
    MoreHorizontal,
    ExternalLink,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { supabaseAuth as supabase } from '@/lib/supabase-auth';
import { ScheduledPost } from '@/types';
import { InstagramConnect } from '@/components/integrations/InstagramConnect';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
    startOfWeek,
    endOfWeek,
    parseISO
} from 'date-fns';

export function CalendarView() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [posts, setPosts] = useState<ScheduledPost[]>([]);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
    const [viewImageIndex, setViewImageIndex] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Fetch
    useEffect(() => {
        checkInstagramConnection();
        fetchScheduledPosts();
    }, []);

    const checkInstagramConnection = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setIsLoading(false);
            return;
        }

        const { data } = await supabase
            .from('instagram_accounts')
            .select('id')
            .eq('user_id', user.id)
            .single();

        setIsConnected(!!data);
        setIsLoading(false);
    };

    const [influencers, setInfluencers] = useState<any[]>([]);

    const fetchScheduledPosts = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('scheduled_posts')
            .select('*')
            .eq('user_id', user.id)
            .order('scheduled_time', { ascending: true });

        if (error) {
            console.error('Error fetching posts:', error);
        } else {
            setPosts(data || []);
        }

        // Fetch influencers for avatars
        const { data: influencersData } = await supabase
            .from('influencers')
            .select('id, name, avatar_url')
            .eq('user_id', user.id);

        if (influencersData) {
            setInfluencers(influencersData);
        }
    };

    const handleDelete = async (postId: string) => {
        const { error } = await supabase
            .from('scheduled_posts')
            .delete()
            .eq('id', postId);

        if (error) {
            toast.error('Failed to delete scheduled post');
        } else {
            toast.success('Post deleted');
            setPosts(posts.filter(p => p.id !== postId));
            setSelectedPost(null);
        }
    };

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    // Calendar Grid Logic
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getPostsForDay = (day: Date) => {
        return posts.filter(post => isSameDay(parseISO(post.scheduled_time), day));
    };

    if (!isLoading && !isConnected) {
        return (
            <div className="flex flex-col items-center justify-center h-[600px] border border-dashed border-gray-200 dark:border-gray-800 rounded-3xl bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
                <div className="p-4 bg-purple-100 dark:bg-purple-500/10 rounded-full mb-4">
                    <CalendarIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Connect Instagram</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md px-4">
                    Link your Instagram Business account to access the premium scheduler and automate your content.
                </p>
                <InstagramConnect />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] bg-white dark:bg-[#0A0A0A] rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-[#0A0A0A]/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
                        {format(currentDate, 'MMMM yyyy')}
                    </h2>
                    <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                        <button onClick={prevMonth} className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-all">
                            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-3 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-all">
                            Today
                        </button>
                        <button onClick={nextMonth} className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-all">
                            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Stats / Legend (Optional) */}
                <div className="flex gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span> Pending
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Published
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-[auto_1fr] bg-gray-50 dark:bg-[#111]">
                {/* Weekday Headers */}
                {weekDays.map(day => (
                    <div key={day} className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 dark:bg-[#0A0A0A]">
                        {day}
                    </div>
                ))}

                {/* Days */}
                <div className="col-span-7 grid grid-cols-7 auto-rows-fr overflow-y-auto">
                    {calendarDays.map((day, dayIdx) => {
                        const dayPosts = getPostsForDay(day);
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const isDayToday = isToday(day);

                        return (
                            <div
                                key={day.toString()}
                                onClick={() => setSelectedDay(day)}
                                className={cn(
                                    "min-h-[120px] border-b border-r border-gray-100 dark:border-gray-800 p-2 transition-colors relative group",
                                    !isCurrentMonth && "bg-gray-50/50 dark:bg-[#0F0F0F] text-gray-300 dark:text-gray-700",
                                    isCurrentMonth && "bg-white dark:bg-[#0A0A0A] hover:bg-gray-50 dark:hover:bg-[#151515]",
                                    isDayToday && "bg-purple-50/30 dark:bg-purple-900/10"
                                )}
                            >
                                <div className={cn(
                                    "text-sm font-medium mb-2 w-7 h-7 flex items-center justify-center rounded-full",
                                    isDayToday
                                        ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                                        : "text-gray-700 dark:text-gray-400"
                                )}>
                                    {format(day, 'd')}
                                </div>

                                <div className="space-y-1.5 direction-rtl">
                                    {dayPosts.map(post => {
                                        // Try to find by direct ID or from result_details (fallback for missing column)
                                        const influencerId = post.influencer_id || post.result_details?.src_influencer_id;
                                        const influencer = influencers.find(i => i.id === influencerId);

                                        return (
                                            <motion.div
                                                key={post.id}
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedPost(post);
                                                    setViewImageIndex(0);
                                                }}
                                                className={cn(
                                                    "group/card flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer transition-all hover:scale-[1.02]",
                                                    post.status === 'published'
                                                        ? "bg-green-50/50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50"
                                                        : post.status === 'failed'
                                                            ? "bg-red-50/50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50"
                                                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md dark:shadow-none"
                                                )}
                                            >
                                                <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
                                                    {influencer?.avatar_url ? (
                                                        <img src={influencer.avatar_url} alt={influencer.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <img src={post.image_urls[0]} alt="" className="w-full h-full object-cover" />
                                                    )}

                                                    {post.status === 'published' && (
                                                        <div className="absolute inset-0 bg-green-500/40 flex items-center justify-center">
                                                            <CheckCircle2 className="w-4 h-4 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 truncate">
                                                            {format(parseISO(post.scheduled_time), 'HH:mm')}
                                                        </p>
                                                        <div className={cn(
                                                            "w-1.5 h-1.5 rounded-full",
                                                            post.status === 'published' ? "bg-green-500" :
                                                                post.status === 'failed' ? "bg-red-500" : "bg-purple-500"
                                                        )} />
                                                    </div>
                                                    <p className="text-[11px] font-medium text-gray-900 dark:text-gray-200 truncate leading-tight">
                                                        {post.caption || 'Untitled'}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* View Post Detail Dialog */}
            <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white dark:bg-[#0A0A0A] border-gray-200 dark:border-gray-800">
                    <DialogTitle className="sr-only">Post Details</DialogTitle>
                    {selectedPost && (
                        <div className="flex flex-col">
                            {/* Image Header */}
                            <div className="relative aspect-square w-full bg-gray-100 dark:bg-gray-900 group">
                                <img
                                    src={selectedPost.image_urls[viewImageIndex] || selectedPost.image_urls[0]}
                                    alt="Post"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>

                                {/* Navigation Controls */}
                                {selectedPost.image_urls.length > 1 && (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setViewImageIndex(prev => prev === 0 ? selectedPost.image_urls.length - 1 : prev - 1);
                                            }}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 backdrop-blur hover:bg-black/70 text-white transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setViewImageIndex(prev => prev === selectedPost.image_urls.length - 1 ? 0 : prev + 1);
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 backdrop-blur hover:bg-black/70 text-white transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>

                                        {/* Page Indicator */}
                                        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur px-2 py-1 rounded-md text-xs font-medium text-white">
                                            {viewImageIndex + 1}/{selectedPost.image_urls.length}
                                        </div>
                                    </>
                                )}

                                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                    <div className={cn(
                                        "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border",
                                        selectedPost.status === 'published'
                                            ? "bg-green-500/20 border-green-500/30 text-green-300"
                                            : selectedPost.status === 'failed'
                                                ? "bg-red-500/20 border-red-500/30 text-red-300"
                                                : "bg-purple-500/20 border-purple-500/30 text-purple-300"
                                    )}>
                                        {selectedPost.status}
                                    </div>
                                    <div className="text-white text-xs font-medium flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-md backdrop-blur-md">
                                        <Clock className="w-3 h-3" />
                                        {format(parseISO(selectedPost.scheduled_time), 'PPp')}
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Caption</h4>
                                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 text-sm leading-relaxed text-gray-700 dark:text-gray-300 max-h-[150px] overflow-y-auto custom-scrollbar">
                                    {selectedPost.caption || 'No caption provided'}
                                </div>

                                {selectedPost.status === 'pending' && (
                                    <div className="mt-6 flex justify-end">
                                        <Button
                                            variant="ghost"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            onClick={() => handleDelete(selectedPost.id)}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Scheduled Post
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

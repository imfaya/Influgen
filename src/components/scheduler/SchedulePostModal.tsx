'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Instagram, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabaseAuth as supabase } from '@/lib/supabase-auth';
import { toast } from 'sonner';
import { InstagramAccount } from '@/types';
import { cn } from '@/lib/utils';
import { format, addDays, startOfToday, isSameDay } from 'date-fns';

interface SchedulePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    images: string[];
    defaultCaption?: string;
    influencerId?: string;
}

export function SchedulePostModal({ isOpen, onClose, images, defaultCaption = '', influencerId }: SchedulePostModalProps) {
    const [caption, setCaption] = useState(defaultCaption);
    // Initialize date to tomorrow
    const [selectedDate, setSelectedDate] = useState<Date>(addDays(startOfToday(), 1));
    const [selectedTime, setSelectedTime] = useState('12:00');

    const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Carousel state
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Mount/Unmount animation state
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            fetchAccounts();
            setCaption(defaultCaption);
        } else {
            setTimeout(() => setIsVisible(false), 300);
        }
    }, [isOpen, defaultCaption]);

    const fetchAccounts = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('instagram_accounts')
            .select('*')
            .eq('user_id', user.id);

        if (data && data.length > 0) {
            setAccounts(data);
            // Default to first account if none selected, or keep existing if valid
            if (!selectedAccount || !data.find(a => a.id === selectedAccount)) {
                setSelectedAccount(data[0].id);
            }
        }
    };

    const handleSubmit = async () => {
        if (!selectedAccount) {
            toast.error('Please select an Instagram account');
            return;
        }

        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Unauthorized');

            // Combine date and time
            const [hours, minutes] = selectedTime.split(':').map(Number);
            const scheduledDateTime = new Date(selectedDate);
            scheduledDateTime.setHours(hours, minutes, 0, 0);

            // Structure the insert payload
            // WORKAROUND: 'influencer_id' column is missing in DB schema, storing in result_details JSONB instead
            const payload = {
                user_id: user.id,
                instagram_account_id: selectedAccount,
                // influencer_id: influencerId || null, // REMOVED: Column missing in DB
                content_mode: 'social',
                image_urls: images,
                caption: caption,
                scheduled_time: scheduledDateTime.toISOString(),
                status: 'pending',
                result_details: {
                    src_influencer_id: influencerId || null // Storing here for now
                }
            };

            console.log('Scheduling post payload:', payload);

            const { error } = await supabase.from('scheduled_posts').insert(payload);

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            toast.success('Post scheduled successfully!', {
                icon: <Sparkles className="w-4 h-4 text-amber-400" />,
                style: {
                    background: 'linear-gradient(to right, #1f2937, #111827)',
                    color: '#fff',
                    border: '1px solid #374151'
                }
            });
            onClose();
        } catch (error: any) {
            console.error('Scheduling error:', error);
            toast.error(error.message || 'Failed to schedule post');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calendar generation
    const calendarDays = useMemo(() => {
        const today = startOfToday();
        const days = [];
        for (let i = 0; i < 14; i++) { // Show next 2 weeks
            days.push(addDays(today, i));
        }
        return days;
    }, []);

    // Time picker slots (every 30 mins)
    const timeSlots = useMemo(() => {
        const slots = [];
        for (let i = 0; i < 24; i++) {
            for (let j = 0; j < 60; j += 30) {
                slots.push(`${i.toString().padStart(2, '0')}:${j.toString().padStart(2, '0')}`);
            }
        }
        return slots;
    }, []);


    if (!isOpen && !isVisible) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                        className="relative w-full max-w-5xl h-[85vh] bg-[#0A0A0A] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row z-10"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/20 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* LEFT COLUMN: Visual Preview */}
                        <div className="w-full md:w-[45%] h-[40vh] md:h-full bg-gradient-to-br from-gray-900 to-black relative flex items-center justify-center p-8 overflow-hidden">
                            {/* Background decoration */}
                            <div className="absolute inset-0 opacity-20">
                                <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-purple-500/30 rounded-full blur-[100px]" />
                                <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-blue-500/30 rounded-full blur-[100px]" />
                            </div>

                            {/* Carousel */}
                            <div className="relative w-full aspect-[4/5] max-h-full rounded-xl overflow-hidden shadow-2xl border border-white/10 z-10">
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={currentImageIndex}
                                        src={images[currentImageIndex]}
                                        className="w-full h-full object-cover"
                                        initial={{ opacity: 0, scale: 1.1 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.4 }}
                                        alt="Preview"
                                    />
                                </AnimatePresence>

                                {/* Carousel Controls */}
                                {images.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 backdrop-blur hover:bg-black/70 text-white transition-all"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 backdrop-blur hover:bg-black/70 text-white transition-all"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Hand of Cards Navigation - Moved outside carousel container but stays in left column */}
                            {images.length > 1 && (
                                <div
                                    className="absolute bottom-4 left-0 right-0 flex justify-center z-30 h-24 pointer-events-none"
                                >
                                    <div className="flex items-end justify-center perspective-[1000px] pointer-events-auto">
                                        {images.map((img, index) => {
                                            const centerIndex = (images.length - 1) / 2;
                                            const dist = index - centerIndex;
                                            const rotate = dist * 5;
                                            const yOffset = Math.abs(dist) * 5;

                                            return (
                                                <motion.div
                                                    key={index}
                                                    initial={{ y: 50, opacity: 0 }}
                                                    animate={{
                                                        y: yOffset,
                                                        opacity: 1,
                                                        rotate: rotate,
                                                        scale: index === currentImageIndex ? 1.1 : 1
                                                    }}
                                                    whileHover={{
                                                        y: -20,
                                                        scale: 1.2,
                                                        rotate: 0,
                                                        zIndex: 100,
                                                        transition: { type: "spring", stiffness: 400, damping: 25 }
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setCurrentImageIndex(index);
                                                    }}
                                                    style={{
                                                        zIndex: images.length - Math.abs(Math.round(dist)),
                                                        marginLeft: index === 0 ? 0 : '-15px',
                                                        transformOrigin: "bottom center",
                                                    }}
                                                    className={cn(
                                                        "relative w-12 h-16 rounded-lg cursor-pointer transition-all shadow-xl border-2 bg-gray-900 flex-shrink-0",
                                                        index === currentImageIndex
                                                            ? "border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)] z-50"
                                                            : "border-white/20 hover:border-white/80"
                                                    )}
                                                >
                                                    <div className="w-full h-full rounded-[6px] overflow-hidden">
                                                        <img src={img} className="w-full h-full object-cover" alt="" draggable={false} />
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Account Badge Overlay */}
                            {selectedAccount && (
                                <div className="absolute top-8 left-8 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur rounded-full border border-white/10 z-20">
                                    <Instagram className="w-3.5 h-3.5 text-pink-500" />
                                    <span className="text-xs font-medium text-white">
                                        @{accounts.find(a => a.id === selectedAccount)?.username}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN: Controls */}
                        <div className="w-full md:w-[55%] h-full flex flex-col overflow-y-auto custom-scrollbar bg-[#0A0A0A]">
                            <div className="p-8 space-y-8">

                                {/* Header */}
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-1">Schedule Post</h2>
                                    <p className="text-gray-400 text-sm">Craft your perfect post and set it to fly.</p>
                                </div>

                                {/* Account Selector */}
                                <div className="space-y-3">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Post to</Label>
                                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                        {accounts.map(acc => (
                                            <button
                                                key={acc.id}
                                                onClick={() => setSelectedAccount(acc.id)}
                                                className={cn(
                                                    "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all min-w-[200px]",
                                                    selectedAccount === acc.id
                                                        ? "bg-white/10 border-purple-500/50 ring-1 ring-purple-500/50"
                                                        : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                                                )}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[2px]">
                                                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                                                        <Instagram className="w-4 h-4 text-white" />
                                                    </div>
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-sm font-medium text-white">@{acc.username}</div>
                                                    <div className="text-[10px] text-gray-400">Instagram</div>
                                                </div>
                                                {selectedAccount === acc.id && (
                                                    <Check className="w-4 h-4 text-purple-400 ml-auto" />
                                                )}
                                            </button>
                                        ))}
                                        {accounts.length === 0 && (
                                            <div className="text-sm text-red-400 py-2">
                                                No accounts linked. Please connect in Settings.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Caption Editor */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Caption</Label>
                                        <span className={cn("text-xs transition-colors", caption.length > 2200 ? "text-red-400" : "text-gray-600")}>
                                            {caption.length} / 2200
                                        </span>
                                    </div>
                                    <div className="relative group">
                                        <textarea
                                            value={caption}
                                            onChange={(e) => setCaption(e.target.value)}
                                            placeholder="Write a captivating caption..."
                                            className="w-full h-40 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all resize-none custom-scrollbar"
                                        />
                                        <div className="absolute bottom-3 right-3 flex gap-2">
                                            {/* Emoji trigger could go here */}
                                        </div>
                                    </div>
                                </div>

                                {/* Date & Time Picker */}
                                <div className="space-y-4">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Schedule Time</Label>

                                    <div className="bg-white/5 border border-white/10 rounded-xl p-1">
                                        {/* Date Strip */}
                                        <div className="flex overflow-x-auto gap-1 p-2 pb-4 custom-scrollbar">
                                            {calendarDays.map((date, i) => {
                                                const isSelected = isSameDay(date, selectedDate);
                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => setSelectedDate(date)}
                                                        className={cn(
                                                            "flex flex-col items-center justify-center min-w-[4rem] h-20 rounded-lg transition-all border",
                                                            isSelected
                                                                ? "bg-purple-500 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                                                                : "bg-transparent text-gray-400 border-transparent hover:bg-white/5 hover:text-gray-200"
                                                        )}
                                                    >
                                                        <span className="text-[10px] uppercase font-bold tracking-wide opacity-80">{format(date, 'EEE')}</span>
                                                        <span className="text-xl font-bold">{format(date, 'd')}</span>
                                                        <span className="text-[10px] opacity-60">{format(date, 'MMM')}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>

                                        {/* Time Grid (Simplified) */}
                                        <div className="border-t border-white/10 p-3">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Clock className="w-3.5 h-3.5 text-gray-500" />
                                                <span className="text-xs text-gray-400">Select Time</span>
                                            </div>
                                            <div className="grid grid-cols-6 gap-2 max-h-[120px] overflow-y-auto custom-scrollbar pr-1">
                                                {timeSlots.filter((_, i) => i % 2 === 0).map((time) => ( // Show hourly for brevity, or filter
                                                    <button
                                                        key={time}
                                                        onClick={() => setSelectedTime(time)}
                                                        className={cn(
                                                            "text-xs py-1.5 rounded-md text-center transition-all",
                                                            selectedTime === time
                                                                ? "bg-white text-black font-bold shadow-md"
                                                                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                                                        )}
                                                    >
                                                        {time}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end text-xs text-gray-500 font-mono">
                                        Scheduled for: <span className="text-purple-400 ml-2 font-bold">{format(selectedDate, 'MMMM d, yyyy')} at {selectedTime}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-auto p-8 border-t border-white/10 bg-black/40 backdrop-blur sticky bottom-0 z-10">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || accounts.length === 0}
                                    className="w-full h-12 text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all rounded-xl shadow-lg shadow-purple-900/20 text-md font-bold tracking-wide"
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Scheduling...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" />
                                            Schedule Post
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}

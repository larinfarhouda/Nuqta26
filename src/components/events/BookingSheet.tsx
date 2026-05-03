'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import EventBookingForm from '@/components/events/EventBookingForm';

interface BookingSheetProps {
    isOpen: boolean;
    onClose: () => void;
    event: any;
    tickets: any[];
}

export default function BookingSheet({ isOpen, onClose, event, tickets }: BookingSheetProps) {
    const sheetRef = useRef<HTMLDivElement>(null);

    // Lock body scroll when sheet is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = '';
            };
        }
    }, [isOpen]);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (typeof window === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
                        onClick={onClose}
                    />

                    {/* Sheet */}
                    <motion.div
                        ref={sheetRef}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed inset-x-0 bottom-0 z-[71] bg-white rounded-t-2xl shadow-2xl flex flex-col"
                        style={{
                            maxHeight: '95dvh',
                            paddingBottom: 'env(safe-area-inset-bottom)',
                        }}
                    >
                        {/* Sheet Handle + Close */}
                        <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-gray-100 px-4 pt-3 pb-2 flex items-center justify-between shrink-0">
                            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
                            <span className="text-sm font-bold text-gray-900 pt-2">{event.title}</span>
                            <button
                                onClick={onClose}
                                className="p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto overscroll-contain">
                            <div className="p-4 pb-8">
                                <EventBookingForm
                                    event={event}
                                    tickets={tickets}
                                    isInSheet={true}
                                    onComplete={onClose}
                                />
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}

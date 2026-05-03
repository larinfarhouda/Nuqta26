'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getCurrencySymbol } from '@/utils/country-helpers';
import BookingSheet from '@/components/events/BookingSheet';

interface MobileBookingBarProps {
    price: number;
    country?: string;
    event: any;
    tickets: any[];
    onReserve?: () => void;
}

export default function MobileBookingBar({ price, country, event, tickets, onReserve }: MobileBookingBarProps) {
    const t = useTranslations('Events');
    const [sheetOpen, setSheetOpen] = useState(false);

    const handleReserve = () => {
        setSheetOpen(true);
        onReserve?.();
    };

    return (
        <>
            <div
                className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white/95 backdrop-blur-xl border-t border-gray-100 px-5 flex items-center justify-between shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.08)]"
                style={{ paddingBottom: 'calc(0.875rem + env(safe-area-inset-bottom))' , paddingTop: '0.875rem' }}
            >
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">{t('starting_price')}</p>
                    <p className="text-xl font-bold text-gray-900 leading-none">
                        {price > 0 ? `${price} ${getCurrencySymbol(country)}` : t('free')}
                        <span className="text-[10px] font-semibold text-gray-400 ml-1 tracking-normal">{t('per_person')}</span>
                    </p>
                </div>

                <button
                    onClick={handleReserve}
                    className="px-7 py-3 bg-primary text-white rounded-xl font-bold text-sm flex items-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-primary/20"
                >
                    <span>{t('reserve')}</span>
                    <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </button>
            </div>

            <BookingSheet
                isOpen={sheetOpen}
                onClose={() => setSheetOpen(false)}
                event={event}
                tickets={tickets}
            />
        </>
    );
}

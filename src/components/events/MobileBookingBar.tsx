'use client';

import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface MobileBookingBarProps {
    price: number;
    onReserve: () => void;
}

export default function MobileBookingBar({ price, onReserve }: MobileBookingBarProps) {
    const t = useTranslations('Events');
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white/95 backdrop-blur-xl border-t border-gray-100 px-6 py-4 flex items-center justify-between shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-full duration-500">
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{t('total_price')}</p>
                <p className="text-xl font-black text-gray-900 leading-none">
                    {price > 0 ? `${price} ₺` : t('free')}
                    <span className="text-[10px] font-bold text-gray-400 ml-1 tracking-normal">{t('per_person')}</span>
                </p>
            </div>

            <button
                onClick={onReserve}
                className="px-8 py-3.5 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-2 hover:bg-primary transition-all active:scale-95 shadow-xl shadow-gray-200"
            >
                <span>{t('reserve')}</span>
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}

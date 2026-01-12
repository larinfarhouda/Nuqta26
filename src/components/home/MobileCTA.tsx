'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { Search } from 'lucide-react';

export default function MobileCTA() {
    const t = useTranslations('Index');

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden z-50 flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <Link href="/login" className="flex-1 bg-primary text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition">
                <Search className="w-4 h-4" />
                <span>{t('discoverServices')}</span>
            </Link>
            <Link href="/register?role=vendor" className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 border border-gray-200 active:bg-gray-200 transition">
                <span>{t('joinVendor')}</span>
            </Link>
        </div>
    );
}

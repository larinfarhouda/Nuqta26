'use client';

import { signOut } from '@/actions/auth';
import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { useRouter } from '@/navigation';

export default function LogoutButton({ className, variant = 'nav' }: { className?: string, variant?: 'nav' | 'icon' | 'sidebar' }) {
    const t = useTranslations('Auth');
    const router = useRouter();

    const handleLogout = async () => {
        await signOut();
        router.refresh();
        router.push('/login');
    };

    if (variant === 'icon') {
        return (
            <button
                onClick={handleLogout}
                className={className || "p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"}
                title={t('logout')}
            >
                <LogOut className="w-5 h-5" />
            </button>
        );
    }

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className={className || "flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"}
        >
            <LogOut className="w-4 h-4" />
            <span>{t('logout')}</span>
        </motion.button>
    );
}

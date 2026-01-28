'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { deleteUnpaidBooking } from '@/actions/user';
import { useRouter } from '@/navigation';

interface DeleteBookingButtonProps {
    bookingId: string;
}

export default function DeleteBookingButton({ bookingId }: DeleteBookingButtonProps) {
    const t = useTranslations('Dashboard.user');
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm(t('confirm_delete_booking'))) {
            return;
        }

        setIsDeleting(true);
        try {
            const result = await deleteUnpaidBooking(bookingId);

            if (result.error) {
                alert(result.error);
            } else {
                // Refresh the page to show updated bookings
                router.refresh();
            }
        } catch (error) {
            alert(t('delete_failed'));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition shadow-sm border border-red-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? t('deleting') : t('delete_booking')}
        </button>
    );
}

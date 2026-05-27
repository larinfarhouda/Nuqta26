'use client';

import { Calendar } from 'lucide-react';
import { AdminBadge } from '../ui/AdminBadge';
import type { AdminVendorDetail } from '@/types/admin.types';

interface Props {
    vendor: AdminVendorDetail;
}

export default function VendorStatusTab({ vendor }: Props) {
    const statusVariant = vendor.status === 'approved' ? 'success' : vendor.status === 'suspended' ? 'danger' : 'warning';
    const verifiedVariant = vendor.is_verified ? 'success' : 'danger';

    return (
        <div>
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Account Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center">
                        <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">STATUS</div>
                        <AdminBadge variant={statusVariant}>
                            {vendor.status || 'pending'}
                        </AdminBadge>
                    </div>
                    <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center">
                        <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">VERIFIED</div>
                        <AdminBadge variant={verifiedVariant}>
                            {vendor.is_verified ? 'Yes' : 'No'}
                        </AdminBadge>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center">
                        <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">EVENTS</div>
                        <div className="text-2xl font-extrabold text-zinc-900 dark:text-white">{vendor.eventCount}</div>
                    </div>
                    <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center">
                        <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">BOOKINGS</div>
                        <div className="text-2xl font-extrabold text-zinc-900 dark:text-white">{vendor.bookingCount}</div>
                    </div>
                </div>

                <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Calendar size={12} className="inline" />
                    Joined: {vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : 'Unknown'}
                </div>
            </div>
        </div>
    );
}

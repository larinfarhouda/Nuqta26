'use client';

import { useState, useTransition, useEffect } from 'react';
import { Eye, Check, X, Loader2, Image as ImageIcon, Search } from 'lucide-react';
import { getAdminBankTransfers, confirmBankPayment, rejectBankPayment } from '@/actions/admin';
import type { BankTransferBooking, PaginatedResult } from '@/types/admin.types';
import { useToast } from '@/components/ui/Toast';
import { getCurrencySymbol } from '@/utils/country-helpers';

// UI Components
import { AdminCard } from './ui/AdminCard';
import { AdminButton } from './ui/AdminButton';
import { AdminInput } from './ui/AdminInput';
import { AdminBadge } from './ui/AdminBadge';
import { AdminConfirmDialog } from './ui/AdminConfirmDialog';

export default function AdminBookingsClient({
    initialData,
}: {
    initialData: PaginatedResult<BankTransferBooking> | null;
}) {
    const [data, setData] = useState(initialData);
    const [page, setPage] = useState(1);
    const [isPending, startTransition] = useTransition();
    const [actionId, setActionId] = useState<string | null>(null);
    const [proofUrl, setProofUrl] = useState<string | null>(null);
    const { toast } = useToast();

    // Confirm Dialog State
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDangerous?: boolean;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    const openConfirm = (title: string, message: string, onConfirm: () => void, isDangerous = false) => {
        setConfirmState({ isOpen: true, title, message, onConfirm, isDangerous });
    };
    const closeConfirm = () => setConfirmState(p => ({ ...p, isOpen: false }));

    const reload = (p = page) => {
        startTransition(async () => {
            const result = await getAdminBankTransfers(p, 20);
            setData(result);
        });
    };

    // Handle Escape key for proof modal
    useEffect(() => {
        if (!proofUrl) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setProofUrl(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [proofUrl]);

    const handleConfirm = async (bookingId: string) => {
        openConfirm('Confirm Payment', 'Are you sure you want to confirm this payment?', async () => {
            closeConfirm();
            setActionId(bookingId);
            try {
                await confirmBankPayment(bookingId);
                toast('success', 'Payment confirmed');
            } catch {
                toast('error', 'Failed to confirm payment');
            }
            setActionId(null);
            reload();
        });
    };

    const handleReject = async (bookingId: string) => {
        openConfirm('Reject Payment', 'Are you sure you want to reject this payment? The status will revert to pending.', async () => {
            closeConfirm();
            setActionId(bookingId);
            try {
                await rejectBankPayment(bookingId);
                toast('success', 'Payment rejected');
            } catch {
                toast('error', 'Failed to reject payment');
            }
            setActionId(null);
            reload();
        }, true);
    };

    const bookings = data?.data || [];

    return (
        <div className="max-w-[1400px] pb-12 relative">
            <AdminConfirmDialog {...confirmState} onCancel={closeConfirm} />

            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Bookings</h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                    Review and process bank transfer payments
                </p>
            </div>

            {/* Payment Proof Modal */}
            {proofUrl && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm transition-opacity"
                    onClick={() => setProofUrl(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="proof-modal-title"
                >
                    <AdminCard 
                        className="w-full max-w-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200 shadow-2xl overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 id="proof-modal-title" className="text-lg font-bold text-zinc-900 dark:text-white">Payment Proof</h3>
                            <button 
                                aria-label="Close proof modal"
                                onClick={() => setProofUrl(null)}
                                className="p-2 rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="bg-zinc-100 dark:bg-zinc-900 rounded-xl overflow-hidden flex items-center justify-center min-h-[300px]">
                            <img src={proofUrl} alt="Payment proof" className="max-w-full max-h-[60vh] object-contain" />
                        </div>
                        <div className="mt-6 flex justify-end">
                            <AdminButton onClick={() => setProofUrl(null)}>Close Image</AdminButton>
                        </div>
                    </AdminCard>
                </div>
            )}

            {/* Table */}
            <AdminCard noPadding className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                                {['Event', 'Customer', 'Amount', 'Status', 'Proof', 'Actions'].map(h => (
                                    <th key={h} className="px-6 py-4 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                            {bookings.length === 0 && !isPending && (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500">
                                            <ImageIcon size={48} className="mb-4 opacity-20" />
                                            <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">No pending bank transfers</p>
                                            <p className="text-sm">You're all caught up!</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {bookings.length === 0 && isPending && (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center">
                                        <div className="flex justify-center text-[#2CA58D]">
                                            <Loader2 size={32} className="animate-spin" />
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {bookings.map(b => (
                                <tr key={b.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{(b.events as any)?.title || '—'}</div>
                                        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{(b.vendors as any)?.business_name || '—'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{b.contact_name || (b.profiles as any)?.full_name || '—'}</div>
                                        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{b.contact_email || (b.profiles as any)?.email || '—'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 bg-[#2CA58D]/10 text-[#2CA58D] px-3 py-1.5 rounded-lg inline-block">
                                            {getCurrencySymbol((b.events as any)?.country)}{(b.total_amount || 0).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <AdminBadge variant={b.status === 'payment_submitted' ? 'accent' : 'warning'}>
                                            {b.status === 'payment_submitted' ? 'Submitted' : 'Pending'}
                                        </AdminBadge>
                                    </td>
                                    <td className="px-6 py-4">
                                        {b.payment_proof_url ? (
                                            <button
                                                onClick={() => setProofUrl(b.payment_proof_url!)}
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2CA58D]/10 text-[#2CA58D] hover:bg-[#2CA58D]/20 transition-colors text-xs font-bold"
                                            >
                                                <ImageIcon size={14} /> View Proof
                                            </button>
                                        ) : (
                                            <span className="text-xs font-medium text-zinc-400">None</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2 items-center">
                                            {b.status === 'payment_submitted' && (
                                                <>
                                                    <button
                                                        onClick={() => handleConfirm(b.id)}
                                                        disabled={actionId === b.id}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors text-xs font-bold disabled:opacity-50"
                                                    >
                                                        {actionId === b.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                                        Confirm
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(b.id)}
                                                        disabled={actionId === b.id}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors text-xs font-bold disabled:opacity-50"
                                                    >
                                                        <X size={14} /> Reject
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </AdminCard>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                    {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            onClick={() => { setPage(p); reload(p); }}
                            className={`w-10 h-10 rounded-xl font-bold text-sm transition-all focus:outline-none focus:ring-4 focus:ring-[#2CA58D]/20 ${
                                p === page 
                                ? 'bg-[#2CA58D] text-white shadow-md' 
                                : 'bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

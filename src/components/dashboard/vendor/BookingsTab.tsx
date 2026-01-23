'use client';

import { useState, useEffect } from 'react';
import {
    getVendorBookings,
    updateBookingStatus
} from '@/actions/vendor/bookings';
import {
    Search, CheckCircle, XCircle, Eye,
    Calendar, User, CreditCard, ChevronRight,
    Loader2, AlertCircle, ExternalLink, Tag
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

export default function BookingsTab() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending_payment' | 'payment_submitted' | 'confirmed' | 'cancelled'>('all');
    const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
    const [updating, setUpdating] = useState<string | null>(null);

    const t = useTranslations('Dashboard.vendor.bookings');
    const locale = useLocale();

    const loadBookings = async () => {
        setLoading(true);
        const data = await getVendorBookings();
        setBookings(data);
        setLoading(false);
    };

    useEffect(() => {
        loadBookings();
    }, []);

    const handleStatusUpdate = async (id: string, newStatus: 'confirmed' | 'cancelled') => {
        setUpdating(id);
        const res = await updateBookingStatus(id, newStatus);
        if (res.success) {
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
        }
        setUpdating(null);
    };

    const filtered = bookings.filter(b => {
        const matchesSearch =
            b.profiles?.full_name?.toLowerCase().includes(filter.toLowerCase()) ||
            b.events?.title?.toLowerCase().includes(filter.toLowerCase()) ||
            b.id.includes(filter);

        const matchesStatus = statusFilter === 'all' || b.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{t('title')}</h3>
                    <p className="text-sm text-gray-500">{t('subtitle')}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder={t('search_placeholder')}
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            className="pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ring-primary/20 w-full lg:w-48 text-sm"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e: any) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 ring-primary/20"
                    >
                        <option value="all">{t('status_all')}</option>
                        <option value="pending_payment">{t('status_pending')}</option>
                        <option value="payment_submitted">{t('status_submitted')}</option>
                        <option value="confirmed">{t('status_confirmed')}</option>
                        <option value="cancelled">{t('status_cancelled')}</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="animate-spin h-8 w-8 text-primary" />
                </div>
            ) : (
                <div className="grid gap-4">
                    {filtered.map((booking) => (
                        <div key={booking.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 group hover:shadow-md transition-all">
                            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                                <div className="flex-1 flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                                        <Calendar className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                                                booking.status === 'payment_submitted' ? 'bg-amber-100 text-amber-700' :
                                                    booking.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                                                        'bg-gray-100 text-gray-600'
                                                }`}>
                                                {t(`status_label_${booking.status}`)}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-mono">#{booking.id.slice(0, 8)}</span>
                                        </div>
                                        <h4 className="font-bold text-gray-900 line-clamp-1">{booking.events?.title}</h4>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                            <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                                <User className="w-3 h-3" /> {booking.profiles?.full_name}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium font-mono">
                                                <CreditCard className="w-3 h-3" /> {booking.total_amount} ₺
                                            </span>
                                            {booking.discount_amount > 0 && (
                                                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                                                    <Tag className="w-3 h-3" /> -{booking.discount_amount} ₺
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 lg:border-r lg:pr-6 lg:mr-2">
                                    {booking.payment_proof_url && (
                                        <button
                                            onClick={() => setSelectedReceipt(booking.payment_proof_url)}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                                        >
                                            <Eye className="w-3.5 h-3.5" /> {t('view_receipt')}
                                        </button>
                                    )}

                                    {booking.status === 'payment_submitted' && (
                                        <div className="flex gap-2">
                                            <button
                                                disabled={!!updating}
                                                onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                                                className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                                                title={t('approve')}
                                            >
                                                {updating === booking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                            </button>
                                            <button
                                                disabled={!!updating}
                                                onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                                className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                                                title={t('reject')}
                                            >
                                                {updating === booking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    )}

                                    {booking.status === 'pending_payment' && (
                                        <div className="flex items-center gap-1.5 text-[10px] text-amber-600 font-black uppercase">
                                            <AlertCircle className="w-3.5 h-3.5" /> {t('awaiting_upload')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div className="py-12 text-center text-gray-400 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
                            <p className="text-sm font-bold">{t('no_bookings')}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Receipt Modal */}
            {selectedReceipt && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm transition-all animate-in fade-in">
                    <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b">
                            <h3 className="text-xl font-bold text-gray-900">{t('payment_receipt')}</h3>
                            <button onClick={() => setSelectedReceipt(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <XCircle className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto rounded-xl bg-gray-50 p-2 flex items-center justify-center">
                            {selectedReceipt.toLowerCase().endsWith('.pdf') ? (
                                <div className="flex flex-col items-center gap-4 py-12">
                                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                                        <AlertCircle className="w-10 h-10" />
                                    </div>
                                    <p className="font-bold text-gray-900 text-center">{t('pdf_receipt_msg')}</p>
                                    <a
                                        href={selectedReceipt}
                                        target="_blank"
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        <ExternalLink className="w-4 h-4" /> {t('open_pdf')}
                                    </a>
                                </div>
                            ) : (
                                <img src={selectedReceipt} alt="Receipt" className="max-w-full h-auto rounded-lg shadow-sm" />
                            )}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setSelectedReceipt(null)} className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold">
                                {t('close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

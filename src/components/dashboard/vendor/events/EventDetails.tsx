'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Users, Receipt, Calendar, MapPin, Phone, Mail, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { getEventBookings } from '@/actions/vendor/events';
import { updateBookingStatus } from '@/actions/vendor/bookings';
import { useTranslations, useLocale } from 'next-intl';

export default function EventDetails({ event, onBack }: { event: any, onBack: () => void }) {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const t = useTranslations('Dashboard.vendor.events');
    const locale = useLocale();

    useEffect(() => {
        loadBookings();
    }, [event.id]);

    const loadBookings = async () => {
        setLoading(true);
        const data = await getEventBookings(event.id);
        setBookings(data);
        setLoading(false);
    };

    const handleStatusUpdate = async (id: string, newStatus: 'confirmed' | 'cancelled') => {
        setUpdating(id);
        const res = await updateBookingStatus(id, newStatus);
        if (res.success) {
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
        }
        setUpdating(null);
    };

    // Calculate Stats
    const totalTickets = event.tickets?.reduce((acc: number, t: any) => acc + (t.quantity || 0), 0) || 0;

    // Use the fetched bookings to calculate real-time sold count
    const totalSold = bookings
        .filter(b => b.status !== 'cancelled')
        .reduce((acc, b) => acc + (b.booking_items_count || 0), 0);
    // Let's use the bookings list for revenue
    const revenue = bookings
        .filter(b => b.status !== 'cancelled')
        .reduce((acc, b) => acc + (b.total_amount || 0), 0);

    const pendingCount = bookings.filter(b => b.status === 'pending_payment').length;

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h2 className="text-2xl font-black text-gray-900">{event.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(event.date).toLocaleDateString(locale)}</span>
                        {event.location_name && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {event.location_name}</span>}
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('capacity')}</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-gray-900">{totalSold}</span>
                        <span className="text-sm text-gray-400">/ {event.capacity || totalTickets}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div
                            className="bg-primary h-full rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(100, (totalSold / (event.capacity || totalTickets || 1)) * 100)}%` }}
                        />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('revenue')}</div>
                    <div className="text-2xl font-black text-emerald-600 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        {revenue} ₺
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('attendees')}</div>
                    <div className="text-2xl font-black text-blue-600 flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        {bookings.length}
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('pending_actions')}</div>
                    <div className="text-2xl font-black text-amber-500 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {pendingCount}
                    </div>
                </div>
            </div>

            {/* Bookings List */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-gray-400" />
                        {t('bookings_list')}
                    </h3>
                    <span className="text-xs font-bold bg-gray-200 text-gray-600 px-2 py-1 rounded-lg">{bookings.length}</span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin h-8 w-8 text-primary" />
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Users className="w-12 h-12 mb-2 opacity-20" />
                        <p className="text-sm font-medium">{t('no_bookings_yet')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50/50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                                <tr>
                                    <th className="px-6 py-3">{t('customer')}</th>
                                    <th className="px-6 py-3">{t('contact')}</th>
                                    <th className="px-6 py-3">{t('tickets')}</th>
                                    <th className="px-6 py-3">{t('amount')}</th>
                                    <th className="px-6 py-3">{t('status')}</th>
                                    <th className="px-6 py-3 text-right">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {bookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                                    {booking.profiles?.full_name?.[0] || 'G'}
                                                </div>
                                                <div className="font-bold text-gray-900">{booking.profiles?.full_name || 'Guest'}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                    <Mail className="w-3 h-3" /> {booking.profiles?.email || 'N/A'}
                                                </div>
                                                {booking.profiles?.phone && (
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                        <Phone className="w-3 h-3" /> {booking.profiles?.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {booking.booking_items_count || 0}
                                        </td>
                                        <td className="px-6 py-4 font-black text-gray-900">
                                            {booking.total_amount} ₺
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                                                booking.status === 'payment_submitted' ? 'bg-amber-100 text-amber-700' :
                                                    booking.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                                                        'bg-gray-100 text-gray-600'
                                                }`}>
                                                {t(`status_${booking.status}`)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {/* View Receipt Button */}
                                                {booking.payment_proof_url && (
                                                    <a
                                                        href={booking.payment_proof_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center justify-center transition-colors"
                                                        title={t('view_receipt')}
                                                    >
                                                        <Receipt className="w-4 h-4" />
                                                    </a>
                                                )}

                                                {/* Approve / Confirm Button */}
                                                {(booking.status === 'payment_submitted' || booking.status === 'pending_payment') && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                                                        disabled={!!updating}
                                                        className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"
                                                        title={t('approve')}
                                                    >
                                                        {updating === booking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                    </button>
                                                )}

                                                {/* Reject / Cancel Button */}
                                                {(booking.status !== 'cancelled') && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                                        disabled={!!updating}
                                                        className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"
                                                        title={t('reject')}
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

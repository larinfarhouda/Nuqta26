'use client';

import { useState } from 'react';
import { createBooking } from '@/actions/public/events';
import { Loader2, Ticket, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EventBookingForm({ event, tickets }: { event: any, tickets: any[] }) {
    const [selectedTicket, setSelectedTicket] = useState(tickets[0]?.id);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [errorMsg, setErrorMsg] = useState('');

    const activeTicket = tickets.find(t => t.id === selectedTicket);
    const totalPrice = activeTicket ? activeTicket.price * quantity : 0;

    const handleBook = async () => {
        if (!activeTicket) return;
        setLoading(true);
        setErrorMsg('');

        try {
            const res = await createBooking(event.id, activeTicket.id, quantity);
            if (res.error) {
                setStatus('ERROR');
                setErrorMsg(res.error);
            } else {
                setStatus('SUCCESS');
            }
        } catch (err) {
            setStatus('ERROR');
            setErrorMsg('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'SUCCESS') {
        return (
            <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 text-center animate-in zoom-in-95">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-emerald-900 mb-2">تم الحجز بنجاح!</h3>
                <p className="text-emerald-700">شكراً لك، تم تأكيد حجزك.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl shadow-xl p-6 lg:p-8 border border-gray-100 sticky top-24">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" />
                حجز التذاكر
            </h3>

            <div className="space-y-6">
                {/* Ticket Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-500 uppercase">نوع التذكرة</label>
                    <div className="grid gap-3">
                        {tickets.map(ticket => (
                            <div
                                key={ticket.id}
                                onClick={() => setSelectedTicket(ticket.id)}
                                className={`cursor-pointer border-2 rounded-xl p-4 transition-all ${selectedTicket === ticket.id ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-gray-900">{ticket.name}</span>
                                    <span className="font-bold text-primary text-lg">{ticket.price > 0 ? `${ticket.price} SAR` : 'مجاناً'}</span>
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-2">{ticket.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quantity */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-gray-500 uppercase">العدد</label>
                        <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-1 border border-gray-100">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm font-bold text-gray-600 hover:text-primary transition-colors"
                            >-</button>
                            <span className="font-black text-gray-900 w-4 text-center">{quantity}</span>
                            <button
                                onClick={() => setQuantity(Math.min(10, quantity + 1))}
                                className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm font-bold text-gray-600 hover:text-primary transition-colors"
                            >+</button>
                        </div>
                    </div>
                </div>

                {/* Total & Action */}
                <div className="pt-6 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-gray-500 font-medium">الإجمالي</span>
                        <span className="text-3xl font-black text-gray-900">{totalPrice} SAR</span>
                    </div>

                    {errorMsg && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl text-center">
                            {errorMsg}
                        </div>
                    )}

                    <button
                        onClick={handleBook}
                        disabled={loading}
                        className="w-full py-4 bg-black text-white rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                        {loading ? 'جاري الحجز...' : 'تأكيد الحجز'}
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-4 font-medium">حجز آمن وفوري</p>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { createBooking } from '@/actions/public/events';
import { Loader2, Ticket, CheckCircle, Info, ChevronRight, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function EventBookingForm({ event, tickets }: { event: any, tickets: any[] }) {
    const t = useTranslations('Events');
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
            setErrorMsg(t('generic_error'));
        } finally {
            setLoading(false);
        }
    };

    if (status === 'SUCCESS') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 border border-emerald-100 rounded-[2.5rem] p-10 text-center sticky top-32 shadow-2xl shadow-emerald-500/10"
            >
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-black text-emerald-900 mb-3 tracking-tight">{t('booking_confirmed')}</h3>
                <p className="text-emerald-700 font-bold leading-relaxed">
                    {t('booking_success_msg', { title: event.title })}
                </p>
            </motion.div>
        );
    }

    return (
        <div className="bg-white rounded-[2.5rem] shadow-3xl p-8 border border-gray-100 sticky top-32">

            {/* Urgency Badge */}
            <div className="mb-8 flex items-center gap-3 bg-rose-50 px-4 py-2.5 rounded-xl border border-rose-100 text-rose-600">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">{t('high_demand', { count: 12 })}</span>
            </div>

            <div className="flex justify-between items-baseline mb-10">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('starting_price')}</p>
                    <p className="text-4xl font-black text-gray-900">
                        {activeTicket?.price > 0 ? `${activeTicket.price} ₺` : t('free')}
                        <span className="text-sm font-bold text-gray-400 ml-2 tracking-normal">{t('per_person')}</span>
                    </p>
                </div>
            </div>

            <div className="space-y-8">
                {/* Ticket Selection */}
                <div className="space-y-4">
                    <label className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-primary" />
                        {t('select_ticket')}
                    </label>
                    <div className="grid gap-3">
                        {tickets.map(ticket => (
                            <button
                                key={ticket.id}
                                onClick={() => setSelectedTicket(ticket.id)}
                                className={`w-full group text-left border-2 rounded-2xl p-4 transition-all relative overflow-hidden ${selectedTicket === ticket.id
                                    ? 'border-primary bg-primary/5 ring-4 ring-primary/5'
                                    : 'border-gray-50 bg-gray-50/50 hover:border-gray-200 hover:bg-white'
                                    }`}
                            >
                                <div className="flex justify-between items-center mb-1 relative z-10">
                                    <span className={`font-black text-base transition-colors ${selectedTicket === ticket.id ? 'text-primary' : 'text-gray-900'}`}>{ticket.name}</span>
                                    <span className="font-black text-gray-900">{ticket.price > 0 ? `${ticket.price} ₺` : t('free')}</span>
                                </div>
                                <p className="text-[11px] font-bold text-gray-500 line-clamp-1 group-hover:line-clamp-none transition-all relative z-10">{ticket.description}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quantity Manager */}
                <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-black text-gray-900">{t('number_of_guests')}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('max_guests', { count: 10 })}</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm font-black text-gray-900 hover:border-primary hover:text-primary transition-all active:scale-90"
                        >-</button>
                        <span className="font-black text-2xl text-gray-900 w-6 text-center">{quantity}</span>
                        <button
                            onClick={() => setQuantity(Math.min(10, quantity + 1))}
                            className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm font-black text-gray-900 hover:border-primary hover:text-primary transition-all active:scale-90"
                        >+</button>
                    </div>
                </div>

                {/* Summary & Call to Action */}
                <div className="pt-8 space-y-6">
                    <div className="flex justify-between items-center px-2">
                        <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">{t('total_to_pay')}</span>
                        <span className="text-3xl font-black text-gray-900">{totalPrice} ₺</span>
                    </div>

                    {errorMsg && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-rose-50 text-rose-600 text-[11px] font-black uppercase tracking-widest rounded-2xl text-center border border-rose-100"
                        >
                            {errorMsg}
                        </motion.div>
                    )}

                    <button
                        onClick={handleBook}
                        disabled={loading}
                        className="w-full relative py-6 bg-gray-900 text-white rounded-3xl font-black text-xl hover:bg-primary transition-all shadow-2xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-3 group overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/5 skew-x-[-20deg] translate-x-[-100%] group-hover:translate-x-[150%] transition-transform duration-1000" />
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <span>{t('confirm_experience')}</span>}
                        {!loading && <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
                    </button>

                    <div className="flex items-center justify-center gap-3 text-gray-400 pt-2">
                        <Info className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t('instant_confirmation')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

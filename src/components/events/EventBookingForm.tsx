'use client';

import { useState } from 'react';
import { createBooking } from '@/actions/public/events';
import { validateDiscountCode } from '@/actions/public/discounts';
import { Loader2, Ticket, CheckCircle, Info, ChevronRight, TrendingUp, XCircle, AlertCircle, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { getEventStatus } from '@/utils/eventStatus';

export default function EventBookingForm({ event, tickets }: { event: any, tickets: any[] }) {
    const t = useTranslations('Events');
    const [selectedTicket, setSelectedTicket] = useState(tickets[0]?.id);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'IDLE' | 'BANK_INFO' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [errorMsg, setErrorMsg] = useState('');
    const [bookingId, setBookingId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const [discountCode, setDiscountCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState<{ id: string, amount: number, code: string } | null>(null);
    const [validatingCode, setValidatingCode] = useState(false);

    const activeTicket = tickets.find(t => t.id === selectedTicket);
    const basePrice = activeTicket ? activeTicket.price * quantity : 0;

    // Calculate Bulk Discount
    let bulkDiscountAmount = 0;
    if (event.bulk_discounts && event.bulk_discounts.length > 0) {
        const applicableBulk = [...event.bulk_discounts]
            .sort((a, b) => b.min_quantity - a.min_quantity)
            .find(d => quantity >= d.min_quantity);

        if (applicableBulk) {
            if (applicableBulk.discount_type === 'percentage') {
                bulkDiscountAmount = (basePrice * applicableBulk.discount_value) / 100;
            } else {
                bulkDiscountAmount = applicableBulk.discount_value;
            }
        }
    }

    const totalPrice = Math.max(0, basePrice - bulkDiscountAmount - (appliedDiscount?.amount || 0));

    // Calculate event status
    const eventStatus = getEventStatus(event);
    const isExpired = eventStatus === 'expired';
    const isSoldOut = eventStatus === 'sold_out';
    const isBookable = eventStatus === 'active';

    const handleApplyDiscount = async () => {
        if (!discountCode || !isBookable) return;
        setValidatingCode(true);
        setErrorMsg('');

        try {
            const res = await validateDiscountCode(
                discountCode,
                event.vendor_id,
                event.id,
                basePrice - bulkDiscountAmount
            );

            if (res.success) {
                setAppliedDiscount({
                    id: res.discountId!,
                    amount: res.discountAmount!,
                    code: discountCode
                });
            } else {
                setErrorMsg(res.error || t('invalid_code'));
            }
        } catch (err) {
            setErrorMsg(t('generic_error'));
        } finally {
            setValidatingCode(false);
        }
    };

    const handleBook = async () => {
        if (!activeTicket || !isBookable) return;
        setLoading(true);
        setErrorMsg('');

        try {
            const res = await createBooking(event.id, activeTicket.id, quantity, appliedDiscount?.code);
            if (res.error) {
                setStatus('ERROR');
                setErrorMsg(res.error);
            } else {
                if (totalPrice > 0) {
                    setBookingId(res.bookingId || null);
                    setStatus('BANK_INFO');
                } else {
                    setStatus('SUCCESS');
                }
            }
        } catch (err) {
            setStatus('ERROR');
            setErrorMsg(t('generic_error'));
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length || !bookingId) return;
        setUploading(true);
        const file = e.target.files[0];
        const fileName = `receipts/${bookingId}-${Date.now()}.${file.name.split('.').pop()}`;

        try {
            const { createClient: createSupbaseClient } = await import('@/utils/supabase/client');
            const supabase = createSupbaseClient();

            const { error: uploadError } = await supabase.storage.from('booking-receipts').upload(fileName, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('booking-receipts').getPublicUrl(fileName);

            const { error: dbError } = await supabase
                .from('bookings')
                .update({
                    payment_proof_url: publicUrl,
                    status: 'payment_submitted'
                })
                .eq('id', bookingId);

            if (dbError) throw dbError;
            setStatus('SUCCESS');
        } catch (err: any) {
            setErrorMsg(err.message);
        } finally {
            setUploading(false);
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
                    {totalPrice > 0 ? t('booking_submitted_msg') : t('booking_success_msg', { title: event.title })}
                </p>
            </motion.div>
        );
    }

    if (status === 'BANK_INFO') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] shadow-3xl p-8 border border-gray-100 sticky top-32"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900">{t('complete_payment')}</h3>
                    <p className="text-sm text-gray-500 font-bold mt-2">{t('payment_instruction')}</p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4 mb-8">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('amount_to_transfer')}</span>
                        <span className="text-xl font-black text-primary">{totalPrice} ₺</span>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('bank_name')}</p>
                            <p className="font-bold text-gray-900">{event.vendors?.bank_name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('account_holder')}</p>
                            <p className="font-bold text-gray-900">{event.vendors?.bank_account_name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('iban')}</p>
                            <p className="font-bold text-gray-900 break-all bg-white p-2 rounded-lg border border-gray-200 mt-1 select-all">{event.vendors?.bank_iban || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="block w-full">
                        <span className="sr-only">Upload Receipt</span>
                        <div className={`w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all cursor-pointer ${uploading ? 'bg-gray-50 border-gray-200 opacity-50' : 'bg-primary/5 border-primary/20 hover:border-primary/40'}`}>
                            {uploading ? (
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            ) : (
                                <>
                                    <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center mb-2">
                                        <ChevronRight className="w-5 h-5 text-primary rotate-[-90deg]" />
                                    </div>
                                    <span className="text-xs font-black text-gray-900 uppercase tracking-widest">{t('upload_receipt')}</span>
                                    <span className="text-[10px] text-gray-400 font-bold mt-1">{t('receipt_format')}</span>
                                </>
                            )}
                            <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} disabled={uploading} />
                        </div>
                    </label>

                    {errorMsg && (
                        <p className="text-center text-xs font-bold text-rose-600">{errorMsg}</p>
                    )}

                    <div className="flex items-center justify-center gap-3 text-gray-400 pt-2">
                        <Info className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-center">{t('payment_verification_note')}</span>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Show disabled state for expired or sold out events
    if (isExpired || isSoldOut) {
        return (
            <div className={`rounded-[2.5rem] p-8 border sticky top-32 ${isExpired ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                <div className="text-center py-8">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isExpired ? 'bg-red-100' : 'bg-amber-100'}`}>
                        {isExpired ? (
                            <XCircle className="w-10 h-10 text-red-600" />
                        ) : (
                            <AlertCircle className="w-10 h-10 text-amber-600" />
                        )}
                    </div>
                    <h3 className={`text-2xl font-black mb-3 tracking-tight ${isExpired ? 'text-red-900' : 'text-amber-900'}`}>
                        {isExpired ? t('event_ended') : t('status_sold_out')}
                    </h3>
                    <p className={`font-bold leading-relaxed ${isExpired ? 'text-red-700' : 'text-amber-700'}`}>
                        {isExpired ? t('expired_message') : t('sold_out_message')}
                    </p>
                </div>
            </div>
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

                {/* Discount Code Input */}
                <div className="space-y-4">
                    <label className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                        <Tag className="w-4 h-4 text-primary" />
                        {t('discount_code')}
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyDiscount()}
                            placeholder="SAVE20"
                            className="input-field py-3"
                            disabled={appliedDiscount !== null}
                        />
                        <button
                            type="button"
                            onClick={handleApplyDiscount}
                            disabled={validatingCode || !discountCode || appliedDiscount !== null}
                            className="bg-gray-900 text-white px-6 rounded-2xl font-bold hover:bg-primary transition-all disabled:opacity-50"
                        >
                            {validatingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : (appliedDiscount ? <CheckCircle className="w-4 h-4" /> : t('apply'))}
                        </button>
                    </div>
                    {appliedDiscount && (
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {t('discount_applied')} (-{appliedDiscount.amount} ₺)
                        </p>
                    )}
                </div>

                {/* Summary & Call to Action */}
                <div className="pt-8 space-y-4">
                    <div className="space-y-2 px-2">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Base Price</span>
                            <span className="text-gray-900 font-bold">{basePrice} ₺</span>
                        </div>
                        {bulkDiscountAmount > 0 && (
                            <div className="flex justify-between items-center text-emerald-600">
                                <span className="font-bold uppercase tracking-widest text-[10px]">Bulk Discount</span>
                                <span className="font-bold">-{bulkDiscountAmount} ₺</span>
                            </div>
                        )}
                        {appliedDiscount && (
                            <div className="flex justify-between items-center text-emerald-600">
                                <span className="font-bold uppercase tracking-widest text-[10px]">Promo Code</span>
                                <span className="font-bold">-{appliedDiscount.amount} ₺</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                            <span className="text-gray-900 font-black uppercase tracking-widest text-xs font-bold">{t('total_to_pay')}</span>
                            <span className="text-3xl font-black text-gray-900">{totalPrice} ₺</span>
                        </div>
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


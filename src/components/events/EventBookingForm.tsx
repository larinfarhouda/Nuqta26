'use client';

import { useState, useEffect } from 'react';
import { createBooking } from '@/actions/public/events';
import { validateDiscountCode } from '@/actions/public/discounts';
import { Loader2, Ticket, CheckCircle, Info, ChevronRight, TrendingUp, XCircle, AlertCircle, Tag, Calendar, Clock, Copy, Check, ShieldCheck, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { getEventStatus } from '@/utils/eventStatus';
import { MobileLoginDialog } from '@/components/auth/MobileLoginDialog';
import { Link } from '@/navigation';
import { getCurrencySymbol } from '@/utils/country-helpers';

export default function EventBookingForm({ event, tickets }: { event: any, tickets: any[] }) {
    const t = useTranslations('Events');
    const cs = getCurrencySymbol(event.country);
    const [selectedTicket, setSelectedTicket] = useState(tickets[0]?.id);
    const [quantity, setQuantity] = useState(1);
    const [policyOpen, setPolicyOpen] = useState(false);

    const hasPolicy = !!(event.vendor?.cancellation_policy || event.vendor?.return_policy);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'IDLE' | 'BANK_INFO' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [errorMsg, setErrorMsg] = useState('');
    const [bookingId, setBookingId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const [discountCode, setDiscountCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState<{ id: string, amount: number, code: string } | null>(null);
    const [validatingCode, setValidatingCode] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [existingBookingId, setExistingBookingId] = useState<string | null>(null);

    const copyToClipboard = (text: string, field: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

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
                if (res.error === 'min_purchase_not_met' && res.requiredAmount) {
                    setErrorMsg(t('min_purchase_not_met', { amount: res.requiredAmount }));
                } else {
                    setErrorMsg(t(res.error || 'invalid_code'));
                }
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
                // Check if the error requires authentication
                if (res.requiresAuth) {
                    setShowLoginDialog(true);
                } else if (res.requiresManagement) {
                    // User has an existing pending booking
                    setExistingBookingId(res.bookingId || null);
                    setStatus('ERROR');
                    setErrorMsg(t(res.error));
                } else {
                    setStatus('ERROR');
                    // Translate the error code
                    setErrorMsg(t(res.error));
                }
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
            setErrorMsg(t('generic_error'));
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
            <VendorPaymentInfoStep
                vendorId={event.vendor_id}
                vendor={event.vendor}
                totalPrice={totalPrice}
                bookingId={bookingId}
                uploading={uploading}
                errorMsg={errorMsg}
                copiedField={copiedField}
                copyToClipboard={copyToClipboard}
                handleFileUpload={handleFileUpload}
                setStatus={setStatus}
                t={t}
            />
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

            <div className="flex justify-between items-baseline mb-6">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('starting_price')}</p>
                    <p className="text-4xl font-black text-gray-900">
                        {activeTicket?.price > 0 ? `${activeTicket.price} ${cs}` : t('free')}
                        <span className="text-sm font-bold text-gray-400 ml-2 tracking-normal">{t('per_person')}</span>
                    </p>
                </div>
            </div>

            {/* Date & Time Info */}
            <div className="mb-8 flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100 text-primary">
                    <Calendar className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1">
                        {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span dir="ltr">
                            {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' })}
                            {event.end_date && ` - ${new Date(event.end_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' })}`}
                        </span>
                    </div>
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
                                    <span className="font-black text-gray-900">{ticket.price > 0 ? `${ticket.price} ${cs}` : t('free')}</span>
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
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-gray-400"
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
                            {t('discount_applied')} (-{appliedDiscount.amount} {cs})
                        </p>
                    )}
                </div>

                {/* Payment Method Selection */}
                <div className="space-y-4">
                    <label className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        {t('select_payment_method')}
                    </label>
                    <div className="grid gap-3">
                        {/* Bank Transfer (Active) */}
                        <div className="relative overflow-hidden rounded-2xl border-2 border-primary bg-primary/5 p-4 flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-primary">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-black text-gray-900 text-sm">{t('bank_transfer')}</p>
                                    <p className="text-[10px] font-bold text-gray-500">{t('bank_transfer_desc')}</p>
                                </div>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                                <CheckCircle className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Online Payment (Disabled) */}
                        <div className="relative overflow-hidden rounded-2xl border-2 border-gray-100 bg-gray-50 p-4 flex items-center justify-between opacity-60 grayscale cursor-not-allowed">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-400">
                                    <Tag className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-black text-gray-900 text-sm">{t('online_payment')}</p>
                                    <p className="text-[10px] font-bold text-gray-500">{t('credit_card')}</p>
                                </div>
                            </div>
                            <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                {t('coming_soon')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Summary & Call to Action */}
                <div className="pt-8 space-y-4">
                    <div className="space-y-2 px-2">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">{t('base_price')}</span>
                            <span className="text-gray-900 font-bold">{basePrice} {cs}</span>
                        </div>
                        {bulkDiscountAmount > 0 && (
                            <div className="flex justify-between items-center text-emerald-600">
                                <span className="font-bold uppercase tracking-widest text-[10px]">{t('bulk_discount')}</span>
                                <span className="font-bold">-{bulkDiscountAmount} {cs}</span>
                            </div>
                        )}
                        {appliedDiscount && (
                            <div className="flex justify-between items-center text-emerald-600">
                                <span className="font-bold uppercase tracking-widest text-[10px]">{t('promo_code')}</span>
                                <span className="font-bold">-{appliedDiscount.amount} {cs}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                            <span className="text-gray-900 font-black uppercase tracking-widest text-xs font-bold">{t('total_to_pay')}</span>
                            <span className="text-3xl font-black text-gray-900">{totalPrice} {cs}</span>
                        </div>
                    </div>

                    {errorMsg && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-6 rounded-2xl border ${existingBookingId
                                ? 'bg-amber-50 border-amber-200'
                                : 'bg-rose-50 border-rose-100'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-xl ${existingBookingId
                                    ? 'bg-amber-100 text-amber-600'
                                    : 'bg-rose-100 text-rose-600'
                                    }`}>
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className={`font-bold text-sm ${existingBookingId
                                        ? 'text-amber-900'
                                        : 'text-rose-600'
                                        }`}>
                                        {errorMsg}
                                    </p>
                                    {existingBookingId && (
                                        <Link
                                            href="/dashboard/user"
                                            className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm"
                                        >
                                            <span>{t('manage_booking')}</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Policy Notice Above Book Button */}
                    {hasPolicy && (
                        <div className="rounded-2xl border border-violet-100 bg-violet-50/50 overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setPolicyOpen(!policyOpen)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left"
                            >
                                <ShieldCheck className="w-4 h-4 text-violet-600 shrink-0" />
                                <span className="flex-1 text-xs font-bold text-violet-700">{t('policy_applies')}</span>
                                <ChevronDown className={`w-4 h-4 text-violet-400 transition-transform ${policyOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {policyOpen && (
                                <div className="px-4 pb-4 space-y-3">
                                    {event.vendor?.cancellation_policy && (
                                        <div>
                                            <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest mb-1">{t('cancellation_policy')}</p>
                                            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{event.vendor.cancellation_policy}</p>
                                        </div>
                                    )}
                                    {event.vendor?.return_policy && (
                                        <div>
                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{t('return_policy')}</p>
                                            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{event.vendor.return_policy}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={handleBook}
                        disabled={loading}
                        className="w-full relative py-6 bg-gray-900 text-white rounded-3xl font-black text-xl hover:bg-primary transition-all shadow-2xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-3 group overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/5 skew-x-[-20deg] translate-x-[-100%] group-hover:translate-x-[150%] transition-transform duration-1000" />
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <span>{t('book_now')}</span>}
                        {!loading && <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
                    </button>

                    <div className="flex items-center justify-center gap-3 text-gray-400 pt-2">
                        <Info className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t('instant_confirmation')}</span>
                    </div>
                </div>
            </div>

            {/* Mobile Login Dialog */}
            <MobileLoginDialog
                isOpen={showLoginDialog}
                onClose={() => setShowLoginDialog(false)}
                onAuthSuccess={() => {
                    setShowLoginDialog(false);
                    // Small delay to ensure auth state is available on the server
                    setTimeout(() => handleBook(), 300);
                }}
                returnUrl={typeof window !== 'undefined' ? window.location.pathname : undefined}
            />
        </div>
    );
}

// ─── Dynamic Payment Info Step ──────────────────────────────────────────────

function VendorPaymentInfoStep({
    vendorId, vendor, totalPrice, bookingId, uploading, errorMsg,
    copiedField, copyToClipboard, handleFileUpload, setStatus, t,
}: {
    vendorId: string;
    vendor: any;
    totalPrice: number;
    bookingId: string | null;
    uploading: boolean;
    errorMsg: string;
    copiedField: string | null;
    copyToClipboard: (text: string, field: string) => void;
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    setStatus: (s: any) => void;
    t: any;
}) {
    const [vendorMethods, setVendorMethods] = useState<any[]>([]);
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [loadingMethods, setLoadingMethods] = useState(true);

    useEffect(() => {
        loadMethods();
    }, [vendorId]);

    const loadMethods = async () => {
        try {
            const { createClient } = await import('@/utils/supabase/client');
            const supabase = createClient();
            const { data } = await supabase
                .from('vendor_payment_methods')
                .select('*, payment_methods(*)')
                .eq('vendor_id', vendorId)
                .eq('is_active', true);

            if (data && data.length > 0) {
                setVendorMethods(data);
                setSelectedMethod(data[0].id);
            }
        } catch (e) { /* fallback to legacy */ }
        setLoadingMethods(false);
    };

    const currentMethod = vendorMethods.find(m => m.id === selectedMethod);
    const pm = currentMethod?.payment_methods;

    // Fallback to legacy bank details if no dynamic methods configured
    const useLegacy = !loadingMethods && vendorMethods.length === 0;
    const currencySymbol = getCurrencySymbol(vendor?.country);

    const iconMap: Record<string, string> = { bank_transfer: '🏦', mobile_wallet: '📱', payment_link: '🔗' };

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

            {/* Amount */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-6">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('amount_to_transfer')}</span>
                    <span className="text-xl font-black text-primary">{totalPrice} {currencySymbol}</span>
                </div>
            </div>

            {loadingMethods && (
                <div className="flex justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
            )}

            {/* Dynamic Methods */}
            {!loadingMethods && vendorMethods.length > 1 && (
                <div className="flex gap-2 mb-6">
                    {vendorMethods.map(vm => (
                        <button
                            key={vm.id}
                            onClick={() => setSelectedMethod(vm.id)}
                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                                selectedMethod === vm.id
                                    ? 'bg-primary text-white shadow-lg'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <span className="mr-2">{iconMap[vm.payment_methods?.method_type] || '💳'}</span>
                            {vm.payment_methods?.label_ar || vm.payment_methods?.label_en}
                        </button>
                    ))}
                </div>
            )}

            {/* Payment Details */}
            {currentMethod && pm && (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-primary mb-2">
                        <span className="text-lg">{iconMap[pm.method_type] || '💳'}</span>
                        <span className="font-bold text-sm">{pm.label_ar || pm.label_en}</span>
                    </div>

                    {Object.entries(currentMethod.details as Record<string, string>).map(([key, value]) => {
                        if (!value) return null;
                        const label = key === 'bank_name' ? t('bank_name')
                            : key === 'iban' ? t('iban')
                            : key === 'account_holder' ? t('account_holder')
                            : key === 'phone_number' ? 'Phone'
                            : key === 'payment_url' ? 'Payment Link'
                            : key;

                        return (
                            <div key={key}>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {key === 'payment_url' ? (
                                        <a
                                            href={value}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-bold text-primary underline break-all flex-1"
                                        >
                                            {value}
                                        </a>
                                    ) : (
                                        <p className={`font-bold text-gray-900 flex-1 ${key === 'iban' || key === 'account_number' ? 'break-all bg-white p-2 rounded-lg border border-gray-200 font-mono' : ''}`}>
                                            {value}
                                        </p>
                                    )}
                                    <button
                                        onClick={() => copyToClipboard(value, key)}
                                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
                                    >
                                        {copiedField === key ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Legacy Bank Info (fallback) */}
            {useLegacy && (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-3 mb-6">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('bank_name')}</p>
                        <p className="font-bold text-gray-900">{vendor?.bank_name || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('account_holder')}</p>
                        <div className="flex justify-between items-center gap-2">
                            <p className="font-bold text-gray-900 flex-1">{vendor?.bank_account_name || 'N/A'}</p>
                            <button onClick={() => copyToClipboard(vendor?.bank_account_name, 'name')} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors shrink-0">
                                {copiedField === 'name' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('iban')}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="font-bold text-gray-900 break-all bg-white p-2 rounded-lg border border-gray-200 select-all font-mono flex-1">{vendor?.bank_iban || 'N/A'}</p>
                            <button onClick={() => copyToClipboard(vendor?.bank_iban, 'iban')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0">
                                {copiedField === 'iban' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Link CTA */}
            {pm?.method_type === 'payment_link' && currentMethod?.details?.payment_url && (
                <a
                    href={currentMethod.details.payment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-4 bg-primary text-white text-center font-black rounded-2xl mb-4 hover:bg-primary/90 transition-colors"
                >
                    Pay via {currentMethod.details?.provider_name || pm.label_en} →
                </a>
            )}

            {/* Receipt Upload (for bank_transfer and mobile_wallet) */}
            {(pm?.method_type !== 'payment_link' || useLegacy) && (
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

                    {errorMsg && <p className="text-center text-xs font-bold text-rose-600">{errorMsg}</p>}

                    <div className="flex items-center justify-center gap-3 text-gray-400 pt-2">
                        <Info className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-center">{t('payment_verification_note')}</span>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

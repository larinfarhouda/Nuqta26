'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBooking } from '@/actions/public/events';
import { validateDiscountCode } from '@/actions/public/discounts';
import {
    Loader2, Ticket, CheckCircle, ChevronRight, ChevronLeft,
    Tag, Calendar, Clock, Copy, Check, ShieldCheck, ChevronDown,
    Building, Smartphone, Link as LinkIcon, CreditCard,
    AlertCircle, Upload, Users, Minus, Plus, ArrowRight, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { getEventStatus } from '@/utils/eventStatus';
import { MobileLoginDialog } from '@/components/auth/MobileLoginDialog';
import { Link } from '@/navigation';
import { getCurrencySymbol } from '@/utils/country-helpers';
import { createClient } from '@/utils/supabase/client';

// ─── Types ──────────────────────────────────────────────────────────────────

type BookingStep = 'TICKET' | 'QUANTITY' | 'REVIEW' | 'PAYMENT' | 'SUCCESS';

interface EventBookingFormProps {
    event: any;
    tickets: any[];
    isInSheet?: boolean;
    onComplete?: () => void;
}

// ─── Step Progress ──────────────────────────────────────────────────────────

function StepProgress({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
    return (
        <div className="flex gap-1.5 mb-6">
            {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i < currentStep ? 'bg-primary' : i === currentStep ? 'bg-primary/60' : 'bg-gray-200'
                    }`}
                />
            ))}
        </div>
    );
}

// ─── Step Header ────────────────────────────────────────────────────────────

function StepHeader({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack?: () => void }) {
    return (
        <div className="flex items-start gap-3 mb-5">
            {onBack && (
                <button
                    onClick={onBack}
                    className="p-1.5 -ml-1 mt-0.5 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-500 rtl:rotate-180" />
                </button>
            )}
            <div>
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}

// ─── Slide Transition Wrapper ───────────────────────────────────────────────

const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 60 : -60, opacity: 0 }),
};

// ─── Main Component ─────────────────────────────────────────────────────────

export default function EventBookingForm({ event, tickets, isInSheet = false, onComplete }: EventBookingFormProps) {
    const t = useTranslations('Events');
    const cs = getCurrencySymbol(event.country);

    // ─── State ──────────────────────────────────────────────────────────────

    const [step, setStep] = useState<BookingStep>('TICKET');
    const [direction, setDirection] = useState(1);

    const [selectedTicket, setSelectedTicket] = useState(tickets[0]?.id);
    const [quantity, setQuantity] = useState(1);
    const [policyOpen, setPolicyOpen] = useState(false);

    const [discountCode, setDiscountCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState<{ id: string; amount: number; code: string } | null>(null);
    const [validatingCode, setValidatingCode] = useState(false);
    const [discountExpanded, setDiscountExpanded] = useState(false);

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [bookingId, setBookingId] = useState<string | null>(null);

    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [existingBookingId, setExistingBookingId] = useState<string | null>(null);

    // Payment
    const [vendorPaymentMethods, setVendorPaymentMethods] = useState<any[]>([]);
    const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);

    // Analytics (success screen)
    const [analyticsGender, setAnalyticsGender] = useState<string | null>(null);
    const [analyticsAge, setAnalyticsAge] = useState<string | null>(null);
    const [analyticsSource, setAnalyticsSource] = useState<string | null>(null);
    const [analyticsSaved, setAnalyticsSaved] = useState(false);

    const hasPolicy = !!(event.vendor?.cancellation_policy || event.vendor?.return_policy);

    const PAYMENT_METHOD_ICONS: Record<string, React.ElementType> = {
        bank_transfer: Building,
        mobile_wallet: Smartphone,
        payment_link: LinkIcon,
    };

    // ─── Computed ───────────────────────────────────────────────────────────

    const activeTicket = tickets.find((t: any) => t.id === selectedTicket);
    const basePrice = activeTicket ? activeTicket.price * quantity : 0;

    let bulkDiscountAmount = 0;
    if (event.bulk_discounts && event.bulk_discounts.length > 0) {
        const applicableBulk = [...event.bulk_discounts]
            .sort((a: any, b: any) => b.min_quantity - a.min_quantity)
            .find((d: any) => quantity >= d.min_quantity);
        if (applicableBulk) {
            bulkDiscountAmount = applicableBulk.discount_type === 'percentage'
                ? (basePrice * applicableBulk.discount_value) / 100
                : applicableBulk.discount_value;
        }
    }

    const totalPrice = Math.max(0, basePrice - bulkDiscountAmount - (appliedDiscount?.amount || 0));
    const isFreeEvent = totalPrice === 0;

    const eventStatus = getEventStatus(event);
    const isExpired = eventStatus === 'expired';
    const isSoldOut = eventStatus === 'sold_out';
    const isBookable = eventStatus === 'active';

    const totalSteps = isFreeEvent ? 3 : 4; // TICKET, QUANTITY, REVIEW, (PAYMENT if paid)
    const stepIndex = step === 'TICKET' ? 0 : step === 'QUANTITY' ? 1 : step === 'REVIEW' ? 2 : step === 'PAYMENT' ? 3 : 3;

    // Remaining spots for the active ticket
    const remainingSpots = activeTicket && activeTicket.quantity && activeTicket.sold != null
        ? activeTicket.quantity - activeTicket.sold
        : null;

    // ─── Load payment methods once ──────────────────────────────────────────

    useEffect(() => {
        const loadPaymentMethods = async () => {
            try {
                const supabase = createClient();
                const { data } = await supabase
                    .from('vendor_payment_methods')
                    .select('*, payment_methods(*)')
                    .eq('vendor_id', event.vendor_id)
                    .eq('is_active', true);

                if (data && data.length > 0) {
                    setVendorPaymentMethods(data);
                    setSelectedPaymentMethod(data[0].id);
                }
            } catch { /* fallback */ }
            setLoadingPaymentMethods(false);
        };
        loadPaymentMethods();
    }, [event.vendor_id]);

    // ─── Navigation ─────────────────────────────────────────────────────────

    const goTo = useCallback((nextStep: BookingStep) => {
        const order: BookingStep[] = ['TICKET', 'QUANTITY', 'REVIEW', 'PAYMENT', 'SUCCESS'];
        const currentIdx = order.indexOf(step);
        const nextIdx = order.indexOf(nextStep);
        setDirection(nextIdx > currentIdx ? 1 : -1);
        setErrorMsg('');
        setStep(nextStep);
    }, [step]);

    // ─── Handlers ───────────────────────────────────────────────────────────

    const copyToClipboard = (text: string, field: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleApplyDiscount = async () => {
        if (!discountCode || !isBookable) return;
        setValidatingCode(true);
        setErrorMsg('');
        try {
            const res = await validateDiscountCode(
                discountCode, event.vendor_id, event.id, basePrice - bulkDiscountAmount
            );
            if (res.success) {
                setAppliedDiscount({ id: res.discountId!, amount: res.discountAmount!, code: discountCode });
            } else {
                if (res.error === 'min_purchase_not_met' && res.requiredAmount) {
                    setErrorMsg(t('min_purchase_not_met', { amount: res.requiredAmount }));
                } else {
                    setErrorMsg(t(res.error || 'invalid_code'));
                }
            }
        } catch {
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
                if (res.requiresAuth) {
                    setShowLoginDialog(true);
                } else if (res.requiresManagement) {
                    setExistingBookingId(res.bookingId || null);
                    setErrorMsg(t(res.error));
                } else {
                    setErrorMsg(t(res.error));
                }
            } else {
                if (totalPrice > 0) {
                    setBookingId(res.bookingId || null);
                    goTo('PAYMENT');
                } else {
                    setBookingId(res.bookingId || null);
                    goTo('SUCCESS');
                }
            }
        } catch {
            setErrorMsg(t('generic_error'));
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length || !bookingId) return;
        setUploading(true);
        setUploadProgress(0);
        const file = e.target.files[0];
        const fileName = `receipts/${bookingId}-${Date.now()}.${file.name.split('.').pop()}`;

        // Show preview
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => setUploadedPreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        }

        // Simulate progress for UX
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 15, 85));
        }, 200);

        try {
            const supabase = createClient();
            const { error: uploadError } = await supabase.storage.from('booking-receipts').upload(fileName, file);
            if (uploadError) throw uploadError;

            setUploadProgress(90);

            const { data: { publicUrl } } = supabase.storage.from('booking-receipts').getPublicUrl(fileName);
            const { error: dbError } = await supabase
                .from('bookings')
                .update({ payment_proof_url: publicUrl, status: 'payment_submitted' })
                .eq('id', bookingId);

            if (dbError) throw dbError;

            setUploadProgress(100);
            clearInterval(progressInterval);

            setTimeout(() => goTo('SUCCESS'), 500);
        } catch {
            clearInterval(progressInterval);
            setUploadProgress(0);
            setUploadedPreview(null);
            setErrorMsg(t('generic_error'));
        } finally {
            setUploading(false);
        }
    };

    const handleSaveAnalytics = async () => {
        if (analyticsSaved) return;
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const updates: Record<string, any> = {};
            if (analyticsGender) updates.gender = analyticsGender;
            if (analyticsAge) updates.age = parseInt(analyticsAge);
            if (analyticsSource) {
                updates.referral_source = { source: analyticsSource, from: 'booking_survey' };
            }

            if (Object.keys(updates).length > 0) {
                await supabase.from('profiles').update(updates).eq('id', user.id);
            }
            setAnalyticsSaved(true);
        } catch { /* silently fail */ }
    };

    // ─── Expired / Sold Out ─────────────────────────────────────────────────

    if (isExpired || isSoldOut) {
        return (
            <div className={`rounded-2xl p-6 border ${isInSheet ? '' : 'sticky top-32'} ${isExpired ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                <div className="text-center py-6">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isExpired ? 'bg-red-100' : 'bg-amber-100'}`}>
                        {isExpired ? <AlertCircle className="w-8 h-8 text-red-600" /> : <AlertCircle className="w-8 h-8 text-amber-600" />}
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${isExpired ? 'text-red-900' : 'text-amber-900'}`}>
                        {isExpired ? t('event_ended') : t('status_sold_out')}
                    </h3>
                    <p className={`text-sm ${isExpired ? 'text-red-700' : 'text-amber-700'}`}>
                        {isExpired ? t('expired_message') : t('sold_out_message')}
                    </p>
                </div>
            </div>
        );
    }

    // ─── Render ─────────────────────────────────────────────────────────────

    return (
        <div className={`${isInSheet ? '' : 'bg-white rounded-2xl shadow-lg p-6 border border-gray-100 sticky top-32'}`}>

            {step !== 'SUCCESS' && (
                <StepProgress currentStep={stepIndex} totalSteps={totalSteps} />
            )}

            <AnimatePresence mode="wait" custom={direction}>
                {/* ═══════════════════ STEP 1: TICKET ═══════════════════ */}
                {step === 'TICKET' && (
                    <motion.div
                        key="ticket"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                    >
                        <StepHeader
                            title={t('select_ticket')}
                            subtitle={`${tickets.length} ${tickets.length === 1 ? 'option' : 'options'} available`}
                        />

                        <div className="space-y-3">
                            {tickets.map((ticket: any) => {
                                const isSelected = selectedTicket === ticket.id;
                                const spotsLeft = ticket.quantity && ticket.sold != null ? ticket.quantity - ticket.sold : null;
                                return (
                                    <button
                                        key={ticket.id}
                                        onClick={() => setSelectedTicket(ticket.id)}
                                        className={`w-full text-left rounded-xl p-4 border-2 transition-all ${
                                            isSelected
                                                ? 'border-primary bg-primary/5 ring-2 ring-primary/10'
                                                : 'border-gray-100 bg-white hover:border-gray-200'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                                        isSelected ? 'border-primary' : 'border-gray-300'
                                                    }`}>
                                                        {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                                                    </div>
                                                    <span className={`font-bold text-sm ${isSelected ? 'text-primary' : 'text-gray-900'}`}>
                                                        {ticket.name}
                                                    </span>
                                                </div>
                                                {ticket.description && (
                                                    <p className="text-xs text-gray-500 mt-1 ml-6 line-clamp-2">{ticket.description}</p>
                                                )}
                                                {spotsLeft !== null && spotsLeft <= 10 && spotsLeft > 0 && (
                                                    <p className="text-xs text-amber-600 font-semibold mt-1 ml-6">
                                                        {spotsLeft} spots left
                                                    </p>
                                                )}
                                            </div>
                                            <span className="font-bold text-gray-900 shrink-0 ml-3">
                                                {ticket.price > 0 ? `${ticket.price} ${cs}` : t('free')}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Date & Time reminder */}
                        <div className="mt-5 flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <Calendar className="w-4 h-4 text-primary shrink-0" />
                            <div className="text-xs text-gray-600">
                                <span className="font-semibold">
                                    {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                                </span>
                                <span className="mx-1.5 text-gray-300">·</span>
                                <span dir="ltr">
                                    {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' })}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => goTo('QUANTITY')}
                            disabled={!selectedTicket}
                            className="w-full mt-5 py-3.5 bg-primary text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50 active:scale-[0.98]"
                        >
                            <span>{t('book_now').includes('Book') ? 'Continue' : 'متابعة'}</span>
                            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                        </button>
                    </motion.div>
                )}

                {/* ═══════════════════ STEP 2: QUANTITY ═══════════════════ */}
                {step === 'QUANTITY' && (
                    <motion.div
                        key="quantity"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                    >
                        <StepHeader
                            title={t('number_of_guests')}
                            subtitle={activeTicket?.name}
                            onBack={() => goTo('TICKET')}
                        />

                        {/* Quantity Stepper */}
                        <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-100">
                            <div>
                                <p className="text-sm font-bold text-gray-900">{t('number_of_guests')}</p>
                                <p className="text-xs text-gray-500">{t('max_guests', { count: 10 })}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-700 hover:border-primary hover:text-primary transition-all active:scale-90"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="font-bold text-xl text-gray-900 w-6 text-center">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                                    className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-700 hover:border-primary hover:text-primary transition-all active:scale-90"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Bulk discount notice */}
                        {bulkDiscountAmount > 0 && (
                            <div className="mt-3 flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                <Tag className="w-4 h-4 text-emerald-600 shrink-0" />
                                <p className="text-xs font-semibold text-emerald-700">{t('bulk_discount')}: -{bulkDiscountAmount} {cs}</p>
                            </div>
                        )}

                        {/* Discount Code (collapsible) */}
                        <div className="mt-4">
                            <button
                                onClick={() => setDiscountExpanded(!discountExpanded)}
                                className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
                            >
                                <Tag className="w-3.5 h-3.5" />
                                {t('discount_code')}
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${discountExpanded ? 'rotate-180' : ''}`} />
                            </button>

                            {discountExpanded && (
                                <div className="mt-3 space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={discountCode}
                                            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                                            onKeyDown={(e) => e.key === 'Enter' && handleApplyDiscount()}
                                            placeholder="SAVE20"
                                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                            disabled={appliedDiscount !== null}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleApplyDiscount}
                                            disabled={validatingCode || !discountCode || appliedDiscount !== null}
                                            className="px-5 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-primary transition-all disabled:opacity-50"
                                        >
                                            {validatingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : (appliedDiscount ? <CheckCircle className="w-4 h-4" /> : t('apply'))}
                                        </button>
                                    </div>
                                    {appliedDiscount && (
                                        <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            {t('discount_applied')} (-{appliedDiscount.amount} {cs})
                                        </p>
                                    )}
                                    {errorMsg && step === 'QUANTITY' && (
                                        <p className="text-xs font-semibold text-rose-600">{errorMsg}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Price Summary */}
                        <div className="mt-5 p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">{activeTicket?.name} × {quantity}</span>
                                <span className="text-gray-900 font-semibold">{basePrice} {cs}</span>
                            </div>
                            {bulkDiscountAmount > 0 && (
                                <div className="flex justify-between text-sm text-emerald-600">
                                    <span>{t('bulk_discount')}</span>
                                    <span>-{bulkDiscountAmount} {cs}</span>
                                </div>
                            )}
                            {appliedDiscount && (
                                <div className="flex justify-between text-sm text-emerald-600">
                                    <span>{t('promo_code')}</span>
                                    <span>-{appliedDiscount.amount} {cs}</span>
                                </div>
                            )}
                            <div className="flex justify-between pt-2 border-t border-gray-200">
                                <span className="text-sm font-bold text-gray-900">{t('total_to_pay')}</span>
                                <span className="text-lg font-bold text-gray-900">{totalPrice} {cs}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => goTo('REVIEW')}
                            className="w-full mt-5 py-3.5 bg-primary text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-[0.98]"
                        >
                            <span>{t('book_now').includes('Book') ? 'Continue' : 'متابعة'}</span>
                            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                        </button>
                    </motion.div>
                )}

                {/* ═══════════════════ STEP 3: REVIEW ═══════════════════ */}
                {step === 'REVIEW' && (
                    <motion.div
                        key="review"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                    >
                        <StepHeader
                            title={t('book_now').includes('Book') ? 'Review & Confirm' : 'مراجعة وتأكيد'}
                            onBack={() => goTo('QUANTITY')}
                        />

                        {/* Order Summary */}
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                                    <Ticket className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate">{event.title}</p>
                                    <p className="text-xs text-gray-500">
                                        {activeTicket?.name} × {quantity}
                                    </p>
                                </div>
                                <p className="text-sm font-bold text-gray-900 shrink-0">{totalPrice} {cs}</p>
                            </div>

                            <div className="h-px bg-gray-200" />

                            <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                                <p className="text-xs text-gray-600">
                                    {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                                    <span className="mx-1">·</span>
                                    <span dir="ltr">{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' })}</span>
                                </p>
                            </div>
                        </div>

                        {/* Payment Method Selection (for paid events) */}
                        {!isFreeEvent && (
                            <div className="mt-5 space-y-3">
                                <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-primary" />
                                    {t('select_payment_method')}
                                </p>

                                {loadingPaymentMethods ? (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                    </div>
                                ) : vendorPaymentMethods.length > 0 ? (
                                    <div className="space-y-2">
                                        {vendorPaymentMethods.map(vm => {
                                            const pm = vm.payment_methods;
                                            const isSelected = selectedPaymentMethod === vm.id;
                                            const Icon = PAYMENT_METHOD_ICONS[pm?.method_type] || CreditCard;
                                            return (
                                                <button
                                                    key={vm.id}
                                                    onClick={() => setSelectedPaymentMethod(vm.id)}
                                                    className={`w-full rounded-xl border-2 p-3 flex items-center gap-3 transition-all ${
                                                        isSelected
                                                            ? 'border-primary bg-primary/5'
                                                            : 'border-gray-100 bg-white hover:border-gray-200'
                                                    }`}
                                                >
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-900 flex-1 text-left">{pm?.label_en}</span>
                                                    {isSelected && (
                                                        <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                                                            <Check className="w-3 h-3" />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="rounded-xl border-2 border-primary bg-primary/5 p-3 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <Building className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900">{t('bank_transfer')}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Policy */}
                        {hasPolicy && (
                            <div className="mt-4 rounded-xl border border-gray-100 overflow-hidden">
                                <button
                                    onClick={() => setPolicyOpen(!policyOpen)}
                                    className="w-full flex items-center gap-2 px-4 py-3 text-left"
                                >
                                    <ShieldCheck className="w-4 h-4 text-gray-400 shrink-0" />
                                    <span className="flex-1 text-xs font-semibold text-gray-600">{t('policy_applies')}</span>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${policyOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {policyOpen && (
                                    <div className="px-4 pb-3 space-y-2">
                                        {event.vendor?.cancellation_policy && (
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 mb-1">{t('cancellation_policy')}</p>
                                                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{event.vendor.cancellation_policy}</p>
                                            </div>
                                        )}
                                        {event.vendor?.return_policy && (
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 mb-1">{t('return_policy')}</p>
                                                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{event.vendor.return_policy}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Error Messages */}
                        {errorMsg && (
                            <div className={`mt-4 p-4 rounded-xl border ${existingBookingId ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-100'}`}>
                                <div className="flex items-start gap-3">
                                    <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${existingBookingId ? 'text-amber-500' : 'text-rose-500'}`} />
                                    <div className="flex-1">
                                        <p className={`text-sm font-semibold ${existingBookingId ? 'text-amber-800' : 'text-rose-700'}`}>
                                            {errorMsg}
                                        </p>
                                        {existingBookingId && (
                                            <Link
                                                href="/dashboard/user"
                                                className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold text-xs transition-all hover:bg-amber-700"
                                            >
                                                {t('manage_booking')}
                                                <ChevronRight className="w-3 h-3" />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Book Now CTA */}
                        <button
                            onClick={handleBook}
                            disabled={loading}
                            className="w-full mt-5 py-4 bg-gray-900 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-primary transition-all disabled:opacity-50 active:scale-[0.98] shadow-lg"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>{t('book_now')}</span>
                                    <ChevronRight className="w-5 h-5 rtl:rotate-180" />
                                </>
                            )}
                        </button>

                        <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {t('instant_confirmation')}
                        </p>
                    </motion.div>
                )}

                {/* ═══════════════════ STEP 4: PAYMENT ═══════════════════ */}
                {step === 'PAYMENT' && (
                    <motion.div
                        key="payment"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                    >
                        <StepHeader
                            title={t('complete_payment')}
                            subtitle={t('payment_instruction')}
                        />

                        {/* Amount */}
                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 mb-5">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">{t('amount_to_transfer')}</span>
                                <span className="text-xl font-bold text-primary">{totalPrice} {cs}</span>
                            </div>
                        </div>

                        {/* Payment Details */}
                        <PaymentDetails
                            vendorPaymentMethods={vendorPaymentMethods}
                            selectedPaymentMethod={selectedPaymentMethod}
                            vendor={event.vendor}
                            copiedField={copiedField}
                            copyToClipboard={copyToClipboard}
                            t={t}
                        />

                        {/* Upload Section */}
                        <div className="mt-6 space-y-3">
                            <p className="text-sm font-bold text-gray-900">{t('upload_receipt')}</p>

                            {uploadedPreview ? (
                                <div className="relative rounded-xl overflow-hidden border border-gray-200">
                                    <img src={uploadedPreview} alt="Payment screenshot" className="w-full h-48 object-cover" />
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                                            <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                                            <div className="w-32 h-1.5 bg-white/30 rounded-full overflow-hidden">
                                                <div className="h-full bg-white rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                            </div>
                                            <p className="text-white text-xs mt-1 font-semibold">{uploadProgress}%</p>
                                        </div>
                                    )}
                                    {uploadProgress === 100 && (
                                        <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                                            <CheckCircle className="w-12 h-12 text-emerald-600" />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <label className="block cursor-pointer">
                                    <div className={`w-full rounded-xl border-2 border-dashed p-8 flex flex-col items-center justify-center transition-all ${
                                        uploading
                                            ? 'bg-gray-50 border-gray-200 opacity-50 cursor-wait'
                                            : 'bg-primary/5 border-primary/20 hover:border-primary/40 hover:bg-primary/10'
                                    }`}>
                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3">
                                            <Upload className="w-6 h-6 text-primary" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-900">{t('upload_receipt')}</span>
                                        <span className="text-xs text-gray-500 mt-1">{t('receipt_format')}</span>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*,.pdf"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                    />
                                </label>
                            )}

                            {errorMsg && step === 'PAYMENT' && (
                                <p className="text-center text-xs font-semibold text-rose-600 bg-rose-50 p-2 rounded-lg">{errorMsg}</p>
                            )}

                            <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                {t('payment_verification_note')}
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* ═══════════════════ STEP 5: SUCCESS ═══════════════════ */}
                {step === 'SUCCESS' && (
                    <motion.div
                        key="success"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                        <div className="text-center py-4">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', damping: 12, delay: 0.1 }}
                                className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
                            >
                                <CheckCircle className="w-8 h-8" />
                            </motion.div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('booking_confirmed')}</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {totalPrice > 0 ? t('booking_submitted_msg') : t('booking_success_msg', { title: event.title })}
                            </p>
                        </div>

                        {/* Analytics Survey (optional) */}
                        {!analyticsSaved && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="mt-5 p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-4"
                            >
                                <p className="text-sm font-semibold text-gray-900">
                                    {t('book_now').includes('Book') ? 'Help us improve your experience' : 'ساعدنا نحسّن تجربتك'}
                                    <span className="text-xs text-gray-400 font-normal ml-1">
                                        ({t('book_now').includes('Book') ? 'optional' : 'اختياري'})
                                    </span>
                                </p>

                                {/* Gender */}
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-gray-500">
                                        {t('book_now').includes('Book') ? 'Gender' : 'الجنس'}
                                    </p>
                                    <div className="flex gap-2">
                                        {[
                                            { value: 'male', label: t('book_now').includes('Book') ? 'Male' : 'ذكر' },
                                            { value: 'female', label: t('book_now').includes('Book') ? 'Female' : 'أنثى' },
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setAnalyticsGender(analyticsGender === opt.value ? null : opt.value)}
                                                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                                                    analyticsGender === opt.value
                                                        ? 'bg-primary text-white'
                                                        : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Age Range */}
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-gray-500">
                                        {t('book_now').includes('Book') ? 'Age Range' : 'الفئة العمرية'}
                                    </p>
                                    <div className="flex gap-2 flex-wrap">
                                        {[
                                            { value: '20', label: '18-24' },
                                            { value: '28', label: '25-34' },
                                            { value: '38', label: '35-44' },
                                            { value: '50', label: '45+' },
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setAnalyticsAge(analyticsAge === opt.value ? null : opt.value)}
                                                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all min-w-[60px] ${
                                                    analyticsAge === opt.value
                                                        ? 'bg-primary text-white'
                                                        : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Acquisition Source */}
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-gray-500">
                                        {t('book_now').includes('Book') ? 'How did you find us?' : 'كيف عرفت عنّا؟'}
                                    </p>
                                    <div className="flex gap-2 flex-wrap">
                                        {[
                                            { value: 'instagram', label: 'Instagram' },
                                            { value: 'whatsapp', label: 'WhatsApp' },
                                            { value: 'friend', label: t('book_now').includes('Book') ? 'Friend' : 'صديق' },
                                            { value: 'google', label: 'Google' },
                                            { value: 'other', label: t('book_now').includes('Book') ? 'Other' : 'أخرى' },
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setAnalyticsSource(analyticsSource === opt.value ? null : opt.value)}
                                                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                                    analyticsSource === opt.value
                                                        ? 'bg-primary text-white'
                                                        : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Save Analytics */}
                                {(analyticsGender || analyticsAge || analyticsSource) && (
                                    <button
                                        onClick={handleSaveAnalytics}
                                        className="w-full py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all active:scale-[0.98]"
                                    >
                                        {t('book_now').includes('Book') ? 'Done' : 'تم'}
                                    </button>
                                )}
                            </motion.div>
                        )}

                        {/* Saved confirmation */}
                        {analyticsSaved && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center text-sm text-emerald-600 font-semibold mt-3 flex items-center justify-center gap-1"
                            >
                                <Sparkles className="w-4 h-4" />
                                {t('book_now').includes('Book') ? 'Thank you for your feedback!' : 'شكراً لمشاركتك!'}
                            </motion.p>
                        )}

                        {/* Actions */}
                        <div className="mt-5 space-y-2">
                            <Link
                                href="/dashboard/user"
                                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary transition-all active:scale-[0.98]"
                            >
                                {t('manage_booking')}
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Login Dialog */}
            <MobileLoginDialog
                isOpen={showLoginDialog}
                onClose={() => setShowLoginDialog(false)}
                onAuthSuccess={() => {
                    setShowLoginDialog(false);
                    setTimeout(() => handleBook(), 300);
                }}
                returnUrl={typeof window !== 'undefined' ? window.location.pathname : undefined}
            />
        </div>
    );
}

// ─── Payment Details Sub-Component ──────────────────────────────────────────

function PaymentDetails({
    vendorPaymentMethods, selectedPaymentMethod, vendor,
    copiedField, copyToClipboard, t,
}: {
    vendorPaymentMethods: any[];
    selectedPaymentMethod: string | null;
    vendor: any;
    copiedField: string | null;
    copyToClipboard: (text: string, field: string) => void;
    t: any;
}) {
    const currentMethod = vendorPaymentMethods.find(m => m.id === selectedPaymentMethod);
    const pm = currentMethod?.payment_methods;
    const useLegacy = vendorPaymentMethods.length === 0;

    if (useLegacy) {
        return (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                <PaymentField label={t('bank_name')} value={vendor?.bank_name} />
                <PaymentField label={t('account_holder')} value={vendor?.bank_account_name} copied={copiedField} fieldKey="name" onCopy={copyToClipboard} />
                <PaymentField label={t('iban')} value={vendor?.bank_iban} copied={copiedField} fieldKey="iban" onCopy={copyToClipboard} mono />
            </div>
        );
    }

    if (!currentMethod || !pm) return null;

    // Payment Link CTA
    if (pm.method_type === 'payment_link' && currentMethod.details?.payment_url) {
        return (
            <div className="space-y-3">
                <a
                    href={currentMethod.details.payment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-3.5 bg-primary text-white text-center font-bold rounded-xl hover:bg-primary/90 transition-colors"
                >
                    Pay via {currentMethod.details?.provider_name || pm.label_en} →
                </a>
            </div>
        );
    }

    return (
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
            {Object.entries(currentMethod.details as Record<string, string>).map(([key, value]) => {
                if (!value) return null;
                const label = key === 'bank_name' ? t('bank_name')
                    : key === 'iban' ? t('iban')
                    : key === 'account_holder' ? t('account_holder')
                    : key === 'phone_number' ? 'Phone'
                    : key === 'payment_url' ? 'Payment Link'
                    : key;

                return (
                    <PaymentField
                        key={key}
                        label={label}
                        value={value}
                        copied={copiedField}
                        fieldKey={key}
                        onCopy={copyToClipboard}
                        mono={key === 'iban' || key === 'account_number'}
                        isLink={key === 'payment_url'}
                    />
                );
            })}
        </div>
    );
}

// ─── Payment Field Sub-Component ────────────────────────────────────────────

function PaymentField({
    label, value, copied, fieldKey, onCopy, mono, isLink,
}: {
    label: string;
    value?: string;
    copied?: string | null;
    fieldKey?: string;
    onCopy?: (text: string, field: string) => void;
    mono?: boolean;
    isLink?: boolean;
}) {
    return (
        <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
            <div className="flex items-center gap-2">
                {isLink ? (
                    <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-primary underline break-all flex-1"
                    >
                        {value}
                    </a>
                ) : (
                    <p className={`text-sm font-semibold text-gray-900 flex-1 ${
                        mono ? 'break-all bg-white p-2 rounded-lg border border-gray-200 font-mono text-xs' : ''
                    }`}>
                        {value || 'N/A'}
                    </p>
                )}
                {onCopy && fieldKey && value && (
                    <button
                        onClick={() => onCopy(value, fieldKey)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
                    >
                        {copied === fieldKey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                    </button>
                )}
            </div>
        </div>
    );
}

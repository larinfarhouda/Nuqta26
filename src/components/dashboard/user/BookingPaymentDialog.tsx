'use client';

import { useState } from 'react';
import { Loader2, CheckCircle, Info, ChevronRight, TrendingUp, X, Upload, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { submitPaymentProof } from '@/actions/user';

export default function BookingPaymentDialog({ booking }: { booking: any }) {
    const t = useTranslations('Events');
    const [isOpen, setIsOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const copyToClipboard = (text: string, field: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    // If status is not pending_payment, don't show anything (or show different status)
    // But this component is likely conditionally rendered or button is. 
    // We'll render the trigger button here.

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length || !booking.id) return;
        setUploading(true);
        const file = e.target.files[0];
        const fileName = `receipts/${booking.id}-${Date.now()}.${file.name.split('.').pop()}`;

        try {
            const { createClient } = await import('@/utils/supabase/client');
            const supabase = createClient();

            const { error: uploadError } = await supabase.storage.from('booking-receipts').upload(fileName, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('booking-receipts').getPublicUrl(fileName);

            // Call server action to update booking and send email
            const result = await submitPaymentProof(booking.id, publicUrl);

            if (result.error) throw new Error(result.error);

            setIsSuccess(true);
            setTimeout(() => {
                setIsOpen(false);
                window.location.reload(); // Simple reload to refresh data
            }, 2000);
        } catch (err: any) {
            setErrorMsg(err.message || t('generic_error'));
        } finally {
            setUploading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition shadow-sm"
            >
                {t('complete_payment')}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
                        />
                        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-white rounded-[2.5rem] shadow-2xl p-8 w-full max-w-lg pointer-events-auto max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-2xl font-black text-gray-900">{t('complete_payment')}</h3>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>

                                {isSuccess ? (
                                    <div className="text-center py-10">
                                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <CheckCircle className="w-10 h-10" />
                                        </div>
                                        <h3 className="text-2xl font-black text-emerald-900 mb-3">{t('booking_confirmed')}</h3>
                                        <p className="text-emerald-700 font-bold">{t('booking_submitted_msg')}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4">
                                            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('amount_to_transfer')}</span>
                                                <span className="text-xl font-black text-primary">{booking.total_amount} ₺</span>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('bank_name')}</p>
                                                    <p className="font-bold text-gray-900">{booking.event?.vendor?.bank_name || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('account_holder')}</p>
                                                    <div className="flex justify-between items-center">
                                                        <p className="font-bold text-gray-900">{booking.event?.vendor?.bank_account_name || 'N/A'}</p>
                                                        <button
                                                            onClick={() => copyToClipboard(booking.event?.vendor?.bank_account_name, 'name')}
                                                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                                            title="Copy Name"
                                                        >
                                                            {copiedField === 'name' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('iban')}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <p className="font-bold text-gray-900 break-all bg-white p-2 rounded-lg border border-gray-200 select-all font-mono flex-1">
                                                            {booking.event?.vendor?.bank_iban || 'N/A'}
                                                        </p>
                                                        <button
                                                            onClick={() => copyToClipboard(booking.event?.vendor?.bank_iban, 'iban')}
                                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                                                            title="Copy IBAN"
                                                        >
                                                            {copiedField === 'iban' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <label className="block w-full">
                                            <div className={`w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer ${uploading ? 'bg-gray-50 border-gray-200 opacity-50' : 'bg-primary/5 border-primary/20 hover:border-primary/40'}`}>
                                                {uploading ? (
                                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                                ) : (
                                                    <>
                                                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                                                            <Upload className="w-6 h-6 text-primary" />
                                                        </div>
                                                        <span className="text-xs font-black text-gray-900 uppercase tracking-widest">{t('upload_receipt')}</span>
                                                        <span className="text-[10px] text-gray-400 font-bold mt-1 text-center max-w-[200px]">{t('receipt_format')}</span>
                                                    </>
                                                )}
                                                <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} disabled={uploading} />
                                            </div>
                                        </label>

                                        {errorMsg && (
                                            <p className="text-center text-xs font-bold text-rose-600 bg-rose-50 p-2 rounded-lg">{errorMsg}</p>
                                        )}

                                        <div className="flex items-center justify-center gap-2 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                                            <Info className="w-3 h-3" />
                                            {t('payment_verification_note')}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

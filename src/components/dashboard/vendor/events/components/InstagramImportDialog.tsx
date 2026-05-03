'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { importFromInstagram, type InstagramImportResult } from '@/actions/vendor/instagram-import';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onImport: (data: InstagramImportResult) => void;
}

// Instagram gradient colors
const IG_GRADIENT = 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)';

export default function InstagramImportDialog({ isOpen, onClose, onImport }: Props) {
    const [url, setUrl] = useState('');
    const [fallbackCaption, setFallbackCaption] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showFallback, setShowFallback] = useState(true);
    const [step, setStep] = useState<'idle' | 'fetching' | 'analyzing' | 'done'>('idle');

    const stepMessages = {
        idle: '',
        fetching: 'جاري جلب البيانات من انستقرام...',
        analyzing: '✨ الذكاء الاصطناعي يحلل المحتوى...',
        done: 'تم! يتم فتح النموذج...',
    };

    const handleImport = async () => {
        if (!url.trim()) return;

        setLoading(true);
        setError(null);
        setStep('fetching');

        // Auto-transition to 'analyzing' step after 2s for visual progress
        const analyzeTimer = setTimeout(() => setStep('analyzing'), 2000);

        try {
            const result = await importFromInstagram(url.trim(), fallbackCaption || undefined);

            clearTimeout(analyzeTimer);

            if (result.needsFallback) {
                setShowFallback(true);
                setLoading(false);
                setStep('idle');
                setError('الرجاء لصق نص المنشور (الوصف) في الحقل أدناه ثم حاول مرة أخرى');
                return;
            }

            if (result.error) {
                if (result.error === 'INVALID_URL') {
                    setError('الرابط غير صالح. يرجى لصق رابط منشور انستقرام.');
                } else {
                    setError(result.error);
                }
                setLoading(false);
                setStep('idle');
                return;
            }

            if (result.data) {
                setStep('done');
                // Small delay to show success state
                setTimeout(() => {
                    onImport(result.data!);
                    resetState();
                }, 400);
            }
        } catch (err) {
            clearTimeout(analyzeTimer);
            setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
            setLoading(false);
            setStep('idle');
        }
    };

    const resetState = () => {
        setUrl('');
        setFallbackCaption('');
        setLoading(false);
        setError(null);
        setShowFallback(false);
        setStep('idle');
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    if (!isOpen || typeof document === 'undefined') return null;

    const content = (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1, transition: { type: "spring", damping: 25, stiffness: 300 } }}
                    exit={{ y: "100%", opacity: 0 }}
                    className="bg-white rounded-t-[2rem] sm:rounded-3xl w-full sm:max-w-lg overflow-hidden shadow-2xl"
                    dir="rtl"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header with Instagram gradient */}
                    <div className="relative overflow-hidden">
                        <div
                            className="absolute inset-0 opacity-10"
                            style={{ background: IG_GRADIENT }}
                        />
                        <div className="relative p-5 sm:p-6 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                {/* Instagram Icon */}
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
                                    style={{ background: IG_GRADIENT }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900">استيراد من انستقرام</h3>
                                    <p className="text-xs text-gray-500 font-medium">ألصق رابط المنشور ونص الوصف وسنستخرج البيانات</p>
                                </div>
                            </div>
                            <button onClick={handleClose} className="p-2.5 bg-gray-50 text-gray-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 sm:p-6 pt-2 space-y-4">
                        {/* URL Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">رابط المنشور</label>
                            <div className="relative">
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => { setUrl(e.target.value); setError(null); }}
                                    placeholder="https://www.instagram.com/p/..."
                                    className="w-full h-12 px-4 pr-12 bg-gray-50 rounded-xl border-2 border-gray-100 focus:border-pink-300 focus:bg-white focus:outline-none text-sm font-medium text-gray-900 transition-all placeholder:text-gray-400"
                                    dir="ltr"
                                    disabled={loading}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleImport(); }}
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Fallback: Manual Caption Input */}
                        <AnimatePresence>
                            {showFallback && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="space-y-2 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <AlertCircle className="w-4 h-4" />
                                            <span className="text-xs font-bold">نص المنشور (الوصف)</span>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            انسخ وصف المنشور من انستقرام والصقه هنا لاستخراج التفاصيل تلقائياً
                                        </p>
                                        <textarea
                                            value={fallbackCaption}
                                            onChange={(e) => setFallbackCaption(e.target.value)}
                                            placeholder="ألصق وصف المنشور من انستقرام هنا..."
                                            className="w-full min-h-[100px] p-3 bg-white rounded-xl border border-amber-200 text-sm text-gray-900 focus:outline-none focus:border-amber-300 resize-none"
                                            dir="rtl"
                                            disabled={loading}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600"
                                >
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span className="text-xs font-bold">{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Loading Progress */}
                        <AnimatePresence>
                            {loading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-3"
                                >
                                    {/* Shimmer progress bar */}
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{ background: IG_GRADIENT }}
                                            initial={{ width: '0%' }}
                                            animate={{ width: step === 'fetching' ? '40%' : step === 'analyzing' ? '80%' : '100%' }}
                                            transition={{ duration: 1.5, ease: 'easeOut' }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {step !== 'done' ? (
                                            <Loader2 className="w-4 h-4 text-pink-500 animate-spin" />
                                        ) : (
                                            <Sparkles className="w-4 h-4 text-pink-500" />
                                        )}
                                        <span className="text-xs font-bold text-gray-600">
                                            {stepMessages[step]}
                                        </span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* AI Features Hint */}
                        {!loading && (
                            <div className="flex flex-wrap gap-2">
                                {['العنوان', 'الوصف', 'التاريخ', 'الموقع', 'السعر', 'الصورة'].map((tag) => (
                                    <span key={tag} className="px-2.5 py-1 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                        <Sparkles className="w-2.5 h-2.5" />
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Import Button */}
                        <button
                            onClick={handleImport}
                            disabled={loading || !url.trim() || (showFallback && !fallbackCaption.trim())}
                            className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-xl hover:scale-[1.02] active:scale-95"
                            style={{
                                background: loading ? '#9ca3af' : IG_GRADIENT,
                            }}
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    {showFallback ? 'استخراج بيانات الفعالية' : 'استيراد الفعالية'}
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );

    return createPortal(content, document.body);
}

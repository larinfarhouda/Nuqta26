'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Download, Copy, Check, Share2,
    MessageCircle, Facebook, Sparkles, Calendar,
    MapPin, Tag, ExternalLink, Image as ImageIcon
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { useTranslations, useLocale } from 'next-intl';
import { getCurrencySymbol } from '@/utils/country-helpers';
import { createPortal } from 'react-dom';

interface ShareEventModalProps {
    event: any;
    isOpen: boolean;
    onClose: () => void;
    isPostPublish?: boolean;
}

export default function ShareEventModal({ event, isOpen, onClose, isPostPublish = false }: ShareEventModalProps) {
    const t = useTranslations('Dashboard.vendor.share');
    const locale = useLocale();
    const cardRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);
    const [copiedCaption, setCopiedCaption] = useState<'ar' | 'en' | null>(null);
    const [copiedLink, setCopiedLink] = useState(false);

    const handleDownloadImage = useCallback(async () => {
        if (!cardRef.current || !event) return;
        setDownloading(true);
        try {
            const dataUrl = await toPng(cardRef.current, {
                cacheBust: true,
                pixelRatio: 2,
                backgroundColor: '#ffffff',
            });
            const link = document.createElement('a');
            link.download = `${event.title.replace(/\s+/g, '-')}-nuqta.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to generate image:', err);
        } finally {
            setDownloading(false);
        }
    }, [event]);

    const handleCopyCaption = useCallback(async (language: 'ar' | 'en') => {
        if (!event) return;
        const eventDate = new Date(event.date);
        const captionAr = buildCaptionAr(event, eventDate, locale);
        const captionEn = buildCaptionEn(event, eventDate, locale);
        const text = language === 'ar' ? captionAr : captionEn;
        await navigator.clipboard.writeText(text);
        setCopiedCaption(language);
        setTimeout(() => setCopiedCaption(null), 2000);
    }, [event, locale]);

    const handleCopyLink = useCallback(async () => {
        if (!event) return;
        const eventUrl = `https://nuqta.ist/ar/events/${event.slug || event.id}`;
        await navigator.clipboard.writeText(eventUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    }, [event]);

    const handleWhatsAppShare = useCallback(() => {
        if (!event) return;
        const eventDate = new Date(event.date);
        const caption = locale === 'ar'
            ? buildCaptionAr(event, eventDate, locale)
            : buildCaptionEn(event, eventDate, locale);
        const text = encodeURIComponent(caption);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    }, [event, locale]);

    const handleFacebookShare = useCallback(() => {
        if (!event) return;
        const eventUrl = `https://nuqta.ist/ar/events/${event.slug || event.id}`;
        const url = encodeURIComponent(eventUrl);
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    }, [event]);

    // Early return AFTER all hooks
    if (!event || typeof document === 'undefined') return null;

    const eventDate = new Date(event.date);
    const formattedDateAr = eventDate.toLocaleDateString('ar', {
        weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC'
    });
    const formattedTimeAr = eventDate.toLocaleTimeString('ar', {
        hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC'
    });
    const formattedDateEn = eventDate.toLocaleDateString('en', {
        weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC'
    });
    const formattedTimeEn = eventDate.toLocaleTimeString('en', {
        hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC'
    });

    const eventUrl = `https://nuqta.ist/ar/events/${event.slug || event.id}`;
    const currencySymbol = getCurrencySymbol(event.country);
    const minPrice = Array.isArray(event.tickets)
        ? Math.min(...event.tickets.map((t: any) => t.price || 0))
        : 0;

    const captionAr = buildCaptionAr(event, eventDate, locale);
    const captionEn = buildCaptionEn(event, eventDate, locale);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1, transition: { type: "spring", damping: 25, stiffness: 300 } }}
                        exit={{ y: "100%", opacity: 0 }}
                        className="bg-white rounded-t-[2rem] sm:rounded-3xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col relative"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-5 sm:p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-xl z-20">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                    {isPostPublish && <Sparkles className="w-5 h-5 text-amber-500" />}
                                    {isPostPublish ? t('published_title') : t('title')}
                                </h3>
                                <p className="text-sm text-gray-500 font-medium mt-1">
                                    {isPostPublish ? t('published_subtitle') : t('subtitle')}
                                </p>
                            </div>
                            <button onClick={onClose} className="p-3 bg-gray-50 text-gray-500 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 space-y-6">
                            {/* ===== Shareable Card Preview ===== */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <ImageIcon className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('card_preview')}</span>
                                </div>

                                {/* The card that will be captured as an image */}
                                <div
                                    ref={cardRef}
                                    className="relative overflow-hidden rounded-2xl border border-gray-100 shadow-lg"
                                    style={{ aspectRatio: '1 / 1', maxWidth: '100%' }}
                                >
                                    {/* Background image or gradient */}
                                    {event.image_url ? (
                                        <img
                                            src={event.image_url}
                                            alt=""
                                            className="absolute inset-0 w-full h-full object-cover"
                                            crossOrigin="anonymous"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#264653] via-[#2A9D8F] to-[#E9C46A]" />
                                    )}

                                    {/* Dark overlay for text readability */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

                                    {/* Content */}
                                    <div className="absolute inset-0 flex flex-col justify-between p-6">
                                        {/* Top: Nuqta branding */}
                                        <div className="flex justify-between items-start">
                                            <div className="bg-white/20 backdrop-blur-md rounded-xl px-3 py-1.5 border border-white/20">
                                                <span className="text-white font-black text-sm tracking-wide">NUQTA</span>
                                            </div>
                                            {minPrice > 0 ? (
                                                <div className="bg-white/20 backdrop-blur-md rounded-xl px-3 py-1.5 border border-white/20">
                                                    <span className="text-white font-black text-sm">{minPrice} {currencySymbol}</span>
                                                </div>
                                            ) : (
                                                <div className="bg-emerald-500/80 backdrop-blur-md rounded-xl px-3 py-1.5">
                                                    <span className="text-white font-black text-sm">{locale === 'ar' ? 'مجاني' : 'FREE'}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Bottom: Event details */}
                                        <div className="space-y-3">
                                            <h3 className="text-white font-black text-2xl sm:text-3xl leading-tight drop-shadow-lg line-clamp-3">
                                                {event.title}
                                            </h3>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-white/90 text-sm font-semibold">
                                                    <Calendar className="w-4 h-4 flex-shrink-0" />
                                                    <span>{locale === 'ar' ? formattedDateAr : formattedDateEn} · {locale === 'ar' ? formattedTimeAr : formattedTimeEn}</span>
                                                </div>
                                                {(event.location_name || event.district) && (
                                                    <div className="flex items-center gap-2 text-white/90 text-sm font-semibold">
                                                        <MapPin className="w-4 h-4 flex-shrink-0" />
                                                        <span className="line-clamp-1">{event.location_name || event.district}{event.city ? `, ${event.city}` : ''}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 pt-1">
                                                <div className="h-[2px] flex-1 bg-white/20 rounded-full" />
                                                <span className="text-white/60 text-[10px] font-bold tracking-widest uppercase">nuqta.ist</span>
                                                <div className="h-[2px] flex-1 bg-white/20 rounded-full" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Download button */}
                                <button
                                    onClick={handleDownloadImage}
                                    disabled={downloading}
                                    className="w-full mt-3 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors active:scale-[0.98]"
                                >
                                    {downloading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Download className="w-4 h-4" />
                                    )}
                                    {t('download_image')}
                                </button>
                            </div>

                            {/* ===== Pre-written Captions ===== */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Tag className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('captions')}</span>
                                </div>

                                <div className="space-y-3">
                                    {/* Arabic Caption */}
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 relative group">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('caption_ar')}</span>
                                            <button
                                                onClick={() => handleCopyCaption('ar')}
                                                className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg text-xs font-bold text-gray-600 hover:text-primary border border-gray-200 hover:border-primary/30 transition-all"
                                            >
                                                {copiedCaption === 'ar' ? (
                                                    <><Check className="w-3 h-3 text-emerald-500" /><span className="text-emerald-500">{t('copied')}</span></>
                                                ) : (
                                                    <><Copy className="w-3 h-3" />{t('copy')}</>
                                                )}
                                            </button>
                                        </div>
                                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed" dir="rtl">
                                            {captionAr}
                                        </pre>
                                    </div>

                                    {/* English Caption */}
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 relative group">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('caption_en')}</span>
                                            <button
                                                onClick={() => handleCopyCaption('en')}
                                                className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg text-xs font-bold text-gray-600 hover:text-primary border border-gray-200 hover:border-primary/30 transition-all"
                                            >
                                                {copiedCaption === 'en' ? (
                                                    <><Check className="w-3 h-3 text-emerald-500" /><span className="text-emerald-500">{t('copied')}</span></>
                                                ) : (
                                                    <><Copy className="w-3 h-3" />{t('copy')}</>
                                                )}
                                            </button>
                                        </div>
                                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                                            {captionEn}
                                        </pre>
                                    </div>
                                </div>
                            </div>

                            {/* ===== Share Buttons ===== */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Share2 className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('share_via')}</span>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    {/* WhatsApp */}
                                    <button
                                        onClick={handleWhatsAppShare}
                                        className="flex flex-col items-center gap-2 p-4 bg-[#25D366]/10 rounded-xl border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-all group"
                                    >
                                        <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <MessageCircle className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="text-xs font-bold text-gray-700">WhatsApp</span>
                                    </button>

                                    {/* Facebook */}
                                    <button
                                        onClick={handleFacebookShare}
                                        className="flex flex-col items-center gap-2 p-4 bg-[#1877F2]/10 rounded-xl border border-[#1877F2]/20 hover:bg-[#1877F2]/20 transition-all group"
                                    >
                                        <div className="w-10 h-10 bg-[#1877F2] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Facebook className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="text-xs font-bold text-gray-700">Facebook</span>
                                    </button>

                                    {/* Copy Link */}
                                    <button
                                        onClick={handleCopyLink}
                                        className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-all group"
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all ${copiedLink ? 'bg-emerald-500' : 'bg-gray-900'}`}>
                                            {copiedLink ? (
                                                <Check className="w-5 h-5 text-white" />
                                            ) : (
                                                <ExternalLink className="w-5 h-5 text-white" />
                                            )}
                                        </div>
                                        <span className="text-xs font-bold text-gray-700">
                                            {copiedLink ? t('copied') : t('copy_link')}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Event link display */}
                            <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 border border-gray-100">
                                <div className="flex-1 truncate text-sm text-gray-600 font-mono">{eventUrl}</div>
                                <button
                                    onClick={handleCopyLink}
                                    className="flex-shrink-0 px-3 py-1.5 bg-white rounded-lg text-xs font-bold text-gray-600 hover:text-primary border border-gray-200 transition-all"
                                >
                                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-5 sm:p-6 border-t border-gray-100 sticky bottom-0 bg-white/95 backdrop-blur-xl">
                            <button
                                onClick={onClose}
                                className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-[0.98]"
                            >
                                {isPostPublish ? t('done') : t('close')}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

// Helper functions for caption building (outside component to avoid hook issues)
function buildCaptionAr(event: any, eventDate: Date, locale: string): string {
    const formattedDateAr = eventDate.toLocaleDateString('ar', {
        weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC'
    });
    const formattedTimeAr = eventDate.toLocaleTimeString('ar', {
        hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC'
    });
    const currencySymbol = getCurrencySymbol(event.country);
    const minPrice = Array.isArray(event.tickets)
        ? Math.min(...event.tickets.map((t: any) => t.price || 0))
        : 0;
    const eventUrl = `https://nuqta.ist/ar/events/${event.slug || event.id}`;

    return `🎉 ${event.title}

📅 ${formattedDateAr} | ${formattedTimeAr}
📍 ${event.location_name || event.district || ''}${event.city ? `، ${event.city}` : ''}
${minPrice > 0 ? `🎟️ ${minPrice} ${currencySymbol}` : '🎟️ مجاني'}

احجز مكانك الآن 👇
${eventUrl}`;
}

function buildCaptionEn(event: any, eventDate: Date, locale: string): string {
    const formattedDateEn = eventDate.toLocaleDateString('en', {
        weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC'
    });
    const formattedTimeEn = eventDate.toLocaleTimeString('en', {
        hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC'
    });
    const currencySymbol = getCurrencySymbol(event.country);
    const minPrice = Array.isArray(event.tickets)
        ? Math.min(...event.tickets.map((t: any) => t.price || 0))
        : 0;
    const eventUrl = `https://nuqta.ist/ar/events/${event.slug || event.id}`;

    return `🎉 ${event.title}

📅 ${formattedDateEn} | ${formattedTimeEn}
📍 ${event.location_name || event.district || ''}${event.city ? `, ${event.city}` : ''}
${minPrice > 0 ? `🎟️ ${minPrice} ${currencySymbol}` : '🎟️ Free'}

Book your spot now 👇
${eventUrl}`;
}

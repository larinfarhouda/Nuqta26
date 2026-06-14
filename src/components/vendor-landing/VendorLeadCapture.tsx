'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Send, CheckCircle, Loader2, Building2, Mail, Phone, Instagram } from 'lucide-react';

export default function VendorLeadCapture() {
    const t = useTranslations('VendorLanding.LeadCapture');
    const [formData, setFormData] = useState({
        businessName: '',
        email: '',
        phone: '',
        instagram: '',
    });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        try {
            const response = await fetch('/api/lead-capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMessage(data.error || t('error_generic'));
                setStatus('error');
                return;
            }

            setStatus('success');
            setFormData({ businessName: '', email: '', phone: '', instagram: '' });
        } catch {
            setErrorMessage(t('error_generic'));
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <section id="lead-capture" className="py-16 md:py-20 bg-gradient-to-b from-white to-[#f0faf7]">
                <div className="container mx-auto px-4">
                    <div className="max-w-lg mx-auto text-center">
                        <div className="w-16 h-16 bg-[#2CA58D]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-8 h-8 text-[#2CA58D]" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            {t('success_title')}
                        </h3>
                        <p className="text-gray-600 text-base">
                            {t('success_message')}
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="lead-capture" className="py-16 md:py-20 bg-gradient-to-b from-white to-[#f0faf7]">
            <div className="container mx-auto px-4">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-3">
                            {t('title')}
                        </h2>
                        <p className="text-base md:text-lg text-gray-500 font-medium max-w-xl mx-auto">
                            {t('subtitle')}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Business Name */}
                            <div className="relative">
                                <Building2 className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    required
                                    value={formData.businessName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                                    placeholder={t('field_business_name')}
                                    className="w-full ps-12 pe-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2CA58D]/30 focus:border-[#2CA58D] transition-all bg-white"
                                />
                            </div>

                            {/* Email */}
                            <div className="relative">
                                <Mail className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder={t('field_email')}
                                    className="w-full ps-12 pe-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2CA58D]/30 focus:border-[#2CA58D] transition-all bg-white"
                                />
                            </div>

                            {/* Phone (Optional) */}
                            <div className="relative">
                                <Phone className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder={t('field_phone')}
                                    className="w-full ps-12 pe-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2CA58D]/30 focus:border-[#2CA58D] transition-all bg-white"
                                />
                            </div>

                            {/* Instagram (Optional) */}
                            <div className="relative">
                                <Instagram className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={formData.instagram}
                                    onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                                    placeholder={t('field_instagram')}
                                    className="w-full ps-12 pe-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2CA58D]/30 focus:border-[#2CA58D] transition-all bg-white"
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {status === 'error' && (
                            <p className="text-red-500 text-sm text-center font-medium">
                                {errorMessage}
                            </p>
                        )}

                        {/* Submit Button */}
                        <div className="text-center pt-2">
                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="inline-flex items-center gap-3 px-10 md:px-14 py-4 bg-[#2CA58D] text-white font-bold text-base md:text-lg rounded-2xl transition-all duration-300 shadow-lg shadow-[#2CA58D]/20 hover:shadow-[#2CA58D]/40 hover:scale-[1.02] hover:bg-[#25917b] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {status === 'loading' ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5 rtl:rotate-180" />
                                )}
                                <span>{status === 'loading' ? t('submitting') : t('submit')}</span>
                            </button>
                        </div>

                        <p className="text-center text-sm text-gray-400 font-medium">
                            {t('privacy_note')}
                        </p>
                    </form>
                </div>
            </div>
        </section>
    );
}

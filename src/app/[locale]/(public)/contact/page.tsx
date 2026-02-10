'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageSquare, Sparkles, Globe } from 'lucide-react';
import { useState } from 'react';

export default function ContactPage() {
    const t = useTranslations('StaticPages.Contact');
    const [status, setStatus] = useState<'idle' | 'success'>('idle');
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // TODO: Implement actual API submission
            // const result = await submitContactForm(formData); 
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
            setStatus('success');
        } catch (error) {
            console.error('Contact form error:', error);
            alert('Failed to send message. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const contactMethods = [
        {
            icon: <Mail className="w-8 h-8" />,
            label: t('cards.email'),
            value: "info@nuqta.ist",
            color: "from-blue-500/10 to-blue-600/5 text-blue-700 border-blue-200/50"
        },
        {
            icon: <MessageSquare className="w-8 h-8" />,
            label: t('cards.whatsapp'),
            value: "+90 555 123 4567",
            color: "from-emerald-500/10 to-emerald-600/5 text-emerald-700 border-emerald-200/50"
        },
        {
            icon: <MapPin className="w-8 h-8" />,
            label: t('cards.location'),
            value: t('cards.location_val'),
            color: "from-amber-500/10 to-amber-600/5 text-amber-700 border-amber-200/50"
        }
    ];

    return (
        <main className="min-h-screen bg-[#fffcf9]"> {/* Warmest White */}
            {/* Dynamic Hero Section */}
            <div className="relative overflow-hidden pt-32 pb-16 lg:pt-48 lg:pb-24">
                {/* Living Background */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-secondary/20 to-transparent rounded-bl-full" />
                    <div className="absolute bottom-0 left-0 w-[40%] h-1/2 bg-gradient-to-tr from-primary/10 to-transparent rounded-tr-full" />
                    <div className="absolute inset-0 bg-[url('/images/patterns/natural-paper.png')] opacity-10" />
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-3xl mx-auto space-y-8"
                    >
                        <div className="inline-flex items-center gap-2 px-6 py-2 bg-white/50 backdrop-blur-xl border border-secondary/30 rounded-full text-amber-700 font-black shadow-xl shadow-secondary/5">
                            <Sparkles className="w-4 h-4 fill-amber-700" />
                            <span>{t('badge')}</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.1] tracking-tighter">
                            {t('title')}
                        </h1>
                        <p className="text-lg md:text-xl text-gray-500 font-medium leading-relaxed max-w-2xl mx-auto">
                            {t('subtitle')}
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Elegant Contact Grid */}
            <div className="container mx-auto px-4 pb-20 relative z-10">
                <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {contactMethods.map((method, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className={`group p-10 rounded-[3.5rem] bg-gradient-to-br ${method.color} border shadow-2xl shadow-gray-200/50 flex flex-col items-center text-center gap-6 transition-all hover:-translate-y-2 hover:shadow-primary/10`}
                        >
                            <div className="p-5 rounded-[2rem] bg-white shadow-xl group-hover:scale-110 transition-transform">
                                {method.icon}
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">{method.label}</p>
                                <p className="text-2xl font-black">{method.value}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Modern Form Section */}
            <div className="container mx-auto px-4 pb-32">
                <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 bg-white rounded-[4rem] p-8 md:p-16 border border-secondary/20 shadow-[0_50px_100px_-20px_rgba(251,191,36,0.1)] relative overflow-hidden">

                    {/* Decorative background for the form container */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -ml-32 -mb-32" />

                    <div className="space-y-8 relative z-10">
                        <div className="space-y-4">
                            <h2 className="text-2xl md:text-3xl font-black text-gray-900">{t('form_title')}</h2>
                            <p className="text-lg text-gray-500 font-medium">{t('partner_cta')}</p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <Globe className="w-6 h-6" />
                                </div>
                                <p className="font-bold text-gray-700">{t('available_globally')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10">
                        {status === 'success' ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6 bg-emerald-50/50 rounded-[3rem] border border-emerald-100"
                            >
                                <div className="w-24 h-24 bg-white text-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                                    <Send className="w-10 h-10" />
                                </div>
                                <p className="text-2xl font-black text-gray-900">{t('success_msg')}</p>
                            </motion.div>
                        ) : (
                            <form
                                className="space-y-4"
                                onSubmit={handleSubmit}
                            >
                                <div className="grid gap-4">
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder={t('name_placeholder')}
                                        className="w-full px-8 py-5 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-900 placeholder:text-gray-300"
                                    />
                                    <input
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder={t('email_placeholder')}
                                        className="w-full px-8 py-5 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-900 placeholder:text-gray-300"
                                    />
                                    <textarea
                                        required
                                        value={formData.message}
                                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                                        placeholder={t('message_placeholder')}
                                        rows={5}
                                        className="w-full px-8 py-5 rounded-3xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-gray-900 placeholder:text-gray-300"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-6 bg-primary text-white font-black rounded-[2rem] shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group disabled:opacity-70 disabled:active:scale-100"
                                >
                                    <span className="text-xl">{submitting ? '...' : t('submit_btn')}</span>
                                    {!submitting && <Send className="w-6 h-6 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform rtl:group-hover:-translate-x-2" />}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}

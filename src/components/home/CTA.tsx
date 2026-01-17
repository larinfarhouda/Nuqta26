'use client';

import { useTranslations } from 'next-intl';
import { Users, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CTA() {
    const t = useTranslations('Index');
    const tAuth = useTranslations('Auth');

    return (
        <section className="py-24 px-4 bg-[#fffdfa]">
            <div className="container mx-auto relative group">
                {/* Background Glows for the whole section */}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-secondary/20 rounded-full blur-[80px] pointer-events-none" />

                <div className="bg-gradient-to-br from-[#1a2e2e] via-[#0d6b6b] to-[#124d4d] rounded-[4rem] p-10 md:p-24 text-center text-white relative overflow-hidden shadow-2xl shadow-primary/20">
                    {/* Living Background Patterns */}
                    <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] mix-blend-overlay" />

                    {/* Animated Geometric Ornaments */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-24 -right-24 w-96 h-96 border border-white/5 rounded-[4rem] group-hover:border-white/10 transition-colors"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute -bottom-24 -left-24 w-64 h-64 border border-secondary/10 rounded-full group-hover:border-secondary/20 transition-colors"
                    />

                    <div className="relative z-10 max-w-4xl mx-auto space-y-12">
                        <div className="space-y-4">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-secondary" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Ready to start?</span>
                            </motion.div>
                            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                                {t('cta.title')}
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 mt-8">
                            <motion.div
                                whileHover={{ y: -10 }}
                                className="bg-white/10 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 hover:bg-white transition-all group cursor-pointer text-left flex flex-col items-start gap-4"
                                onClick={() => window.location.href = '/login'}
                            >
                                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-primary shadow-xl group-hover:scale-110 transition-transform">
                                    <Users className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl md:text-2xl font-black mb-1 group-hover:text-gray-900 transition-colors">{t('cta.user_btn')}</h3>
                                    <p className="text-white/60 group-hover:text-gray-500 font-medium text-sm leading-relaxed mb-6">{t('cta.user_desc')}</p>
                                    <div className="inline-flex items-center gap-2 text-secondary font-black text-xs uppercase tracking-widest group-hover:text-primary transition-colors">
                                        <span>{tAuth('loginUser')}</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                whileHover={{ y: -10 }}
                                className="bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/5 hover:bg-white transition-all group cursor-pointer text-left flex flex-col items-start gap-4"
                                onClick={() => window.location.href = '/login'}
                            >
                                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
                                    <Calendar className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl md:text-2xl font-black mb-1 group-hover:text-gray-900 transition-colors">{t('cta.vendor_btn')}</h3>
                                    <p className="text-white/60 group-hover:text-gray-500 font-medium text-sm leading-relaxed mb-6">{t('cta.vendor_desc')}</p>
                                    <div className="inline-flex items-center gap-2 text-white/40 font-black text-xs uppercase tracking-widest group-hover:text-primary transition-colors">
                                        <span>{tAuth('loginVendor')}</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

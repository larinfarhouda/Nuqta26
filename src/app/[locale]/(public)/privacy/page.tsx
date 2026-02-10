'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, CheckCircle2 } from 'lucide-react';

export default function PrivacyPage() {
    const t = useTranslations('StaticPages.Privacy');

    const sections = [
        { icon: <Eye className="w-6 h-6 text-primary" />, title: t('s1_title'), desc: t('s1_desc') },
        { icon: <Lock className="w-6 h-6 text-primary" />, title: t('s2_title'), desc: t('s2_desc') },
        { icon: <Shield className="w-6 h-6 text-primary" />, title: t('s3_title'), desc: t('s3_desc') },
        { icon: <FileText className="w-6 h-6 text-primary" />, title: t('s4_title'), desc: t('s4_desc') },
    ];

    return (
        <main className="min-h-screen bg-[#fffcf9]"> {/* Warm Background */}
            {/* Header with Warmth */}
            <div className="relative overflow-hidden pt-32 pb-16 lg:pt-48 lg:pb-32 bg-gradient-to-b from-primary/5 to-transparent">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-10" />

                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-4xl mx-auto text-center space-y-6"
                    >
                        <div className="w-20 h-20 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center mx-auto text-primary mb-8 border border-secondary/20 rotate-3">
                            <Shield className="w-10 h-10" />
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-tight">
                            {t('title')}
                        </h1>
                        <div className="flex items-center justify-center gap-2 text-primary font-black uppercase tracking-widest text-xs py-2 px-4 bg-white rounded-full shadow-sm border border-gray-100 inline-flex">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{t('last_updated')}</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Elegant Content Container */}
            <div className="container mx-auto px-4 pb-32">
                <div className="max-w-4xl mx-auto bg-white border border-secondary/10 rounded-[4rem] p-10 md:p-20 shadow-2xl shadow-gray-200/50 relative overflow-hidden">
                    {/* Decorative paper texture on the card too */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-[0.03] pointer-events-none" />

                    <div className="space-y-16 relative z-10">
                        {sections.map((section, idx) => (
                            <motion.section
                                key={idx}
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="group space-y-6"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-secondary/20 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-lg shadow-secondary/5 group-hover:shadow-primary/20">
                                        {section.icon}
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">{section.title}</h2>
                                </div>
                                <p className="text-lg text-gray-600 leading-relaxed font-medium pl-2 md:pl-19 border-l-4 border-secondary/20 group-hover:border-primary transition-colors duration-500">
                                    {section.desc}
                                </p>
                            </motion.section>
                        ))}
                    </div>

                    <div className="mt-24 pt-12 border-t border-gray-100 text-center">
                        <div className="inline-block px-8 py-6 rounded-[2rem] bg-gray-50 border border-gray-100 italic">
                            <p className="text-gray-500 font-medium">
                                If you have any questions regarding this privacy policy, please contact us at <br />
                                <span className="text-primary font-black not-italic text-lg">info@nuqta.ist</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

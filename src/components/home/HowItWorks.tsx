'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Search, Ticket, PartyPopper } from 'lucide-react';

export default function HowItWorks() {
    const t = useTranslations('Index.howItWorks');

    const steps = [
        {
            icon: Search,
            emoji: '🔍',
            step: '01',
            title: t('step1_title'),
            description: t('step1_desc'),
            gradient: 'from-primary/10 to-secondary/50',
            color: 'text-primary',
        },
        {
            icon: Ticket,
            emoji: '🎟️',
            step: '02',
            title: t('step2_title'),
            description: t('step2_desc'),
            gradient: 'from-secondary to-primary/5',
            color: 'text-accent',
        },
        {
            icon: PartyPopper,
            emoji: '🎉',
            step: '03',
            title: t('step3_title'),
            description: t('step3_desc'),
            gradient: 'from-primary/8 to-secondary/60',
            color: 'text-primary',
        },
    ];

    return (
        <section className="py-16 md:py-24 relative overflow-hidden">
            <div className="max-w-[1440px] mx-auto px-4 md:px-8">
                {/* Header */}
                <div className="text-center max-w-xl mx-auto mb-10 md:mb-16 space-y-3 md:space-y-4">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary/50 rounded-full text-xs font-bold text-accent/60 uppercase tracking-widest">
                        {t('tag')}
                    </span>
                    <h2 className="text-2xl md:text-4xl font-black text-accent tracking-tight leading-tight">
                        {t('title')}
                    </h2>
                    <p className="text-accent/40 text-sm md:text-base max-w-lg mx-auto">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Steps */}
                <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 lg:gap-8 overflow-x-auto no-scrollbar pb-4 md:pb-0 px-1 md:px-0 snap-x snap-mandatory md:snap-none">
                    {steps.map((step, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: idx * 0.12 }}
                            className={`group relative p-6 md:p-8 rounded-2xl md:rounded-3xl bg-gradient-to-br ${step.gradient} border border-white/80 shadow-sm hover:shadow-lg transition-all duration-300 min-w-[280px] md:min-w-0 snap-center`}
                        >
                            {/* Step number */}
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-3xl md:text-4xl">{step.emoji}</span>
                                <span className="text-4xl md:text-5xl font-black text-accent/[0.06] select-none">
                                    {step.step}
                                </span>
                            </div>

                            <div className="space-y-2 md:space-y-3">
                                <h3 className="text-lg md:text-xl font-black text-accent tracking-tight">
                                    {step.title}
                                </h3>
                                <p className="text-sm text-accent/50 font-medium leading-relaxed">
                                    {step.description}
                                </p>
                            </div>

                            {/* Connector dots (between cards, desktop only) */}
                            {idx < steps.length - 1 && (
                                <div className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/20" />
                                    <span className="w-1 h-1 rounded-full bg-primary/15" />
                                    <span className="w-0.5 h-0.5 rounded-full bg-primary/10" />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

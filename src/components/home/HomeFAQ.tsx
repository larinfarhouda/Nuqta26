'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HomeFAQ() {
    const t = useTranslations('Index.faq');
    const locale = useLocale();
    const isRTL = locale === 'ar';
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const faqs = Array.from({ length: 6 }, (_, i) => ({
        question: t(`q${i + 1}`),
        answer: t(`a${i + 1}`),
    }));

    return (
        <section className="py-16 md:py-24" id="faq" data-speakable>
            {/* Header */}
            <div className="text-center mb-10 md:mb-14">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/50 text-accent/60 text-xs font-bold mb-4 uppercase tracking-widest">
                    <HelpCircle className="w-3.5 h-3.5" />
                    {t('tag')}
                </span>
                <h2 className="text-2xl md:text-4xl font-black text-accent tracking-tight mb-2">
                    {t('title')}
                </h2>
                <p className="text-accent/40 text-sm md:text-base max-w-lg mx-auto">
                    {t('subtitle')}
                </p>
            </div>

            {/* FAQ Items */}
            <div className="max-w-2xl mx-auto space-y-2.5">
                {faqs.map((faq, index) => {
                    const isOpen = openIndex === index;
                    return (
                        <div
                            key={index}
                            className={`rounded-2xl border transition-all duration-300 ${
                                isOpen
                                    ? 'border-primary/20 bg-primary/[0.02] shadow-sm'
                                    : 'border-gray-100 bg-white hover:border-gray-200'
                            }`}
                        >
                            <button
                                onClick={() => setOpenIndex(isOpen ? null : index)}
                                className={`w-full flex items-center justify-between gap-4 px-5 md:px-6 py-4 md:py-5 text-${isRTL ? 'right' : 'left'}`}
                                aria-expanded={isOpen}
                            >
                                <span className={`font-bold text-sm md:text-base transition-colors ${
                                    isOpen ? 'text-primary' : 'text-accent'
                                }`}>
                                    {faq.question}
                                </span>
                                <motion.div
                                    animate={{ rotate: isOpen ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ChevronDown className={`w-5 h-5 shrink-0 ${
                                        isOpen ? 'text-primary' : 'text-gray-300'
                                    }`} />
                                </motion.div>
                            </button>
                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-5 md:px-6 pb-5 flex gap-3">
                                            <div className="w-0.5 bg-primary/20 rounded-full shrink-0 self-stretch" />
                                            <p className="text-accent/50 text-sm md:text-base leading-relaxed font-medium">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {/* FAQ Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'FAQPage',
                        mainEntity: faqs.map(faq => ({
                            '@type': 'Question',
                            name: faq.question,
                            acceptedAnswer: {
                                '@type': 'Answer',
                                text: faq.answer,
                            },
                        })),
                    }),
                }}
            />
        </section>
    );
}

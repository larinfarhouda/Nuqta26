'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

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
            {/* FAQ Header */}
            <div className="text-center mb-12 md:mb-16">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 text-primary text-sm font-bold mb-4 border border-primary/10">
                    <HelpCircle className="w-4 h-4" />
                    {t('tag')}
                </span>
                <h2 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight mb-3">
                    {t('title')}
                </h2>
                <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto">
                    {t('subtitle')}
                </p>
            </div>

            {/* FAQ Items */}
            <div className="max-w-2xl mx-auto space-y-3">
                {faqs.map((faq, index) => {
                    const isOpen = openIndex === index;
                    return (
                        <div
                            key={index}
                            className={`rounded-2xl border transition-all duration-300 ${isOpen
                                    ? 'border-primary/20 bg-primary/[0.02] shadow-sm'
                                    : 'border-gray-100 bg-white hover:border-gray-200'
                                }`}
                        >
                            <button
                                onClick={() => setOpenIndex(isOpen ? null : index)}
                                className={`w-full flex items-center justify-between gap-4 px-5 md:px-6 py-4 md:py-5 text-${isRTL ? 'right' : 'left'}`}
                                aria-expanded={isOpen}
                            >
                                <span className={`font-bold text-sm md:text-base ${isOpen ? 'text-primary' : 'text-gray-900'
                                    }`}>
                                    {faq.question}
                                </span>
                                <ChevronDown
                                    className={`w-5 h-5 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : 'text-gray-400'
                                        }`}
                                />
                            </button>
                            <div
                                className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                            >
                                <p className="px-5 md:px-6 pb-5 text-gray-600 text-sm md:text-base leading-relaxed">
                                    {faq.answer}
                                </p>
                            </div>
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

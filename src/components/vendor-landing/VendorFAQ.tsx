'use client';

import { useTranslations } from 'next-intl';
import { ChevronDown, Check, X } from 'lucide-react';
import { useState } from 'react';

export default function VendorFAQ() {
    const t = useTranslations('VendorLanding.FAQ');
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const faqs = [
        { question: t('q1'), answer: t('a1') },
        { question: t('q2'), answer: t('a2') },
        { question: t('q3'), answer: t('a3') },
        { question: t('q4'), answer: t('a4') },
        { question: t('q5'), answer: t('a5') },
        { question: t('q6'), answer: t('a6') },
        { question: t('q7'), answer: t('a7') },
        { question: t('q8'), answer: t('a8') },
        { question: t('q9'), answer: t('a9') },
        { question: t('q10'), answer: t('a10') },
        { question: t('q11'), answer: t('a11') }
    ];

    const comparisonFeatures = [
        { label: t('comparison_table.feature_confirmations'), manual: t('comparison_table.manual_confirmations'), nuqta: t('comparison_table.nuqta_confirmations') },
        { label: t('comparison_table.feature_payment'), manual: t('comparison_table.manual_payment'), nuqta: t('comparison_table.nuqta_payment') },
        { label: t('comparison_table.feature_attendance'), manual: t('comparison_table.manual_attendance'), nuqta: t('comparison_table.nuqta_attendance') },
        { label: t('comparison_table.feature_reviews'), manual: t('comparison_table.manual_reviews'), nuqta: t('comparison_table.nuqta_reviews') },
        { label: t('comparison_table.feature_time'), manual: t('comparison_table.manual_time'), nuqta: t('comparison_table.nuqta_time') },
        { label: t('comparison_table.feature_language'), manual: t('comparison_table.manual_language'), nuqta: t('comparison_table.nuqta_language') },
        { label: t('comparison_table.feature_discovery'), manual: t('comparison_table.manual_discovery'), nuqta: t('comparison_table.nuqta_discovery') },
        { label: t('comparison_table.feature_cost'), manual: t('comparison_table.manual_cost'), nuqta: t('comparison_table.nuqta_cost') }
    ];

    return (
        <>
            {/* FAQ Schema for SEO */}
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
                                text: faq.answer
                            }
                        }))
                    })
                }}
            />

            <section className="py-16 md:py-20 lg:py-24 bg-gradient-to-b from-white to-gray-50">
                <div className="container mx-auto px-4">
                    {/* Comparison Table */}
                    <div className="max-w-5xl mx-auto mb-16 md:mb-24">
                        <div className="text-center mb-12 md:mb-16">
                            <div className="inline-flex items-center gap-2 px-4 md:px-6 py-1.5 md:py-2 bg-amber-50 text-amber-700 rounded-full text-xs md:text-sm font-black uppercase tracking-widest border border-amber-200 mb-6">
                                <span>مقارنة</span>
                            </div>
                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 mb-4">
                                {t('comparison_table.title')}
                            </h2>
                            <p className="text-base md:text-lg text-gray-600">
                                {t('comparison_table.subtitle')}
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl md:rounded-3xl border-2 border-gray-200 overflow-hidden shadow-xl">
                            {/* Table Header */}
                            <div className="grid grid-cols-3 bg-gray-50 border-b-2 border-gray-200">
                                <div className="p-4 md:p-6 border-e border-gray-200"></div>
                                <div className="p-4 md:p-6 border-e border-gray-200 text-center">
                                    <div className="text-xs md:text-sm font-black uppercase tracking-widest text-gray-500">
                                        {t('comparison_table.manual_title')}
                                    </div>
                                </div>
                                <div className="p-4 md:p-6 text-center bg-primary/5">
                                    <div className="text-xs md:text-sm font-black uppercase tracking-widest text-primary">
                                        {t('comparison_table.nuqta_title')}
                                    </div>
                                </div>
                            </div>

                            {/* Table Rows */}
                            {comparisonFeatures.map((feature, idx) => (
                                <div key={idx} className={`grid grid-cols-3 ${idx !== comparisonFeatures.length - 1 ? 'border-b border-gray-200' : ''}`}>
                                    <div className="p-4 md:p-6 border-e border-gray-200">
                                        <div className="text-sm md:text-base font-bold text-gray-900">
                                            {feature.label}
                                        </div>
                                    </div>
                                    <div className="p-4 md:p-6 border-e border-gray-200 flex items-center">
                                        <div className="flex items-start gap-2">
                                            <X className="w-4 h-4 md:w-5 md:h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs md:text-sm text-gray-600">
                                                {feature.manual}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4 md:p-6 bg-primary/5 flex items-center">
                                        <div className="flex items-start gap-2">
                                            <Check className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0 mt-0.5" />
                                            <span className="text-xs md:text-sm font-bold text-gray-900">
                                                {feature.nuqta}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* FAQ Section */}
                    <div className="max-w-3xl mx-auto">
                        {/* Header */}
                        <div className="text-center mb-12 md:mb-16">
                            <div className="inline-flex items-center gap-2 px-4 md:px-6 py-1.5 md:py-2 bg-primary/10 text-primary rounded-full text-xs md:text-sm font-black uppercase tracking-widest border border-primary/20 mb-6">
                                <span>{t('tag')}</span>
                            </div>
                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 mb-4">
                                {t('title')}
                            </h2>
                            <p className="text-base md:text-lg text-gray-600">
                                {t('subtitle')}
                            </p>
                        </div>

                        {/* FAQ Accordion */}
                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <div
                                    key={index}
                                    className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden transition-all duration-300 hover:border-primary/30"
                                >
                                    <button
                                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                        className="w-full px-6 md:px-8 py-5 md:py-6 flex items-center justify-between text-start transition-colors hover:bg-gray-50"
                                    >
                                        <span className="text-base md:text-lg font-bold text-gray-900 pe-4">
                                            {faq.question}
                                        </span>
                                        <ChevronDown
                                            className={`w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''
                                                }`}
                                        />
                                    </button>
                                    <div
                                        className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96' : 'max-h-0'
                                            }`}
                                    >
                                        <div className="px-6 md:px-8 pb-5 md:pb-6 pt-2">
                                            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <div className="mt-12 text-center">
                            <p className="text-gray-600 mb-4">{t('more_questions')}</p>
                            <a
                                href="https://wa.me/905428751112"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                {t('contact_support')}
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

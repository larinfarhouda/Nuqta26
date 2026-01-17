'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Zap, Star } from 'lucide-react';
import { Link } from '@/navigation';

export default function VendorPricing() {
    const t = useTranslations('VendorLanding.Pricing');

    const tiers = [
        {
            name: t('free_tier'),
            price: "Free",
            period: "",
            desc: t('free_desc'),
            features: t.raw('free_features'),
            highlight: false,
            cta: "Get Started",
            color: "border-gray-100 bg-white"
        },
        {
            name: t('pro_tier'),
            price: "999 TL",
            period: t('pro_period'),
            desc: t('pro_desc'),
            features: t.raw('pro_features'),
            highlight: true,
            cta: "Scale Now",
            color: "border-primary/20 bg-white shadow-2xl shadow-primary/20"
        }
    ];

    return (
        <section id="pricing" className="py-24 md:py-32 bg-[#fffdfa] relative">
            {/* Added ambient glow pieces */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center mb-16 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-6 py-2 bg-secondary text-primary rounded-full text-sm font-black uppercase tracking-widest"
                    >
                        <Zap className="w-4 h-4 fill-primary" />
                        <span>Simple Growth</span>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight"
                    >
                        {t('title')}
                    </motion.h2>
                    <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">
                        {t('subtitle')}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {tiers.map((tier, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className={`p-10 md:p-14 rounded-[3.5rem] border-2 relative flex flex-col items-center text-center group transition-all duration-500 ${tier.color} ${tier.highlight ? 'ring-8 ring-primary/5' : ''}`}
                        >
                            {tier.highlight && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-2 bg-primary text-white rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl">
                                    <Star className="w-4 h-4 fill-secondary text-secondary" />
                                    <span>Most Popular</span>
                                </div>
                            )}

                            <div className="space-y-4 mb-10 w-full">
                                <h3 className="text-2xl font-black text-gray-900 group-hover:text-primary transition-colors">{tier.name}</h3>
                                <div className="flex items-baseline justify-center">
                                    <span className="text-4xl md:text-5xl font-black text-gray-900 leading-none">{tier.price}</span>
                                    <span className="text-gray-400 font-bold ml-1 uppercase text-sm tracking-widest">{tier.period}</span>
                                </div>
                                <p className="text-lg text-gray-500 font-medium">{tier.desc}</p>
                            </div>

                            <div className="w-12 h-1 bg-gray-100 mb-10 group-hover:bg-primary/20 transition-colors" />

                            <ul className="space-y-6 mb-12 w-full">
                                {tier.features.map((feature: string, fIdx: number) => (
                                    <li key={fIdx} className="flex items-center gap-4 text-gray-600 font-bold justify-center">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all duration-500 ${tier.highlight ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-400 group-hover:border-primary/50'}`}>
                                            <Check className="w-4 h-4 stroke-[3]" />
                                        </div>
                                        <span className="text-lg">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href="/register?role=vendor"
                                className={`w-full py-6 rounded-[2rem] font-black text-lg transition-all shadow-xl flex items-center justify-center gap-3 group/btn hover:scale-[1.03] active:scale-95 ${tier.highlight ? 'bg-primary text-white shadow-primary/30 hover:shadow-primary/50' : 'bg-gray-900 text-white shadow-gray-900/10 hover:shadow-gray-900/30'}`}
                            >
                                {tier.cta}
                                <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform rtl:rotate-180 rtl:group-hover/btn:-translate-x-2" />
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <p className="text-center mt-12 text-gray-400 font-bold text-sm uppercase tracking-[0.2em] animate-pulse">
                    No credit card required for free tier
                </p>
            </div>
        </section>
    );
}

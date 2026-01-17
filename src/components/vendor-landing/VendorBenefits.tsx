'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Target, ShieldCheck, BarChart3, Users2, Zap, Palette, MapPin, Globe } from 'lucide-react';

export default function VendorBenefits() {
    const t = useTranslations('VendorLanding.WhyNuqta');

    const benefits = [
        {
            icon: <Target className="w-8 h-8" />,
            title: t('reason1_title'),
            desc: t('reason1_desc'),
            color: "text-rose-500 bg-rose-50"
        },
        {
            icon: <ShieldCheck className="w-8 h-8" />,
            title: t('reason2_title'),
            desc: t('reason2_desc'),
            color: "text-emerald-500 bg-emerald-50"
        },
        {
            icon: <BarChart3 className="w-8 h-8" />,
            title: t('reason3_title'),
            desc: t('reason3_desc'),
            color: "text-amber-500 bg-amber-50"
        }
    ];

    const extraPerks = [
        { icon: <Zap />, label: "Express setup" },
        { icon: <Users2 />, label: "Community focus" },
        { icon: <Palette />, label: "Brand customization" },
        { icon: <Globe />, label: "Multi-language" }
    ];

    return (
        <section className="py-24 md:py-32 bg-white relative overflow-hidden">
            {/* Added warm decorative shapes */}
            <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px] -ml-24 -mb-24" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center mb-20 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-6 py-2 bg-primary/10 text-primary rounded-full text-sm font-black uppercase tracking-widest border border-primary/20"
                    >
                        <span>The Nuqta Advantage</span>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight"
                    >
                        {t('title')}
                    </motion.h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
                    {benefits.map((benefit, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="group p-10 rounded-[3.5rem] bg-[#fffcf9] border border-secondary/20 hover:border-primary transition-all duration-500 hover:shadow-[0_50px_100px_-20px_rgba(45,116,116,0.15)] relative overflow-hidden h-full flex flex-col items-center text-center"
                        >
                            <div className={`p-6 rounded-[2rem] ${benefit.color} mb-8 shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                                {benefit.icon}
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">{benefit.title}</h3>
                            <p className="text-lg text-gray-500 font-medium leading-relaxed">{benefit.desc}</p>

                            {/* Decorative line */}
                            <div className="w-12 h-2 bg-secondary/50 rounded-full mt-auto pt-10" />
                        </motion.div>
                    ))}
                </div>

                {/* Integration/Trust Row */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-20 pt-16 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-8"
                >
                    {extraPerks.map((perk, i) => (
                        <div key={i} className="flex flex-col items-center gap-3 group">
                            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary/5 group-hover:text-primary transition-all duration-500 border border-transparent group-hover:border-primary/20 group-hover:shadow-lg group-hover:shadow-primary/5">
                                {perk.icon}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-primary transition-colors">{perk.label}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

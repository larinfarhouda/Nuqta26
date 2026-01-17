'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';

export default function VendorTestimonials() {
    const t = useTranslations('VendorLanding.Testimonials');

    const testimonials = [
        {
            quote: t('t1_quote'),
            author: t('t1_author'),
            role: t('t1_role'),
            avatar: "https://i.pravatar.cc/150?u=sarah"
        },
        {
            quote: t('t2_quote'),
            author: t('t2_author'),
            role: t('t2_role'),
            avatar: "https://i.pravatar.cc/150?u=ahmed"
        }
    ];

    return (
        <section className="py-24 md:py-32 bg-[#fffcf9] relative overflow-hidden">
            {/* Ambient background decoration */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-secondary/50 to-transparent" />
            <div className="absolute top-40 -left-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-40 -right-20 w-80 h-80 bg-secondary/10 rounded-full blur-[100px]" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center mb-20 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-6 py-2 bg-white rounded-full text-secondary-dark text-amber-600 font-black uppercase tracking-widest text-sm shadow-xl shadow-amber-600/5 border border-amber-100"
                    >
                        <Star className="w-4 h-4 fill-amber-600" />
                        <span>Community Voice</span>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight"
                    >
                        {t('title')}
                    </motion.h2>
                </div>

                <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
                    {testimonials.map((test, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white p-10 md:p-14 rounded-[4rem] border border-gray-100 shadow-2xl shadow-gray-200/50 relative group"
                        >
                            <div className="absolute top-10 right-10 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500">
                                <Quote className="w-20 h-20 text-primary" />
                            </div>

                            <div className="space-y-8 relative z-10">
                                <p className="text-lg md:text-xl font-bold text-gray-800 leading-relaxed italic">
                                    "{test.quote}"
                                </p>

                                <div className="flex items-center gap-5 pt-4">
                                    <div className="w-16 h-16 rounded-3xl overflow-hidden border-4 border-secondary/20 shadow-lg shadow-secondary/10">
                                        <img src={test.avatar} alt={test.author} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black text-gray-900">{test.author}</h4>
                                        <p className="text-sm font-bold text-primary uppercase tracking-widest">{test.role}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-20 text-center">
                    <p className="text-lg font-black text-gray-400 flex items-center justify-center gap-4">
                        Loved by
                        <span className="px-5 py-2 bg-secondary/20 text-primary rounded-2xl border border-secondary/30 scale-110">Organizers</span>
                        all over Istanbul
                    </p>
                </div>
            </div>
        </section>
    );
}

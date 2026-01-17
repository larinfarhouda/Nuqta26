'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, TrendingUp, Users, Calendar, CheckCircle2, Zap, Heart } from 'lucide-react';
import { Link } from '@/navigation';
import Image from 'next/image';

export default function VendorHero() {
    const t = useTranslations('VendorLanding.Hero');

    return (
        <div className="relative overflow-hidden bg-[#fffcf9] pt-24 md:pt-32 pb-16 md:pb-24">
            {/* Rich Ambient Background Elements */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute -top-[10%] -right-[5%] w-[50%] aspect-square bg-primary/10 rounded-full blur-[120px] opacity-60" />
                <div className="absolute top-[20%] -left-[10%] w-[40%] aspect-square bg-secondary/30 rounded-full blur-[100px] opacity-40 animate-pulse" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-[0.05]" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-20">

                        {/* Content Section */}
                        <div className="flex-1 text-center lg:text-start space-y-6 md:space-y-10">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 px-5 py-2 bg-secondary/40 backdrop-blur-md text-primary rounded-full text-xs md:text-sm font-black border border-secondary/40 shadow-xl shadow-secondary/10"
                            >
                                <Heart className="w-4 h-4 fill-primary" />
                                <span>Join Istanbul's Warmest Hub</span>
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.05] tracking-tight"
                            >
                                {t('title')}
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-lg md:text-xl text-gray-600 font-medium leading-relaxed max-w-xl mx-auto lg:ms-0 lg:me-auto"
                            >
                                {t('subtitle')}
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6"
                            >
                                <Link
                                    href="/register?role=vendor"
                                    className="w-full sm:w-auto px-10 py-5 bg-primary text-white font-black rounded-[2rem] transition-all shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.05] active:scale-95 flex items-center justify-center gap-3 group"
                                >
                                    <span className="text-xl">{t('cta')}</span>
                                    <ArrowRight className="w-6 h-6 rtl:rotate-180 group-hover:translate-x-2 transition-transform rtl:group-hover:-translate-x-2" />
                                </Link>
                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden shadow-sm">
                                                <img src={`https://i.pravatar.cc/100?u=v${i}`} alt="Vendor" />
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-gray-400 text-sm font-bold uppercase tracking-widest">300+ Trusted Partners</span>
                                </div>
                            </motion.div>

                            {/* Trust Perks */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-3 pt-4 border-t border-gray-100"
                            >
                                {['Targeted Audience', 'No Setup Fee', 'Live Analytics'].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 text-gray-500 text-sm md:text-base font-bold">
                                        <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </motion.div>
                        </div>

                        {/* Interactive UI Display */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="flex-1 relative"
                        >
                            <div className="relative mx-auto max-w-[500px] lg:max-w-none">
                                <div className="bg-white rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-secondary/10 overflow-hidden relative group">
                                    {/* Mock App Header */}
                                    <div className="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                                        <div className="flex gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-400" />
                                            <div className="w-3 h-3 rounded-full bg-amber-400" />
                                            <div className="w-3 h-3 rounded-full bg-emerald-400" />
                                        </div>
                                        <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Vendor Dashboard</div>
                                    </div>

                                    {/* Mock Content */}
                                    <div className="p-10 space-y-10">
                                        {/* Stats Row */}
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="bg-secondary/10 rounded-[2rem] p-6 flex flex-col gap-2 border border-secondary/20 hover:bg-secondary/20 transition-colors">
                                                <TrendingUp className="w-6 h-6 text-primary" />
                                                <span className="text-3xl font-black text-gray-900">+127%</span>
                                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest leading-none">Monthly Growth</span>
                                            </div>
                                            <div className="bg-primary/5 rounded-[2rem] p-6 flex flex-col gap-2 border border-primary/10 hover:bg-primary/10 transition-colors">
                                                <Users className="w-6 h-6 text-primary" />
                                                <span className="text-3xl font-black text-gray-900">1.2k</span>
                                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest leading-none">Direct Inquiries</span>
                                            </div>
                                        </div>

                                        {/* Chart Area */}
                                        <div className="space-y-5">
                                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                Performance Trend
                                            </h4>
                                            <div className="flex justify-between items-end h-40 gap-2 px-1">
                                                {[30, 50, 45, 80, 60, 40, 95, 70, 85, 90].map((h, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${h}%` }}
                                                        transition={{ delay: 0.6 + (i * 0.05), type: "spring", stiffness: 100 }}
                                                        className={`flex-1 rounded-t-2xl shadow-lg transition-all ${i === 8 ? 'bg-primary' : 'bg-primary/10'}`}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex justify-between text-[10px] font-black text-gray-300 px-1 uppercase tracking-tighter">
                                                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span className="text-primary">Today</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Badges - Absolute Positioning */}
                                <motion.div
                                    animate={{ y: [0, -15, 0], rotate: [2, -2, 2] }}
                                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute -top-10 -right-6 hidden sm:flex bg-white p-5 rounded-[2.5rem] shadow-2xl border border-gray-100 gap-4 items-center z-20"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/20">
                                        <Zap className="w-8 h-8 fill-white" />
                                    </div>
                                    <div className="pr-6">
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Verified</p>
                                        <p className="text-xl font-black text-gray-900">Premium Account</p>
                                    </div>
                                </motion.div>

                                <motion.div
                                    animate={{ y: [0, 15, 0], rotate: [-2, 2, -2] }}
                                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                    className="absolute -bottom-10 -left-10 hidden lg:flex bg-white p-6 rounded-[3rem] shadow-2xl border border-gray-100 gap-5 items-center z-20"
                                >
                                    <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center shadow-xl shadow-secondary/20">
                                        <Calendar className="w-8 h-8 text-primary" />
                                    </div>
                                    <div className="pr-8">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Sales</p>
                                        <p className="text-3xl font-black text-gray-900">2.4k Tickets</p>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </div>
        </div>
    );
}

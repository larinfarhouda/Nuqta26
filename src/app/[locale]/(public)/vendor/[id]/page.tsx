import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { BadgeCheck, MessageCircle, Star, MapPin, Share2, Heart, ArrowLeft, ShieldCheck, Calendar, Info, Sparkles, TrendingUp } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/navigation';
import Image from 'next/image';
import BackgroundShapes from '@/components/home/BackgroundShapes';

export default async function VendorProfilePage({
    params
}: {
    params: Promise<{ id: string; locale: string }>;
}) {
    const { id, locale } = await params;
    const supabase = await createClient();
    const t = await getTranslations('VendorProfile');

    const { data: vendor } = await supabase
        .from('vendors')
        .select('*, profiles(*)')
        .eq('id', id)
        .single();

    if (!vendor) {
        return notFound();
    }

    // Fetch vendor's events
    const { data: events } = await supabase
        .from('events')
        .select('*, category:categories(*)')
        .eq('vendor_id', id)
        .eq('status', 'published')
        .order('date', { ascending: true });

    const whatsappLink = vendor.whatsapp_number ? `https://wa.me/${vendor.whatsapp_number}` : '#';

    return (
        <div className="min-h-screen bg-transparent pb-32 relative selection:bg-primary selection:text-white">
            <BackgroundShapes />

            {/* 1. Header Navigation - Ambient Glass */}
            <div className="sticky top-0 z-50 bg-white/40 backdrop-blur-2xl border-b border-white/20 px-4 md:px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="p-2 -ml-2 hover:bg-white/50 rounded-full transition-colors flex items-center gap-2 text-sm font-black text-gray-900 group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
                        <span className="hidden sm:inline uppercase tracking-widest text-[10px]">{t('back_to_discovery')}</span>
                    </Link>
                    <div className="flex items-center gap-1">
                        <button className="p-2.5 hover:bg-white/50 rounded-full transition-colors text-gray-900">
                            <Share2 className="w-5 h-5" />
                        </button>
                        <button className="p-2.5 hover:bg-white/50 rounded-full transition-colors text-gray-900">
                            <Heart className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Brand Hero Section - Vibrant Ambient Mesh */}
            <div className="relative h-[250px] md:h-[450px] bg-gray-900 overflow-hidden">
                <Image
                    src={vendor.company_logo || '/images/hero_community.png'}
                    alt="Cover"
                    fill
                    className="object-cover opacity-40 blur-3xl scale-125"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-primary/10 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center p-6">
                    <div className="relative group">
                        {/* Glowing Orb behind logo */}
                        <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full scale-110 group-hover:scale-125 transition-transform duration-1000" />

                        <div className="relative w-28 h-28 md:w-48 md:h-48 bg-white rounded-[2.5rem] md:rounded-[4rem] p-1.5 shadow-2xl border border-white/50">
                            <Image
                                src={vendor.company_logo || '/images/logo_nav.png'}
                                alt={vendor.business_name}
                                fill
                                className="object-cover rounded-[2.2rem] md:rounded-[3.6rem]"
                            />
                            {vendor.is_verified && (
                                <div className="absolute -right-2 -bottom-2 md:-right-4 md:-bottom-4 bg-primary text-white p-2 md:p-3 rounded-2xl md:rounded-3xl border-4 border-white shadow-2xl animate-bounce-slow">
                                    <BadgeCheck className="w-5 h-5 md:w-8 md:h-8" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Identity Card - Premium Glassmorphism */}
            <div className="max-w-4xl mx-auto px-4 md:px-6 -mt-12 md:-mt-20 relative z-10 space-y-8 md:space-y-16">
                <div className="bg-white/60 backdrop-blur-3xl p-8 md:p-16 rounded-[3rem] md:rounded-[5rem] shadow-3xl shadow-primary/5 border border-white/80 text-center relative overflow-hidden">
                    {/* Decorative Corner Backgrounds */}
                    <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-br-full" />
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-secondary/5 rounded-tl-full" />

                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight mb-4 relative z-10">
                        {vendor.business_name.split(' ').map((word: string, i: number) => (
                            i === 0 ? <span key={i} className="text-primary italic font-serif"> {word} </span> : word + ' '
                        ))}
                    </h1>

                    <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10 pt-4 relative z-10">
                        <div className="flex items-center gap-2.5 text-[10px] md:text-sm font-black text-gray-500 uppercase tracking-widest bg-white/50 px-4 py-2 rounded-full border border-white">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span>{t('istanbul_hub')}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-[10px] md:text-sm font-black text-gray-500 uppercase tracking-widest bg-white/50 px-4 py-2 rounded-full border border-white">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="text-gray-900">{t('elite_rating')}</span>
                        </div>
                    </div>

                    <div className="pt-10 md:pt-16 flex flex-col sm:flex-row justify-center gap-4 relative z-10">
                        <a
                            href={whatsappLink}
                            target="_blank"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-5 md:px-12 md:py-6 bg-gray-900 text-white font-black rounded-2xl md:rounded-[2.5rem] hover:bg-primary transition-all shadow-2xl shadow-primary/20 active:scale-95 text-xs uppercase tracking-widest"
                        >
                            <MessageCircle className="w-5 h-5 text-primary" />
                            <span>{t('inquire_whatsapp')}</span>
                        </a>
                        <button className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-5 md:px-12 md:py-6 bg-white border-2 border-primary/10 text-gray-900 font-black rounded-2xl md:rounded-[2.5rem] hover:bg-primary/5 transition-all shadow-xl shadow-gray-200/50 active:scale-95 text-xs uppercase tracking-widest">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <span>{t('view_gallery')}</span>
                        </button>
                    </div>
                </div>

                {/* 4. Content Sections - High Depth */}
                <div className="space-y-16 md:space-y-24">
                    {/* About Section - Serif Accent */}
                    <div className="space-y-8 px-4">
                        <div className="flex items-center gap-6">
                            <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">{t('our_mission')}</h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                        </div>
                        <div className="prose prose-sm md:prose-xl text-gray-600 font-medium leading-[2] max-w-none">
                            {vendor.description_ar || t('mission_default')}
                        </div>
                    </div>

                    {/* Stats Grid - Colorful Icons */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                        {[
                            { label: t('stats.elite_partner'), icon: <ShieldCheck className="text-emerald-500" />, desc: t('stats.vetted_quality'), color: 'from-emerald-500/10' },
                            { label: t('stats.community_trust'), icon: <Heart className="text-rose-500" />, desc: t('stats.top_reviews'), color: 'from-rose-500/10' },
                            { label: t('stats.high_intent'), icon: <TrendingUp className="text-blue-500" />, desc: t('stats.instant_support'), color: 'from-blue-500/10' }
                        ].map((item, i) => (
                            <div key={i} className={`p-8 md:p-10 bg-gradient-to-br ${item.color} to-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-xl transition-transform hover:-translate-y-2`}>
                                <div className="p-4 bg-white w-fit rounded-2xl shadow-xl border border-gray-100 mb-6">{item.icon}</div>
                                <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-2">{item.label}</h4>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Discovery Catalog - Cinematic Grid */}
                    {events && events.length > 0 && (
                        <div className="space-y-12 md:space-y-16 pt-12 relative">
                            {/* Decorative Ambient Glow */}
                            <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 blur-[100px] rounded-full" />

                            <div className="flex items-center justify-between relative z-10">
                                <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                    <Sparkles className="w-6 h-6 text-primary" />
                                    {t('active_catalog')}
                                </h2>
                                <span className="px-4 py-2 bg-white/50 backdrop-blur-xl rounded-full text-[10px] md:text-xs font-black text-primary uppercase tracking-[0.2em] border border-white shadow-sm cursor-pointer hover:bg-primary hover:text-white transition-all">{t('explore_all')}</span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12 relative z-10">
                                {events.map((event) => (
                                    <Link
                                        key={event.id}
                                        href={`/events/${event.id}`}
                                        className="group space-y-4"
                                    >
                                        <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-white shadow-2xl shadow-primary/5 border border-white/50 transition-all duration-700">
                                            <Image
                                                src={event.image_url || '/images/hero_community.png'}
                                                alt={event.title}
                                                fill
                                                className="object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                                            <div className="absolute bottom-6 left-6 right-6 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                                                <div className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest w-fit shadow-xl">{t('book_experience')}</div>
                                            </div>
                                        </div>
                                        <div className="px-2 text-left">
                                            <h3 className="text-base md:text-xl font-black text-gray-900 line-clamp-1 group-hover:text-primary transition-colors tracking-tight">{event.title}</h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">{new Date(event.date).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky Mobile Contact - Minimal Dark Glass */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-gray-900/90 backdrop-blur-2xl border-t border-white/10 p-4">
                <a
                    href={whatsappLink}
                    className="w-full flex items-center justify-center gap-3 py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/40 active:scale-95 transition-all"
                >
                    <MessageCircle className="w-5 h-5" />
                    <span>{t('inquire_profile')}</span>
                </a>
            </div>
        </div>
    );
}

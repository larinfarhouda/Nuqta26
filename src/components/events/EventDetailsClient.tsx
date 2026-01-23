'use client';

import { useRef, useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { Link, useRouter } from '@/navigation';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Share2, Clock, ShieldCheck, Heart, ArrowLeft, MessageCircle, Star, Sparkles, XCircle, AlertCircle } from 'lucide-react';
import EventBookingForm from '@/components/events/EventBookingForm';
import MobileBookingBar from '@/components/events/MobileBookingBar';
import BackgroundShapes from '@/components/home/BackgroundShapes';
import { Suspense } from 'react';
import { getEventStatus } from '@/utils/eventStatus';
import ReviewStats from '@/components/reviews/ReviewStats';
import ReviewForm from '@/components/reviews/ReviewForm';
import ReviewList from '@/components/reviews/ReviewList';
import { getEventRatingSummary, checkCanReviewEvent, getUserReviewForEvent } from '@/actions/public/reviews';

type EventDetailsClientProps = {
    event: any;
    user: any;
};

export default function EventDetailsClient({ event, user }: EventDetailsClientProps) {
    const t = useTranslations('Events');
    const tReviews = useTranslations('Reviews');
    const locale = useLocale();
    const router = useRouter();
    const bookingRef = useRef<HTMLDivElement>(null);

    // Review state
    const [reviewStats, setReviewStats] = useState<any>(null);
    const [canReview, setCanReview] = useState(false);
    const [reviewReason, setReviewReason] = useState('');
    const [userReview, setUserReview] = useState<any>(null);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [editingReview, setEditingReview] = useState(false);

    const scrollToBooking = () => {
        bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const minPrice = event.tickets && event.tickets.length > 0
        ? Math.min(...event.tickets.map((t: any) => t.price))
        : event.price;

    // Calculate event status
    const eventStatus = getEventStatus(event);
    const isExpired = eventStatus === 'expired';
    const isSoldOut = eventStatus === 'sold_out';
    const isBookable = eventStatus === 'active';

    // Fetch review data on component mount
    useEffect(() => {
        async function fetchReviewData() {
            // Get rating summary
            const summaryResult = await getEventRatingSummary(event.id);
            if (summaryResult.success) {
                setReviewStats(summaryResult.data);
            }

            // Check if user can review (only if logged in)
            if (user) {
                const canReviewResult = await checkCanReviewEvent(event.id);
                setCanReview(canReviewResult.canReview);
                setReviewReason(canReviewResult.reason || '');

                // Get user's existing review if they have one
                if (canReviewResult.reason === 'already_reviewed') {
                    const userReviewResult = await getUserReviewForEvent(event.id);
                    if (userReviewResult.success && userReviewResult.data) {
                        setUserReview(userReviewResult.data);
                    }
                }
            }
        }

        fetchReviewData();
    }, [event.id, user]);

    return (
        <div className="min-h-screen bg-transparent pb-32 md:pb-24 selection:bg-primary selection:text-white relative">
            <BackgroundShapes />

            {/* 1. Header Navigation - Ambient Glass - Positioned below main Navbar */}
            <div className="sticky top-24 z-40 bg-white/60 backdrop-blur-2xl border-b border-white/20 px-4 md:px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="p-2 -ml-2 hover:bg-white/50 rounded-full transition-colors flex items-center gap-2 text-sm font-black text-gray-900 group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
                        <span className="hidden sm:inline uppercase tracking-widest text-[10px]">{t('back_to_discovery')}</span>
                    </Link>
                    <div className="flex items-center gap-1 md:gap-3">
                        <button
                            onClick={() => {
                                if (navigator.share) {
                                    navigator.share({
                                        title: event.title,
                                        url: window.location.href,
                                    });
                                } else {
                                    navigator.clipboard.writeText(window.location.href);
                                    alert(t('link_copied'));
                                }
                            }}
                            className="p-2.5 hover:bg-white/50 rounded-full transition-colors text-gray-900"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                        <button
                            className="p-2.5 hover:bg-white/50 rounded-full transition-colors text-gray-900"
                            onClick={() => {
                                if (!user) {
                                    router.push('/login');
                                } else {
                                    alert(t('added_favorites'));
                                }
                            }}
                        >
                            <Heart className={`w-5 h-5 ${user ? 'text-primary' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Event Status Banner */}
            {(isExpired || isSoldOut) && (
                <div className={`mx-4 md:mx-6 max-w-7xl lg:mx-auto mt-4 p-4 md:p-5 rounded-2xl flex items-center gap-4 ${isExpired ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
                    <div className={`p-3 rounded-xl ${isExpired ? 'bg-red-100' : 'bg-amber-100'}`}>
                        {isExpired ? (
                            <XCircle className="w-6 h-6 text-red-600" />
                        ) : (
                            <AlertCircle className="w-6 h-6 text-amber-600" />
                        )}
                    </div>
                    <div>
                        <p className={`font-black text-sm uppercase tracking-wide ${isExpired ? 'text-red-700' : 'text-amber-700'}`}>
                            {isExpired ? t('status_expired') : t('status_sold_out')}
                        </p>
                        <p className={`text-xs font-bold ${isExpired ? 'text-red-600' : 'text-amber-600'}`}>
                            {isExpired ? t('expired_message') : t('sold_out_message')}
                        </p>
                    </div>
                </div>
            )}

            {/* 2. Photo Gallery Layout - Floating Cinematic Frame */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-6 md:pt-32 md:pb-10 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 h-auto md:h-[550px] rounded-[2rem] md:rounded-[3rem] overflow-hidden relative shadow-2xl shadow-primary/5 border border-white/50"
                >
                    <div className="md:col-span-2 relative aspect-[4/3] md:aspect-auto h-full group bg-gray-50/50">
                        <Image
                            src={event.image_url || '/images/hero_community.png'}
                            alt={event.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                    {/* Desktop-only secondary images */}
                    <div className="hidden md:grid grid-cols-1 grid-rows-2 gap-4 col-span-2">
                        <div className="relative h-full overflow-hidden group">
                            <Image
                                src={event.image_url || '/images/hero_community.png'}
                                alt={event.title}
                                fill
                                className="object-cover transition-transform duration-1000 group-hover:scale-110"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative h-full overflow-hidden group">
                                <Image
                                    src={event.image_url || '/images/hero_community.png'}
                                    alt={event.title}
                                    fill
                                    className="object-cover transition-transform duration-1000 group-hover:scale-110 brightness-90"
                                />
                            </div>
                            <div className="relative h-full bg-gray-900/95 flex flex-col items-center justify-center text-white cursor-pointer group hover:bg-primary transition-colors">
                                <Sparkles className="w-6 h-6 mb-2 text-primary group-hover:text-white" />
                                <span className="font-black text-xs uppercase tracking-widest">{t('details_count', { count: 12 })}</span>
                            </div>
                        </div>
                    </div>
                    {/* Mobile counter overlay */}
                    <div className="absolute bottom-4 right-4 md:hidden bg-white/20 backdrop-blur-xl text-white text-[10px] font-black px-4 py-2 rounded-full tracking-widest border border-white/30 shadow-xl">
                        <span dir="ltr">1 / 12</span>
                    </div>
                </motion.div>
            </div>

            {/* 3. Main Content Wrapper */}
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-8 md:gap-16 mt-6 md:mt-10 relative z-10">

                {/* Left Column: Details */}
                <div className="md:col-span-8 space-y-8 md:space-y-10">

                    {/* Header Info - Elevated Glass */}
                    <div className="space-y-4 md:space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="px-4 py-1.5 bg-primary/10 backdrop-blur-md text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/20 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                {event.category_name_en || t('default_category')}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                <span>{t('verified_community')}</span>
                            </div>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-[1.1] tracking-tight">
                            {event.title}
                        </h1>

                        <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-4 md:p-6 rounded-[2rem] shadow-xl shadow-primary/5 flex flex-col sm:flex-row sm:items-center gap-6 md:gap-12">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-gray-200/50 border border-gray-100">
                                    <Calendar className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{t('when')}</span>
                                    <span className="text-sm font-black text-gray-900 capitalize">{new Date(event.date).toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-gray-200/50 border border-gray-100">
                                    <MapPin className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{t('where')}</span>
                                    <span className="text-sm font-black text-gray-900 underline underline-offset-4 decoration-primary/30">
                                        {event.district && event.city ? `${event.district}, ${event.city}` : (event.location_name || t('default_location'))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Vendor Profile - Colorful Gradient Frame */}
                    <div className="relative group overflow-hidden bg-gradient-to-br from-primary/5 via-white/40 to-secondary/5 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border border-white/60 shadow-2xl shadow-primary/5 transition-all hover:shadow-primary/10">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Image src="/images/logo_nav.png" alt="Nuqta" width={100} height={100} className="object-contain" />
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                            <Link href={event.vendors?.slug ? `/v/${event.vendors.slug}` : `/vendor/${event.vendor_id}`} className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left text-gray-900 group/vendor cursor-pointer">
                                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl bg-white transition-transform group-hover/vendor:scale-105">
                                    <Image
                                        src={event.vendors?.company_logo || '/images/logo_nav.png'}
                                        alt="Vendor"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">{t('elite_organizer')}</p>
                                    <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-2 group-hover/vendor:text-primary transition-colors">{event.vendors?.business_name || t('default_partner')}</h3>
                                    <div className="flex items-center justify-center sm:justify-start gap-4">
                                        <div className="flex items-center gap-1.5 text-amber-500">
                                            <Star className="w-4 h-4 fill-current" />
                                            <span className="text-sm font-black text-gray-900">4.98</span>
                                        </div>
                                        <div className="w-1 h-1 rounded-full bg-gray-300" />
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            {t('super_partner')}
                                        </span>
                                    </div>
                                </div>
                            </Link>

                            {event.vendors?.whatsapp_number && (
                                <a
                                    href={`https://wa.me/${event.vendors.whatsapp_number}`}
                                    target="_blank"
                                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black shadow-2xl shadow-gray-900/20 hover:bg-primary transition-all active:scale-95 text-xs uppercase tracking-widest"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    <span>{t('personal_host')}</span>
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Description - Sharp Typography */}
                    <div className="space-y-6 px-2">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">{t('the_experience')}</h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent" />
                        </div>
                        <div className="prose prose-sm md:prose-base text-gray-600 leading-[1.8] font-medium max-w-none whitespace-pre-line selection:bg-primary/20">
                            {event.description || t('default_description')}
                        </div>
                    </div>

                    {/* Map Preview - Colorful Inset */}
                    {event.location_lat && (
                        <div className="space-y-6 pt-4">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">{t('location_context')}</h2>
                                <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent" />
                            </div>
                            <div className="relative h-[350px] md:h-[450px] w-full rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl shadow-primary/5 group">
                                <Image
                                    src={`https://maps.googleapis.com/maps/api/staticmap?center=${event.location_lat},${event.location_long}&zoom=15&size=800x400&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&markers=color:0xF26522%7C${event.location_lat},${event.location_long}&style=feature:all|element:all|saturation:-20|lightness:10`}
                                    alt="Map"
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-1000"
                                />
                                <div className="absolute inset-0 bg-primary/10 mix-blend-overlay pointer-events-none" />
                                <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 bg-gradient-to-t from-black/60 to-transparent flex justify-center">
                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${event.location_lat},${event.location_long}`}
                                        target="_blank"
                                        className="inline-flex items-center gap-3 px-8 py-4 bg-white text-gray-900 rounded-2xl font-black shadow-2xl hover:bg-black hover:text-white transition-all transform hover:-translate-y-1 text-xs uppercase tracking-widest"
                                    >
                                        <MapPin className="w-4 h-4 text-primary" />
                                        <span>{t('show_direct_route')}</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reviews Section */}
                    <div className="space-y-8 pt-8">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">{tReviews('title')}</h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent" />
                        </div>

                        {/* Review Stats */}
                        {reviewStats && reviewStats.review_count > 0 && (
                            <ReviewStats
                                averageRating={Number(reviewStats.average_rating) || 0}
                                reviewCount={Number(reviewStats.review_count) || 0}
                                ratingDistribution={{
                                    rating_1_count: Number(reviewStats.rating_1_count) || 0,
                                    rating_2_count: Number(reviewStats.rating_2_count) || 0,
                                    rating_3_count: Number(reviewStats.rating_3_count) || 0,
                                    rating_4_count: Number(reviewStats.rating_4_count) || 0,
                                    rating_5_count: Number(reviewStats.rating_5_count) || 0
                                }}
                            />
                        )}

                        {/* Review Form - Show if user can review OR if editing */}
                        {user && (canReview || userReview) && (
                            <div>
                                {editingReview || (canReview && showReviewForm) ? (
                                    <ReviewForm
                                        eventId={event.id}
                                        existingReview={editingReview ? userReview : undefined}
                                        onSuccess={() => {
                                            setShowReviewForm(false);
                                            setEditingReview(false);
                                            router.refresh();
                                        }}
                                        onCancel={() => {
                                            setShowReviewForm(false);
                                            setEditingReview(false);
                                        }}
                                    />
                                ) : userReview ? (
                                    <div className="bg-gradient-to-br from-emerald-50 to-white/40 backdrop-blur-xl border border-emerald-200 p-6 rounded-2xl shadow-lg">
                                        <p className="text-sm font-black text-emerald-700 mb-3">
                                            {tReviews('you_reviewed')}
                                        </p>
                                        <button
                                            onClick={() => setEditingReview(true)}
                                            className="text-sm font-bold text-primary hover:underline"
                                        >
                                            {tReviews('edit_review')}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowReviewForm(true)}
                                        className="w-full px-6 py-4 bg-white/40 backdrop-blur-xl border-2 border-primary/30 hover:border-primary text-primary rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary/5 transition-all shadow-lg"
                                    >
                                        {tReviews('write_review')}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Show message if user cannot review */}
                        {user && !canReview && !userReview && reviewReason && (
                            <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl">
                                <p className="text-sm font-bold text-gray-600">
                                    {reviewReason === 'not_attended' && tReviews('must_attend')}
                                    {reviewReason === 'event_not_passed' && tReviews('event_not_ended')}
                                </p>
                            </div>
                        )}

                        {/* Review List */}
                        <ReviewList
                            eventId={event.id}
                            currentUserId={user?.id}
                            onEditReview={(reviewId) => {
                                if (userReview?.id === reviewId) {
                                    setEditingReview(true);
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Right Column: Booking Widget - Glowing Card */}
                <div className="md:col-span-4 relative pb-20 md:pb-0" ref={bookingRef}>
                    <div className="sticky top-28">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white/40 backdrop-blur-3xl p-1 rounded-[2.5rem] border border-white/60 shadow-2xl shadow-primary/10 overflow-hidden relative"
                        >
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
                            <div className="relative z-10">
                                <Suspense fallback={<div className="h-[450px] bg-white/50 animate-pulse rounded-[2.5rem]" />}>
                                    <EventBookingForm event={event} tickets={event.tickets || []} />
                                </Suspense>
                            </div>
                        </motion.div>

                        {/* Support Info - Elevated Glass */}
                        <div className="mt-6 p-6 md:p-8 bg-black/5 backdrop-blur-xl rounded-[2.5rem] space-y-5 border border-white/20 shadow-xl shadow-gray-200/50">
                            <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                                {t('why_book_title')}
                            </h4>
                            <ul className="space-y-4">
                                <li className="flex gap-4 items-start">
                                    <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                                        <Sparkles className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-gray-900 mb-0.5 uppercase tracking-wide">{t('benefit_1_title')}</p>
                                        <p className="text-[10px] text-gray-500 font-bold leading-relaxed">{t('benefit_1_desc')}</p>
                                    </div>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                                        <Clock className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-gray-900 mb-0.5 uppercase tracking-wide">{t('benefit_2_title')}</p>
                                        <p className="text-[10px] text-gray-500 font-bold leading-relaxed">{t('benefit_2_desc')}</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

            </div>

            {/* Mobile Booking Bar - Minimal Dark Mode */}
            <MobileBookingBar
                price={minPrice}
                onReserve={scrollToBooking}
            />
        </div>
    );
}

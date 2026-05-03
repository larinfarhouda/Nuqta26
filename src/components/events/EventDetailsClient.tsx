'use client';

import { useRef, useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { Link, useRouter } from '@/navigation';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Calendar, MapPin, Share2, Clock, ShieldCheck, Heart,
    MessageCircle, Star, Sparkles, XCircle, AlertCircle, ChevronDown,
    ExternalLink
} from 'lucide-react';
import EventBookingForm from '@/components/events/EventBookingForm';
import InterestWidget from '@/components/events/InterestWidget';
import MobileBookingBar from '@/components/events/MobileBookingBar';
import { Suspense } from 'react';
import { getEventStatus } from '@/utils/eventStatus';
import ReviewStats from '@/components/reviews/ReviewStats';
import ReviewForm from '@/components/reviews/ReviewForm';
import ReviewList from '@/components/reviews/ReviewList';
import { checkCanReviewEvent, getUserReviewForEvent } from '@/actions/public/reviews';
import { useCountryName } from '@/hooks/useCountry';
import { getCurrencySymbol } from '@/utils/country-helpers';

type EventDetailsClientProps = {
    event: any;
    user: any;
    interestData?: {
        isInterested: boolean;
        interestCount: number;
    };
};

export default function EventDetailsClient({ event, user, interestData }: EventDetailsClientProps) {
    const t = useTranslations('Events');
    const countryName = useCountryName();
    const tReviews = useTranslations('Reviews');
    const locale = useLocale();
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookingRef = useRef<HTMLDivElement>(null);
    const reviewSectionRef = useRef<HTMLDivElement>(null);

    // Review state — use server-provided rating data as initial value (no duplicate fetch)
    const [reviewStats, setReviewStats] = useState<any>(
        event.rating ? {
            average_rating: event.rating.average,
            review_count: event.rating.count,
            rating_1_count: event.rating.rating_1_count || 0,
            rating_2_count: event.rating.rating_2_count || 0,
            rating_3_count: event.rating.rating_3_count || 0,
            rating_4_count: event.rating.rating_4_count || 0,
            rating_5_count: event.rating.rating_5_count || 0,
        } : null
    );
    const [canReview, setCanReview] = useState(false);
    const [reviewReason, setReviewReason] = useState('');
    const [userReview, setUserReview] = useState<any>(null);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [editingReview, setEditingReview] = useState(false);
    const [policyExpanded, setPolicyExpanded] = useState(false);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(false);
    const [liked, setLiked] = useState(false);

    const hasCancellationPolicy = !!event.vendor?.cancellation_policy;
    const hasReturnPolicy = !!event.vendor?.return_policy;
    const hasAnyPolicy = hasCancellationPolicy || hasReturnPolicy;

    const cs = getCurrencySymbol(event.country);

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: event.title,
                    url: window.location.href,
                });
            } else {
                throw new Error('Web Share API not supported');
            }
        } catch (error: any) {
            // Ignore AbortError as it means the user cancelled the share
            if (error.name === 'AbortError') return;

            // Fallback to clipboard for other errors or if API not supported
            try {
                await navigator.clipboard.writeText(window.location.href);
                alert(t('link_copied'));
            } catch (clipboardError) {
                console.error('Failed to copy to clipboard:', clipboardError);
            }
        }
    };

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
    const isProspectEvent = !!event.prospect_vendor_id;

    // Scroll to review section immediately on mount when ?review=true (don't wait for async data)
    useEffect(() => {
        if (searchParams.get('review') === 'true') {
            // Small delay to let the DOM render the review section
            setTimeout(() => {
                reviewSectionRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
            }, 200);
        }
    }, [searchParams]);

    // Fetch user-specific review data on mount (rating already from server)
    useEffect(() => {
        async function fetchReviewData() {
            if (!user) return;

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

            // Auto-open review form if arriving from email link
            if (searchParams.get('review') === 'true' && canReviewResult.canReview) {
                setShowReviewForm(true);
            }
        }

        fetchReviewData();
    }, [event.id, user]);

    return (
        <div className="min-h-screen bg-white pb-32 md:pb-16 selection:bg-primary selection:text-white">

            {/* ─── Hero Image (Full-Width) ─────────────────────────────── */}
            <div className="relative w-full h-[280px] md:h-[400px] bg-gray-100 overflow-hidden">
                <Image
                    src={event.image_url || '/images/hero_community.png'}
                    alt={event.title}
                    fill
                    className="object-cover"
                    priority
                />
                {/* Gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                {/* Action Buttons (absolute top-right, below navbar) */}
                <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                    <button
                        onClick={handleShare}
                        className="p-2.5 bg-black/30 backdrop-blur-md rounded-xl text-white hover:bg-black/50 transition-colors"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                    <button
                        className="p-2.5 bg-black/30 backdrop-blur-md rounded-xl text-white hover:bg-black/50 transition-colors"
                        onClick={() => {
                            if (!user) {
                                router.push('/login');
                            } else {
                                setLiked(!liked);
                                if (!liked) alert(t('added_favorites'));
                            }
                        }}
                    >
                        <Heart className={`w-5 h-5 transition-colors ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>
                </div>

                {/* Category + Price Badge on Image */}
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between z-10">
                    <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md text-gray-900 text-xs font-bold rounded-lg">
                            {event.category_name_en || t('default_category')}
                        </span>
                        {isProspectEvent ? (
                            <span className="px-3 py-1.5 bg-amber-400/90 backdrop-blur-md text-amber-900 text-xs font-bold rounded-lg flex items-center gap-1">
                                ⚡ Coming Soon
                            </span>
                        ) : (
                            <span className="px-3 py-1.5 bg-emerald-500/90 backdrop-blur-md text-white text-xs font-bold rounded-lg flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                {t('verified_community')}
                            </span>
                        )}
                    </div>
                    <div className="px-4 py-2 bg-white/95 backdrop-blur-md rounded-xl shadow-lg">
                        <p className="text-[10px] text-gray-500 font-semibold">{t('starting_price')}</p>
                        <p className="text-lg font-bold text-gray-900 leading-tight">
                            {minPrice > 0 ? `${minPrice} ${cs}` : t('free')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Event Status Banner */}
            {(isExpired || isSoldOut) && (
                <div className={`mx-4 md:mx-auto max-w-6xl mt-4 p-4 rounded-xl flex items-center gap-3 ${isExpired ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
                    <div className={`p-2 rounded-lg shrink-0 ${isExpired ? 'bg-red-100' : 'bg-amber-100'}`}>
                        {isExpired ? <XCircle className="w-5 h-5 text-red-600" /> : <AlertCircle className="w-5 h-5 text-amber-600" />}
                    </div>
                    <div>
                        <p className={`font-bold text-sm ${isExpired ? 'text-red-700' : 'text-amber-700'}`}>
                            {isExpired ? t('status_expired') : t('status_sold_out')}
                        </p>
                        <p className={`text-xs ${isExpired ? 'text-red-600' : 'text-amber-600'}`}>
                            {isExpired ? t('expired_message') : t('sold_out_message')}
                        </p>
                    </div>
                </div>
            )}

            {/* ─── Main Content Grid ─────────────────────────────────── */}
            <div className="max-w-6xl mx-auto px-4 md:px-8 grid md:grid-cols-12 gap-6 md:gap-10 mt-4 md:mt-8 relative z-10">

                {/* ─── Left Column ──────────────────────────────────── */}
                <div className="md:col-span-7 lg:col-span-8 space-y-5 md:space-y-8">

                    {/* Title + Quick Info */}
                    <div className="space-y-4">
                        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 leading-tight tracking-tight">
                            {event.title}
                        </h1>

                        {/* Rating Badge (inline) */}
                        {reviewStats && reviewStats.review_count > 0 && (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-amber-500">
                                    <Star className="w-4 h-4 fill-current" />
                                    <span className="text-sm font-bold text-gray-900">{Number(reviewStats.average_rating).toFixed(1)}</span>
                                </div>
                                <span className="text-xs text-gray-400">·</span>
                                <span className="text-xs text-gray-500 font-medium">{reviewStats.review_count} reviews</span>
                            </div>
                        )}
                    </div>

                    {/* ─── Event Info Strip (compact on mobile) ──────── */}
                    <div className="flex flex-row gap-0 rounded-xl border border-gray-100 overflow-hidden bg-gray-50 divide-x divide-gray-100">
                        {/* Date */}
                        <div className="flex-1 flex flex-col items-center justify-center py-3 px-2 md:py-4 md:px-4 gap-1">
                            <Calendar className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                            <p className="text-[9px] md:text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('when')}</p>
                            <p className="text-xs md:text-sm font-bold text-gray-900 text-center capitalize leading-tight">
                                {new Date(event.date).toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                            </p>
                        </div>

                        {/* Time */}
                        <div className="flex-1 flex flex-col items-center justify-center py-3 px-2 md:py-4 md:px-4 gap-1">
                            <Clock className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                            <p className="text-[9px] md:text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('time')}</p>
                            <p className="text-xs md:text-sm font-bold text-gray-900 text-center leading-tight" dir="ltr">
                                {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' })}
                            </p>
                        </div>

                        {/* Location */}
                        <div className="flex-1 flex flex-col items-center justify-center py-3 px-2 md:py-4 md:px-4 gap-1">
                            <MapPin className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                            <p className="text-[9px] md:text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('where')}</p>
                            <p className="text-xs md:text-sm font-bold text-gray-900 text-center leading-tight truncate max-w-full">
                                {event.district && event.city ? `${event.district}` : (event.location_name || countryName)}
                            </p>
                        </div>
                    </div>

                    {/* ─── Vendor Card ───────────────────────────────── */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <Link
                            href={event.vendor?.slug ? `/v/${event.vendor.slug}` : `/vendor/${event.vendor_id}`}
                            className="flex items-center gap-4 text-start group/vendor cursor-pointer flex-1 min-w-0"
                        >
                            <div className="relative w-11 h-11 md:w-14 md:h-14 rounded-lg md:rounded-xl overflow-hidden border-2 border-white shadow-md bg-white shrink-0 group-hover/vendor:shadow-lg transition-shadow">
                                <Image
                                    src={event.vendor?.company_logo || '/images/logo_nav.png'}
                                    alt="Vendor"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{t('elite_organizer')}</p>
                                <h3 className="text-base font-bold text-gray-900 group-hover/vendor:text-primary transition-colors truncate">
                                    {event.vendor?.business_name || t('default_partner')}
                                </h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {event.vendor_rating && event.vendor_rating.count > 0 && (
                                        <>
                                            <div className="flex items-center gap-1 text-amber-500">
                                                <Star className="w-3 h-3 fill-current" />
                                                <span className="text-xs font-bold text-gray-700">{event.vendor_rating.average.toFixed(1)}</span>
                                            </div>
                                            <span className="text-gray-300">·</span>
                                        </>
                                    )}
                                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        {t('super_partner')}
                                    </span>
                                </div>
                            </div>
                        </Link>

                        {event.vendor?.whatsapp_number && (
                            <a
                                href={`https://wa.me/${event.vendor.whatsapp_number}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-semibold text-xs hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 shrink-0"
                            >
                                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                                <span>{t('inquire_whatsapp')}</span>
                            </a>
                        )}
                    </div>

                    {/* ─── Description ───────────────────────────────── */}
                    <div className="space-y-3">
                        <h2 className="text-base md:text-lg font-bold text-gray-900">{t('the_experience')}</h2>
                        <div className="prose prose-sm md:prose-base text-gray-600 leading-relaxed max-w-none whitespace-pre-line">
                            {event.description || t('default_description')}
                        </div>
                    </div>

                    {/* ─── Cancellation & Return Policy ─────────────── */}
                    {hasAnyPolicy && (
                        <div className="border border-gray-100 rounded-xl overflow-hidden">
                            <button
                                onClick={() => setPolicyExpanded(!policyExpanded)}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="w-5 h-5 text-gray-400" />
                                    <h2 className="text-sm font-bold text-gray-900">{t('cancellation_return_policy')}</h2>
                                </div>
                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${policyExpanded ? 'rotate-180' : ''}`} />
                            </button>

                            {policyExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="px-4 pb-4 space-y-3 overflow-hidden"
                                >
                                    {hasCancellationPolicy && (
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <h4 className="text-xs font-bold text-gray-500 mb-2">{t('cancellation_policy')}</h4>
                                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                                                {event.vendor.cancellation_policy}
                                            </p>
                                        </div>
                                    )}
                                    {hasReturnPolicy && (
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <h4 className="text-xs font-bold text-gray-500 mb-2">{t('return_policy')}</h4>
                                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                                                {event.vendor.return_policy}
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    )}

                    {/* ─── Map ───────────────────────────────────────── */}
                    {event.location_lat && (
                        <div className="space-y-3">
                            <h2 className="text-base md:text-lg font-bold text-gray-900">{t('location_context')}</h2>
                            {(event.location_name || event.location_details) && (
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                                    <div className="flex flex-col">
                                        {event.location_name && (
                                            <span className="text-sm font-semibold text-gray-700">{event.location_name}</span>
                                        )}
                                        {event.location_details && (
                                            <span className="text-xs text-gray-500 mt-0.5">{event.location_details}</span>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div className="relative h-[200px] md:h-[300px] w-full rounded-xl overflow-hidden border border-gray-200 group">
                                <Image
                                    src={`https://maps.googleapis.com/maps/api/staticmap?center=${event.location_lat},${event.location_long}&zoom=15&size=800x400&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&markers=color:0xF26522%7C${event.location_lat},${event.location_long}&style=feature:all|element:all|saturation:-20|lightness:10`}
                                    alt="Map"
                                    fill
                                    className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                                />
                                <div className="absolute bottom-3 right-3">
                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${event.location_lat},${event.location_long}`}
                                        target="_blank"
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-900 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all text-xs border border-gray-100"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5 text-primary" />
                                        <span>{t('show_direct_route')}</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── Reviews Section ───────────────────────────── */}
                    <div className="space-y-4 md:space-y-6 pt-2 md:pt-4" ref={reviewSectionRef}>
                        <h2 className="text-base md:text-lg font-bold text-gray-900">{tReviews('title')}</h2>

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
                                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                                        <p className="text-sm font-bold text-emerald-700 mb-2">
                                            {tReviews('you_reviewed')}
                                        </p>
                                        <button
                                            onClick={() => setEditingReview(true)}
                                            className="text-sm font-semibold text-primary hover:underline"
                                        >
                                            {tReviews('edit_review')}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowReviewForm(true)}
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 hover:border-primary text-gray-700 rounded-xl font-bold text-sm hover:bg-primary/5 hover:text-primary transition-all"
                                    >
                                        {tReviews('write_review')}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Show message if user cannot review */}
                        {user && !canReview && !userReview && reviewReason && (
                            <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                                <p className="text-sm text-gray-600">
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

                {/* ─── Right Column: Booking Widget (Desktop) ──────── */}
                <div className="md:col-span-5 lg:col-span-4 relative pb-20 md:pb-0" ref={bookingRef}>
                    <div className="sticky top-28">
                        <div className="hidden md:block">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                {isProspectEvent && interestData ? (
                                    <InterestWidget
                                        eventId={event.id}
                                        user={user}
                                        initialInterested={interestData.isInterested}
                                        interestCount={interestData.interestCount}
                                    />
                                ) : (
                                    <Suspense fallback={<div className="h-[300px] bg-gray-50 animate-pulse rounded-2xl" />}>
                                        <EventBookingForm event={event} tickets={event.tickets || []} />
                                    </Suspense>
                                )}
                            </motion.div>
                        </div>

                        {/* Trust Badges */}
                        <div className="hidden md:flex items-center justify-center gap-6 mt-5 py-4 text-gray-400">
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                                <span>{t('benefit_1_title')}</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-gray-200" />
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                                <Clock className="w-3.5 h-3.5 text-primary" />
                                <span>{t('benefit_2_title')}</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Mobile Booking Bar */}
            <MobileBookingBar
                price={minPrice}
                country={event.country}
                event={event}
                tickets={event.tickets || []}
            />
        </div>
    );
}

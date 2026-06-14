'use client';

import { useState } from 'react';
import { Store, Calendar, Check, ArrowRight, Loader2, Users, PartyPopper, ExternalLink, Sparkles, Shield, BarChart3, Zap } from 'lucide-react';
import { useRouter } from '@/navigation';
import { claimProspectBusiness } from '@/actions/public/claim';

// ─── Bilingual Strings ──────────────────────────────────────────────────────

const t = (locale: string) => {
    const isAr = locale === 'ar';
    return {
        dir: isAr ? 'rtl' as const : 'ltr' as const,
        pageReady: isAr ? 'صفحتك جاهزة! ✨' : 'Your Page is Ready! ✨',
        onNuqta: isAr ? 'على نقطة' : 'on Nuqta',
        peopleInterested: (count: number) =>
            isAr
                ? `${count} ${count === 1 ? 'شخص مهتم' : 'أشخاص مهتمين'}`
                : `${count} ${count === 1 ? 'person' : 'people'} interested`,
        inYourEvents: isAr ? 'بفعالياتك على نقطة' : 'in your events on Nuqta',
        yourEvents: isAr ? 'فعالياتك على نقطة:' : 'Your events on Nuqta:',
        whatYouGet: isAr ? 'ماذا ستحصل عليه:' : 'What you get:',
        benefits: isAr
            ? [
                'صفحتك كمنظم فعاليات — جاهزة ومنشورة',
                'إدارة الفعاليات والحجوزات والمواعيد',
                'معرفة من يهتم بفعالياتك وقبول المدفوعات',
                'لوحة تحليلات — مجانية للبدء',
            ]
            : [
                'Your own vendor page — already live on Nuqta',
                'Manage your events, bookings & schedule',
                'See who\'s interested and accept payments',
                'Analytics dashboard — free to start',
            ],
        getStarted: isAr ? 'ابدأ الآن — مجاناً' : 'Get Started — It\'s Free',
        signUp: isAr ? 'سجّل مجاناً' : 'Sign Up Free',
        claiming: isAr ? 'جاري التفعيل...' : 'Claiming...',
        terms: isAr
            ? 'بالتسجيل، أنت توافق على شروط نقطة للمنظمين.\nالخطة المجانية — بدون بطاقة ائتمان.'
            : 'By signing up, you agree to Nuqta\'s vendor terms.\nFree starter plan — no credit card needed.',
        // Success
        welcomeTitle: isAr ? '!أهلاً بك في نقطة 🎉' : 'Welcome to Nuqta! 🎉',
        nowYours: (name: string) => isAr ? `${name} الآن ملكك.` : `${name} is now yours.`,
        eventsTransferred: isAr
            ? 'تم نقل فعالياتك إلى لوحة التحكم. يمكنك الآن إدارة الحجوزات ومعرفة المهتمين.'
            : 'Your events have been transferred to your dashboard. You can now manage bookings and see who\'s interested.',
        goToDashboard: isAr ? 'اذهب للوحة التحكم' : 'Go to Dashboard',
        freeForever: isAr ? 'مجاني للأبد • بدون بطاقة ائتمان' : 'Free forever • No credit card',
    };
};

// ─── Benefit Icons ──────────────────────────────────────────────────────────

const BENEFIT_ICONS = [Store, Zap, BarChart3, Shield];

// ─── Component ──────────────────────────────────────────────────────────────

interface ClaimFormClientProps {
    prospect: any;
    events: { id: string; title: string; date: string; status: string | null }[];
    user: any;
    locale: string;
    interestCount?: number;
}

export default function ClaimFormClient({ prospect, events, user, locale, interestCount = 0 }: ClaimFormClientProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [claimed, setClaimed] = useState(false);
    const [error, setError] = useState('');
    const strings = t(locale);
    const isAr = locale === 'ar';

    const handleClaim = async () => {
        if (!user) {
            router.push(`/register?redirect=/claim/${prospect.claim_token}&role=vendor`);
            return;
        }

        setLoading(true);
        setError('');

        const result = await claimProspectBusiness(prospect.claim_token);

        if (result.success) {
            setClaimed(true);
        } else {
            setError(result.error || (isAr ? 'حدث خطأ. حاول مرة أخرى.' : 'Something went wrong. Please try again.'));
        }

        setLoading(false);
    };

    // ─── Success State ──────────────────────────────────────────────────

    if (claimed) {
        return (
            <div dir={strings.dir} className="min-h-screen bg-gradient-to-br from-emerald-50 via-sky-50 to-violet-50 flex items-center justify-center p-5">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-black/5 p-10 text-center animate-in fade-in zoom-in-95 duration-500">
                    {/* Success Icon */}
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mx-auto mb-6">
                        <PartyPopper size={40} className="text-emerald-600" />
                    </div>

                    <h1 className="text-2xl font-black text-zinc-900 mb-3">
                        {strings.welcomeTitle}
                    </h1>
                    <p className="text-[15px] text-zinc-600 leading-relaxed mb-1">
                        <strong>{strings.nowYours(prospect.business_name)}</strong>
                    </p>
                    <p className="text-sm text-zinc-500 leading-relaxed mb-8">
                        {strings.eventsTransferred}
                    </p>

                    <a
                        href={`/${locale}/dashboard/vendor`}
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#2CA58D] to-[#258f7a] text-white font-bold text-base no-underline shadow-lg shadow-[#2CA58D]/30 hover:shadow-xl hover:shadow-[#2CA58D]/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {strings.goToDashboard}
                        <ExternalLink size={18} />
                    </a>
                </div>
            </div>
        );
    }

    // ─── Claim Form ─────────────────────────────────────────────────────

    return (
        <div dir={strings.dir} className="min-h-screen bg-gradient-to-br from-violet-50/80 via-sky-50 to-fuchsia-50/60 flex items-center justify-center p-5">
            <div className="max-w-[520px] w-full bg-white rounded-3xl shadow-xl shadow-black/5 overflow-hidden">

                {/* ── Header ── */}
                <div className="relative bg-gradient-to-br from-[#2CA58D] to-[#1e8a74] px-8 py-10 text-center text-white overflow-hidden">
                    {/* Decorative circles */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
                    <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />

                    {/* Logo */}
                    <div className="relative w-[72px] h-[72px] rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 ring-2 ring-white/20">
                        {prospect.logo_url ? (
                            <img
                                src={prospect.logo_url}
                                alt={prospect.business_name}
                                className="w-full h-full object-cover rounded-2xl"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        ) : (
                            <Store size={32} className="text-white" />
                        )}
                    </div>

                    <h1 className="relative text-2xl font-black mb-2">{strings.pageReady}</h1>
                    <p className="relative text-[15px] opacity-90 font-medium">{prospect.business_name}</p>
                </div>

                {/* ── Body ── */}
                <div className="px-8 py-8 space-y-6">

                    {/* Social Proof — Interest Count */}
                    {interestCount > 0 && (
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-100">
                            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                                <Users size={20} className="text-violet-600" />
                            </div>
                            <div>
                                <div className="font-bold text-[15px] text-violet-700">
                                    {strings.peopleInterested(interestCount)}
                                </div>
                                <div className="text-xs text-violet-500 font-medium">
                                    {strings.inYourEvents}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Events Listed */}
                    {events.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-zinc-800 mb-3 flex items-center gap-2">
                                <Sparkles size={14} className="text-[#2CA58D]" />
                                {strings.yourEvents}
                            </h3>
                            <div className="space-y-2">
                                {events.map(e => (
                                    <div
                                        key={e.id}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-100 hover:border-[#2CA58D]/30 transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-[#2CA58D]/10 flex items-center justify-center flex-shrink-0">
                                            <Calendar size={14} className="text-[#2CA58D]" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-semibold text-sm text-zinc-900 truncate">{e.title}</div>
                                            <div className="text-xs text-zinc-400">
                                                {new Date(e.date).toLocaleDateString(isAr ? 'ar-EG' : 'en', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Benefits */}
                    <div>
                        <h3 className="text-sm font-bold text-zinc-800 mb-3 flex items-center gap-2">
                            <Check size={14} className="text-emerald-500" />
                            {strings.whatYouGet}
                        </h3>
                        <div className="space-y-2.5">
                            {strings.benefits.map((benefit, i) => {
                                const Icon = BENEFIT_ICONS[i] || Check;
                                return (
                                    <div key={i} className="flex items-center gap-3 text-sm text-zinc-600">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                            <Icon size={14} className="text-emerald-500" />
                                        </div>
                                        <span>{benefit}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] font-medium">
                            {error}
                        </div>
                    )}

                    {/* CTA Button */}
                    <button
                        onClick={handleClaim}
                        disabled={loading}
                        className={`w-full py-4 px-6 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 border-none cursor-pointer ${
                            loading
                                ? 'bg-zinc-300 cursor-wait shadow-none'
                                : 'bg-gradient-to-r from-[#2CA58D] to-[#1e8a74] shadow-lg shadow-[#2CA58D]/30 hover:shadow-xl hover:shadow-[#2CA58D]/40 hover:scale-[1.01] active:scale-[0.99]'
                        }`}
                    >
                        {loading ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : user ? (
                            <>
                                {strings.getStarted}
                                <ArrowRight size={18} className={isAr ? 'rotate-180' : ''} />
                            </>
                        ) : (
                            <>
                                {strings.signUp}
                                <ArrowRight size={18} className={isAr ? 'rotate-180' : ''} />
                            </>
                        )}
                    </button>

                    {/* Terms */}
                    <p className="text-xs text-zinc-400 text-center leading-relaxed whitespace-pre-line">
                        {strings.terms}
                    </p>

                    {/* Free badge */}
                    <div className="flex justify-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold">
                            <Shield size={12} />
                            {strings.freeForever}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import { X, Crown, TrendingUp, Check, Sparkles } from 'lucide-react';
import { SUBSCRIPTION_TIERS, getSubscriptionPrice, type SubscriptionTier } from '@/lib/constants/subscription';
import { getCurrencySymbol } from '@/utils/country-helpers';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTier: SubscriptionTier;
    reason?: 'event_limit' | 'features' | 'analytics';
    vendorCountry?: string;
}

export default function UpgradeModal({ isOpen, onClose, currentTier, reason = 'event_limit', vendorCountry }: UpgradeModalProps) {
    if (!isOpen) return null;
    const cs = getCurrencySymbol(vendorCountry);

    const currentTierConfig = SUBSCRIPTION_TIERS[currentTier];
    const suggestedTier: SubscriptionTier = currentTier === 'starter' ? 'growth' : 'professional';
    const suggestedTierConfig = SUBSCRIPTION_TIERS[suggestedTier];
    const price = getSubscriptionPrice(suggestedTier, false);
    const founderPrice = getSubscriptionPrice(suggestedTier, true);

    const reasonMessages = {
        event_limit: {
            title: '⚠️ وصلت للحد الأقصى من الفعاليات',
            description: `حالياً أنت على ${currentTierConfig.name} ويمكنك إنشاء ${currentTierConfig.maxActiveEvents === Infinity ? 'غير محدود' : currentTierConfig.maxActiveEvents} من الفعاليات النشطة. للاستمرار في النمو، قم بالترقية!`
        },
        features: {
            title: '🚀 اكتشف ميزات احترافية',
            description: `احصل على إمكانيات أكثر مع ${suggestedTierConfig.name}`
        },
        analytics: {
            title: '📊 تحليلات متقدمة',
            description: `احصل على رؤى أعمق لفعالياتك مع ${suggestedTierConfig.name}`
        }
    };

    const message = reasonMessages[reason];
    const Icon = suggestedTier === 'growth' ? TrendingUp : Crown;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-slideUp" dir="rtl">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 left-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                    <X className="w-5 h-5 text-gray-600" />
                </button>

                {/* Header with gradient */}
                <div className={`px-8 pt-8 pb-6 ${suggestedTier === 'growth' ? 'bg-gradient-to-br from-[#2CA58D]/10 to-[#2CA58D]/5' : 'bg-gradient-to-br from-purple-50 to-pink-50'}`}>
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-2xl ${suggestedTier === 'growth' ? 'bg-[#2CA58D]/20' : 'bg-purple-100'}`}>
                            <Icon className={`w-8 h-8 ${suggestedTier === 'growth' ? 'text-[#2CA58D]' : 'text-purple-600'}`} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900">{message.title}</h2>
                            <p className="text-sm text-gray-600 font-medium mt-1">{message.description}</p>
                        </div>
                    </div>
                </div>

                {/* Pricing card */}
                <div className="px-8 py-6">
                    <div className={`border-2 rounded-2xl p-6 ${suggestedTier === 'growth' ? 'border-[#2CA58D]/30 bg-[#2CA58D]/5' : 'border-purple-300 bg-purple-50'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">{suggestedTierConfig.name}</h3>
                                {suggestedTierConfig.badge && (
                                    <span className={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full ${suggestedTier === 'growth' ? 'bg-[#2CA58D] text-white' : 'bg-purple-500 text-white'}`}>
                                        {suggestedTierConfig.badge === 'verified' ? '✓ موثق' : '⭐ متميز'}
                                    </span>
                                )}
                            </div>
                            <div className="text-left">
                                <div className="text-3xl font-black text-gray-900">
                                    {price.toLocaleString()} {cs}
                                </div>
                                <div className="text-xs text-gray-500 font-medium">/ شهرياً</div>
                            </div>
                        </div>

                        {/* Founder pricing banner */}
                        <div className="mb-6 p-4 bg-[#2CA58D]/10 border-2 border-[#2CA58D]/30 rounded-xl">
                            <div className="flex items-start gap-3">
                                <Sparkles className="w-5 h-5 text-[#2CA58D] flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="text-sm font-black text-[#2CA58D] mb-1">🎉 عرض المؤسسين - خصم 50% مدى الحياة!</h4>
                                    <p className="text-xs text-gray-700">
                                        سجل قبل 1 مايو 2026 واحصل على <span className="font-bold">{founderPrice.toLocaleString()} {cs}/شهر</span> بدلاً من {price.toLocaleString()} {cs}/شهر للأبد!
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Features list */}
                        <div className="space-y-3 mb-6">
                            {suggestedTierConfig.features.slice(0, 5).map((feature, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${suggestedTier === 'growth' ? 'bg-[#2CA58D]' : 'bg-purple-500'}`}>
                                        <Check className="w-3 h-3 text-white stroke-[3]" />
                                    </div>
                                    <span className="text-sm text-gray-700 font-medium">{feature}</span>
                                </div>
                            ))}
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                className={`flex-1 py-4 rounded-xl font-bold text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all ${suggestedTier === 'growth' ? 'bg-[#2CA58D] hover:bg-[#258f7a]' : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'}`}
                            >
                                ترقية الآن - شهر أول مجاني 🎁
                            </button>
                            <button
                                onClick={onClose}
                                className="px-6 py-4 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                ربما لاحقاً
                            </button>
                        </div>

                        {/* Trial note */}
                        <p className="text-xs text-gray-500 text-center mt-4">
                            💳 لا يلزم بطاقة ائتمان - جرب مجاناً لمدة شهر كامل
                        </p>
                    </div>
                </div>

                {/* Comparison note */}
                <div className="px-8 pb-8">
                    <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-600 text-center">
                            💡 <span className="font-bold">نصيحة:</span> 87% من المنظمين الذين قاموا بالترقية شهدوا زيادة في الحجوزات بنسبة 3x خلال أول شهرين
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
                .animate-slideUp {
                    animation: slideUp 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}

'use client';

import { Lock, Sparkles } from 'lucide-react';
import { useState } from 'react';
import UpgradeModal from './UpgradeModal';

interface FeatureGateOverlayProps {
    featureName: string;
    featureNameAr: string;
    requiredTier: string;
    vendorId?: string;
    children: React.ReactNode;
}

/**
 * Wraps a tab/component with a blurred overlay + upgrade CTA when the vendor's tier
 * doesn't include that feature. The content is still rendered underneath (blurred)
 * to create a "peek" effect.
 */
export default function FeatureGateOverlay({
    featureName,
    featureNameAr,
    requiredTier,
    vendorId,
    children,
}: FeatureGateOverlayProps) {
    const [showUpgrade, setShowUpgrade] = useState(false);

    return (
        <div className="relative">
            {/* Content — rendered but blurred */}
            <div className="pointer-events-none select-none" style={{ filter: 'blur(5px)', opacity: 0.5 }}>
                {children}
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 flex items-start justify-center pt-24 z-20 bg-white/30 backdrop-blur-[1px] rounded-2xl">
                <div className="flex flex-col items-center gap-4 text-center max-w-sm px-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2CA58D] to-teal-600 flex items-center justify-center shadow-lg shadow-[#2CA58D]/20">
                        <Lock className="w-7 h-7 text-white" />
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {featureNameAr}
                        </h3>
                        <p className="text-sm text-gray-500">
                            هذه الميزة متاحة لباقة {requiredTier} وما فوق
                        </p>
                    </div>

                    <button
                        onClick={() => setShowUpgrade(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2CA58D] to-teal-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                    >
                        <Sparkles className="w-4 h-4" />
                        ترقية الباقة
                    </button>

                    <p className="text-xs text-gray-400">
                        {featureName} · Requires {requiredTier}+
                    </p>
                </div>
            </div>

            {showUpgrade && (
                <UpgradeModal
                    isOpen={showUpgrade}
                    onClose={() => setShowUpgrade(false)}
                    currentTier="free"
                    reason="feature_locked"
                    lockedFeature={featureName}
                />
            )}
        </div>
    );
}

'use client';

import { Save, Zap, Star, Crown, Calendar } from 'lucide-react';
import { AdminButton } from '../ui/AdminButton';
import { normalizeTier } from '@/lib/constants/subscription';

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; darkBg: string; icon: any; canonical: string }> = {
    free: { label: 'Free', color: 'text-zinc-500', bg: 'bg-zinc-100', darkBg: 'dark:bg-zinc-800', icon: Zap, canonical: 'free' },
    pro: { label: 'Pro', color: 'text-[#2CA58D]', bg: 'bg-[#2CA58D]/10', darkBg: 'dark:bg-[#2CA58D]/20', icon: Star, canonical: 'pro' },
    business: { label: 'Business', color: 'text-amber-600', bg: 'bg-amber-50', darkBg: 'dark:bg-amber-500/10', icon: Crown, canonical: 'business' },
};

const BILLING_OPTIONS = [
    { key: 'monthly', label: 'Monthly' },
    { key: 'annual', label: 'Annual (2 months free)' },
];

interface Props {
    editData: Record<string, any>;
    vendor: {
        subscription_starts_at?: string | null;
        subscription_expires_at?: string | null;
    };
    updateField: (field: string, value: any) => void;
    onSave: () => void;
    saving: boolean;
}

export default function VendorSubscriptionTab({ editData, vendor, updateField, onSave, saving }: Props) {
    return (
        <div>
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Current Plan</h3>
                <div className="grid grid-cols-3 gap-3">
                    {Object.entries(TIER_CONFIG).map(([key, cfg]) => {
                        const Icon = cfg.icon;
                        const isSelected = normalizeTier(editData.subscription_tier) === key;
                        return (
                            <div
                                key={key}
                                onClick={() => updateField('subscription_tier', key)}
                                className={`p-4 rounded-2xl border-2 cursor-pointer text-center transition-all duration-200 ${
                                    isSelected
                                        ? `${cfg.bg} ${cfg.darkBg} border-current ${cfg.color}`
                                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                                }`}
                            >
                                <Icon size={24} className={`mx-auto mb-2 ${cfg.color}`} />
                                <div className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">Billing Period</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Annual saves ~17% (2 months free)</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                    {BILLING_OPTIONS.map(opt => {
                        const isSelected = (editData.billing_period || 'monthly') === opt.key;
                        return (
                            <div
                                key={opt.key}
                                onClick={() => updateField('billing_period', opt.key)}
                                className={`px-4 py-3 rounded-xl border-2 cursor-pointer flex items-center gap-2 transition-all duration-200 ${
                                    isSelected
                                        ? 'border-[#2CA58D] bg-[#2CA58D]/10 dark:bg-[#2CA58D]/20'
                                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                                }`}
                            >
                                <Calendar size={16} className={isSelected ? 'text-[#2CA58D]' : 'text-zinc-500 dark:text-zinc-400'} />
                                <span className={`text-sm font-semibold ${isSelected ? 'text-[#2CA58D]' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                    {opt.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-4 mt-6">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3">Subscription Dates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Started At</label>
                        <div className="w-full h-11 px-4 text-sm rounded-2xl border-2 flex items-center bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                            {vendor.subscription_starts_at ? new Date(vendor.subscription_starts_at).toLocaleDateString() : 'Not set'}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Expires At</label>
                        <div className="w-full h-11 px-4 text-sm rounded-2xl border-2 flex items-center bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                            {vendor.subscription_expires_at ? new Date(vendor.subscription_expires_at).toLocaleDateString() : 'Never (Admin Override)'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 py-4 flex justify-end">
                <AdminButton
                    onClick={onSave}
                    disabled={saving}
                    isLoading={saving}
                >
                    <Save size={14} className="mr-1" />
                    Update Subscription
                </AdminButton>
            </div>
        </div>
    );
}

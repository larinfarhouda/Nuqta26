'use client';

import { useState } from 'react';
import {
    Crown, Check, Loader2, Hash, DollarSign, Star,
    TrendingUp, Infinity as InfinityIcon,
    Plus, Trash2,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { updateSubscriptionTier } from '@/actions/admin/subscription-tiers';

// UI Components
import { AdminCard } from './ui/AdminCard';
import { AdminButton } from './ui/AdminButton';
import { AdminInput } from './ui/AdminInput';
import { AdminBadge } from './ui/AdminBadge';

interface TierData {
    id: string;
    name: string;
    max_active_events: number; // -1 = unlimited
    regular_price: number;
    badge: string | null;
    features: string[];
    sort_order: number;
    is_active: boolean;
}

const tierColors: Record<string, { gradient: string; accent: string; bg: string }> = {
    free: {
        gradient: 'from-zinc-500 to-zinc-600',
        accent: 'text-zinc-600 dark:text-zinc-400',
        bg: 'bg-zinc-100 dark:bg-zinc-800/50',
    },
    starter: {
        gradient: 'from-zinc-500 to-zinc-600',
        accent: 'text-zinc-600 dark:text-zinc-400',
        bg: 'bg-zinc-100 dark:bg-zinc-800/50',
    },
    pro: {
        gradient: 'from-[#2CA58D] to-[#1e7866]',
        accent: 'text-[#2CA58D]',
        bg: 'bg-[#2CA58D]/10',
    },
    growth: {
        gradient: 'from-[#2CA58D] to-[#1e7866]',
        accent: 'text-[#2CA58D]',
        bg: 'bg-[#2CA58D]/10',
    },
    business: {
        gradient: 'from-amber-500 to-amber-600',
        accent: 'text-amber-500',
        bg: 'bg-amber-500/10',
    },
    professional: {
        gradient: 'from-amber-500 to-amber-600',
        accent: 'text-amber-500',
        bg: 'bg-amber-500/10',
    },
};

const tierIcons: Record<string, React.ElementType> = {
    free: Star,
    starter: Star,
    pro: TrendingUp,
    growth: TrendingUp,
    business: Crown,
    professional: Crown,
};

export default function AdminSubscriptionTiersClient({
    initialTiers,
}: {
    initialTiers: TierData[];
}) {
    const [tiers, setTiers] = useState<TierData[]>(initialTiers);

    return (
        <div className="max-w-[1200px] pb-12">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                    Subscription Tiers
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                    Control event limits, pricing, and features for each subscription tier
                </p>
            </div>

            {/* Tier Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tiers.map((tier) => (
                    <TierCard
                        key={tier.id}
                        tier={tier}
                        onUpdate={(updated) => {
                            setTiers((prev) =>
                                prev.map((t) => (t.id === updated.id ? updated : t))
                            );
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

function TierCard({
    tier,
    onUpdate,
}: {
    tier: TierData;
    onUpdate: (updated: TierData) => void;
}) {
    const [form, setForm] = useState({
        name: tier.name,
        max_active_events: tier.max_active_events,
        regular_price: tier.regular_price,
        badge: tier.badge || '',
        features: [...tier.features],
    });
    const [saving, setSaving] = useState(false);
    const [newFeature, setNewFeature] = useState('');
    const { toast } = useToast();

    const colors = tierColors[tier.id] || tierColors.starter;
    const Icon = tierIcons[tier.id] || Star;
    const isUnlimited = form.max_active_events === -1;

    const hasChanges =
        form.name !== tier.name ||
        form.max_active_events !== tier.max_active_events ||
        form.regular_price !== tier.regular_price ||
        (form.badge || '') !== (tier.badge || '') ||
        JSON.stringify(form.features) !== JSON.stringify(tier.features);

    const handleSave = async () => {
        setSaving(true);
        const result = await updateSubscriptionTier(tier.id, {
            name: form.name,
            max_active_events: form.max_active_events,
            regular_price: form.regular_price,
            badge: form.badge || null,
            features: form.features,
        });
        setSaving(false);

        if (result.success && result.tier) {
            toast('success', `${form.name} tier updated successfully`);
            onUpdate(result.tier as TierData);
        } else {
            toast('error', (result as any).error || 'Failed to update tier');
        }
    };

    const addFeature = () => {
        if (!newFeature.trim()) return;
        setForm((p) => ({ ...p, features: [...p.features, newFeature.trim()] }));
        setNewFeature('');
    };

    const removeFeature = (index: number) => {
        setForm((p) => ({
            ...p,
            features: p.features.filter((_, i) => i !== index),
        }));
    };

    return (
        <AdminCard noPadding className="flex flex-col h-full border-0">
            {/* Tier Header */}
            <div className={`bg-gradient-to-br ${colors.gradient} p-6 flex items-center gap-4 relative overflow-hidden`}>
                <div className="absolute top-0 right-0 p-6 opacity-10">
                    <Icon size={120} className="translate-x-4 -translate-y-4" />
                </div>
                
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 z-10 border border-white/10 shadow-inner">
                    <Icon size={24} className="text-white" />
                </div>
                <div className="flex-1 z-10">
                    <div className="text-xl font-bold text-white tracking-tight">
                        {tier.name}
                    </div>
                    <div className="text-white/70 text-xs font-medium uppercase tracking-wider mt-0.5">
                        ID: {tier.id}
                    </div>
                </div>
                {hasChanges && (
                    <div className="z-10 bg-white/20 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-lg border border-white/10 shadow-sm animate-in fade-in zoom-in-95">
                        Unsaved
                    </div>
                )}
            </div>

            {/* Form Body */}
            <div className="p-6 flex flex-col gap-6 flex-1 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl">
                {/* Name */}
                <div>
                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                        Display Name
                    </label>
                    <AdminInput
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    />
                </div>

                {/* Events & Pricing Row */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Max Events */}
                    <div>
                        <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                            <Hash size={14} /> Events/Month
                        </label>
                        <div className="flex gap-2 items-center">
                            {isUnlimited ? (
                                <div className={`h-11 px-4 flex items-center gap-2 rounded-2xl border-2 border-transparent ${colors.bg} ${colors.accent} font-bold text-sm w-full`}>
                                    <InfinityIcon size={18} /> Unlimited
                                </div>
                            ) : (
                                <AdminInput
                                    type="number"
                                    min={1}
                                    value={form.max_active_events}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            max_active_events: parseInt(e.target.value) || 1,
                                        }))
                                    }
                                    className="font-bold"
                                />
                            )}
                        </div>
                        <button
                            onClick={() =>
                                setForm((p) => ({
                                    ...p,
                                    max_active_events: p.max_active_events === -1 ? 1 : -1,
                                }))
                            }
                            className={`mt-2 text-xs font-bold ${colors.accent} hover:underline focus:outline-none`}
                        >
                            {isUnlimited ? 'Set limit' : 'Set unlimited'}
                        </button>
                    </div>

                    {/* Regular Price */}
                    <div>
                        <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                            <DollarSign size={14} /> Price
                        </label>
                        <div className="relative">
                            <AdminInput
                                type="number"
                                min={0}
                                value={form.regular_price}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        regular_price: parseFloat(e.target.value) || 0,
                                    }))
                                }
                                className="font-bold pr-12"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                                SAR
                            </div>
                        </div>
                        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-2">
                            per month
                        </div>
                    </div>
                </div>

                {/* Badge Selector */}
                <div>
                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                        Badge Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { value: '', label: 'None', colorClass: 'text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300', activeClass: 'border-zinc-500 bg-zinc-100 dark:bg-zinc-800' },
                            { value: 'verified', label: '✓ Verified', colorClass: 'text-emerald-600 border-zinc-200 dark:border-zinc-700 hover:border-emerald-200', activeClass: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' },
                            { value: 'premium', label: '⭐ Premium', colorClass: 'text-amber-500 border-zinc-200 dark:border-zinc-700 hover:border-amber-200', activeClass: 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-600' },
                        ].map((opt) => {
                            const isActive = form.badge === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => setForm((p) => ({ ...p, badge: opt.value }))}
                                    className={`px-3 py-1.5 rounded-xl border-2 text-sm font-bold transition-all ${
                                        isActive ? opt.activeClass : opt.colorClass
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Features List */}
                <div className="flex-1 flex flex-col">
                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-3 uppercase tracking-wider">
                        Features ({form.features.length})
                    </label>

                    <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto mb-4 pr-2 no-scrollbar">
                        {form.features.map((feature, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 group"
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${colors.bg.replace('bg-', 'bg-').replace('/10', '').replace('/50', '')}`} />
                                <span className="flex-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">{feature}</span>
                                <button
                                    onClick={() => removeFeature(idx)}
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                    aria-label="Remove feature"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add feature */}
                    <div className="flex gap-2 mt-auto">
                        <AdminInput
                            placeholder="Add a new feature..."
                            value={newFeature}
                            onChange={(e) => setNewFeature(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                        />
                        <AdminButton
                            variant="outline"
                            onClick={addFeature}
                            disabled={!newFeature.trim()}
                        >
                            <Plus size={18} />
                        </AdminButton>
                    </div>
                </div>

                {/* Save Button */}
                <AdminButton
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    isLoading={saving}
                    className={`w-full mt-2 shadow-lg transition-all ${
                        hasChanges 
                            ? `bg-gradient-to-r ${colors.gradient} hover:shadow-xl text-white border-0` 
                            : 'opacity-50 grayscale'
                    }`}
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </AdminButton>
            </div>
        </AdminCard>
    );
}

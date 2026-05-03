'use client';

import { useState } from 'react';
import {
    Crown, Check, Loader2, Hash, DollarSign, Star,
    Sparkles, TrendingUp, Infinity as InfinityIcon,
    Plus, Trash2, GripVertical,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { updateSubscriptionTier } from '@/actions/admin/subscription-tiers';

// ─── Types ──────────────────────────────────────────────────────────────────

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

// ─── Styles ─────────────────────────────────────────────────────────────────

const card = {
    background: '#fff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    overflow: 'hidden' as const,
};

const inputStyle = {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
};

const tierColors: Record<string, { gradient: string; accent: string; text: string; bg: string }> = {
    free: {
        gradient: 'linear-gradient(135deg, #94a3b8, #64748b)',
        accent: '#64748b',
        text: '#475569',
        bg: '#f1f5f9',
    },
    starter: {
        gradient: 'linear-gradient(135deg, #94a3b8, #64748b)',
        accent: '#64748b',
        text: '#475569',
        bg: '#f1f5f9',
    },
    pro: {
        gradient: 'linear-gradient(135deg, #2CA58D, #0d9373)',
        accent: '#2CA58D',
        text: '#065f46',
        bg: '#ecfdf5',
    },
    growth: {
        gradient: 'linear-gradient(135deg, #2CA58D, #0d9373)',
        accent: '#2CA58D',
        text: '#065f46',
        bg: '#ecfdf5',
    },
    business: {
        gradient: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
        accent: '#8b5cf6',
        text: '#5b21b6',
        bg: '#f5f3ff',
    },
    professional: {
        gradient: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
        accent: '#8b5cf6',
        text: '#5b21b6',
        bg: '#f5f3ff',
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

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AdminSubscriptionTiersClient({
    initialTiers,
}: {
    initialTiers: TierData[];
}) {
    const [tiers, setTiers] = useState<TierData[]>(initialTiers);

    return (
        <div style={{ maxWidth: '1200px' }}>
            {/* Header */}
            <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a' }}>
                    Subscription Tiers
                </h1>
                <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                    Control event limits, pricing, and features for each subscription tier
                </p>
            </div>

            {/* Tier Cards Grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                    gap: '20px',
                }}
            >
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

// ─── Tier Card ──────────────────────────────────────────────────────────────

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
        <div style={card}>
            {/* Tier Header */}
            <div
                style={{
                    background: colors.gradient,
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                }}
            >
                <div
                    style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Icon size={22} style={{ color: '#fff' }} />
                </div>
                <div style={{ flex: 1 }}>
                    <div
                        style={{
                            color: '#fff',
                            fontSize: '18px',
                            fontWeight: 700,
                            letterSpacing: '-0.01em',
                        }}
                    >
                        {tier.name}
                    </div>
                    <div
                        style={{
                            color: 'rgba(255,255,255,0.7)',
                            fontSize: '12px',
                            fontWeight: 500,
                        }}
                    >
                        ID: {tier.id}
                    </div>
                </div>
                {hasChanges && (
                    <div
                        style={{
                            background: 'rgba(255,255,255,0.25)',
                            color: '#fff',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '6px',
                        }}
                    >
                        Unsaved
                    </div>
                )}
            </div>

            {/* Form Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Name */}
                <div>
                    <label
                        style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#64748b',
                            marginBottom: '6px',
                            display: 'block',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}
                    >
                        Display Name
                    </label>
                    <input
                        style={inputStyle}
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    />
                </div>

                {/* Events & Pricing Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    {/* Max Events */}
                    <div>
                        <label
                            style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#64748b',
                                marginBottom: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}
                        >
                            <Hash size={12} /> Events/Month
                        </label>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {isUnlimited ? (
                                <div
                                    style={{
                                        ...inputStyle,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        color: colors.accent,
                                        fontWeight: 700,
                                        background: colors.bg,
                                    }}
                                >
                                    <InfinityIcon size={16} /> Unlimited
                                </div>
                            ) : (
                                <input
                                    style={{ ...inputStyle, fontWeight: 700, fontSize: '16px' }}
                                    type="number"
                                    min={1}
                                    value={form.max_active_events}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            max_active_events: parseInt(e.target.value) || 1,
                                        }))
                                    }
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
                            style={{
                                marginTop: '6px',
                                fontSize: '11px',
                                color: colors.accent,
                                fontWeight: 600,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                            }}
                        >
                            {isUnlimited ? 'Set limit' : 'Set unlimited'}
                        </button>
                    </div>

                    {/* Regular Price */}
                    <div>
                        <label
                            style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#64748b',
                                marginBottom: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}
                        >
                            <DollarSign size={12} /> Price
                        </label>
                        <input
                            style={{ ...inputStyle, fontWeight: 700, fontSize: '16px' }}
                            type="number"
                            min={0}
                            value={form.regular_price}
                            onChange={(e) =>
                                setForm((p) => ({
                                    ...p,
                                    regular_price: parseFloat(e.target.value) || 0,
                                }))
                            }
                        />
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                            SAR / month
                        </div>
                    </div>


                </div>

                {/* Badge Selector */}
                <div>
                    <label
                        style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#64748b',
                            marginBottom: '6px',
                            display: 'block',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}
                    >
                        Badge Type
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {[
                            { value: '', label: 'None', color: '#94a3b8' },
                            { value: 'verified', label: '✓ Verified', color: '#2CA58D' },
                            { value: 'premium', label: '⭐ Premium', color: '#8b5cf6' },
                        ].map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setForm((p) => ({ ...p, badge: opt.value }))}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '10px',
                                    border: `2px solid ${form.badge === opt.value ? opt.color : '#e2e8f0'}`,
                                    background: form.badge === opt.value ? `${opt.color}10` : '#fff',
                                    color: form.badge === opt.value ? opt.color : '#64748b',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Features List */}
                <div>
                    <label
                        style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#64748b',
                            marginBottom: '8px',
                            display: 'block',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}
                    >
                        Features ({form.features.length})
                    </label>

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            marginBottom: '8px',
                        }}
                    >
                        {form.features.map((feature, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 12px',
                                    background: '#f8fafc',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    color: '#334155',
                                }}
                            >
                                <GripVertical
                                    size={14}
                                    style={{ color: '#cbd5e1', flexShrink: 0 }}
                                />
                                <span style={{ flex: 1 }}>{feature}</span>
                                <button
                                    onClick={() => removeFeature(idx)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#ef4444',
                                        padding: '2px',
                                        flexShrink: 0,
                                    }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add feature */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            style={{ ...inputStyle, flex: 1, fontSize: '13px' }}
                            placeholder="Add a feature..."
                            value={newFeature}
                            onChange={(e) => setNewFeature(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                        />
                        <button
                            onClick={addFeature}
                            style={{
                                padding: '8px 14px',
                                borderRadius: '10px',
                                border: 'none',
                                background: colors.bg,
                                color: colors.accent,
                                fontWeight: 600,
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                            }}
                        >
                            <Plus size={14} /> Add
                        </button>
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    style={{
                        padding: '12px 24px',
                        borderRadius: '12px',
                        border: 'none',
                        background: hasChanges ? colors.gradient : '#e2e8f0',
                        color: hasChanges ? '#fff' : '#94a3b8',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: hasChanges ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                        opacity: saving ? 0.7 : 1,
                    }}
                >
                    {saving ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Check size={16} />
                    )}
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}

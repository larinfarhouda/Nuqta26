'use client';

import { Save, Loader2, Zap, Star, Crown, Calendar } from 'lucide-react';
import { colors, inputStyle, font, sectionStyle, btnPrimary } from '../admin-tokens';

const TIER_CONFIG = {
    free: { label: 'Free', color: '#64748b', bg: '#f1f5f9', icon: Zap },
    pro: { label: 'Pro', color: '#7c3aed', bg: '#ede9fe', icon: Star },
    business: { label: 'Business', color: '#d97706', bg: '#fef3c7', icon: Crown },
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
            <div style={sectionStyle}>
                <h3 style={font.sectionSubtitle}>Current Plan</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    {Object.entries(TIER_CONFIG).map(([key, cfg]) => {
                        const Icon = cfg.icon;
                        const isSelected = (editData.subscription_tier || 'free') === key;
                        return (
                            <div
                                key={key}
                                onClick={() => updateField('subscription_tier', key)}
                                style={{
                                    padding: '16px', borderRadius: '14px',
                                    border: `2px solid ${isSelected ? cfg.color : colors.border}`,
                                    background: isSelected ? cfg.bg : colors.card,
                                    cursor: 'pointer', textAlign: 'center',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <Icon size={24} style={{ color: cfg.color, margin: '0 auto 8px' }} />
                                <div style={{ fontSize: '14px', fontWeight: 700, color: cfg.color }}>{cfg.label}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div style={sectionStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h3 style={{ ...font.sectionSubtitle, margin: '0 0 4px' }}>Billing Period</h3>
                        <p style={{ fontSize: '12px', color: colors.text.muted, margin: 0 }}>Annual saves ~17% (2 months free)</p>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                    {BILLING_OPTIONS.map(opt => {
                        const isSelected = (editData.billing_period || 'monthly') === opt.key;
                        return (
                            <div
                                key={opt.key}
                                onClick={() => updateField('billing_period', opt.key)}
                                style={{
                                    padding: '12px 16px', borderRadius: '12px',
                                    border: `2px solid ${isSelected ? colors.accent : colors.border}`,
                                    background: isSelected ? `${colors.accent}10` : colors.card,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <Calendar size={16} style={{ color: isSelected ? colors.accent : colors.text.muted }} />
                                <span style={{ fontSize: '13px', fontWeight: 600, color: isSelected ? colors.accent : colors.text.primary }}>
                                    {opt.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div style={sectionStyle}>
                <h3 style={{ ...font.sectionSubtitle, margin: '0 0 12px' }}>Subscription Dates</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                        <label style={font.label}>Started At</label>
                        <div style={{ ...inputStyle, background: colors.cardAlt, color: colors.text.muted }}>
                            {vendor.subscription_starts_at ? new Date(vendor.subscription_starts_at).toLocaleDateString() : 'Not set'}
                        </div>
                    </div>
                    <div>
                        <label style={font.label}>Expires At</label>
                        <div style={{ ...inputStyle, background: colors.cardAlt, color: colors.text.muted }}>
                            {vendor.subscription_expires_at ? new Date(vendor.subscription_expires_at).toLocaleDateString() : 'Never (Admin Override)'}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={onSave}
                    disabled={saving}
                    style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}
                >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Update Subscription
                </button>
            </div>
        </div>
    );
}

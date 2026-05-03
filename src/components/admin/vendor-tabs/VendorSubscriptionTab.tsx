'use client';

import { Save, Loader2, Zap, Star, Crown } from 'lucide-react';
import { colors, inputStyle, font, sectionStyle, btnPrimary } from '../admin-tokens';

const TIER_CONFIG = {
    starter: { label: 'Starter', color: '#64748b', bg: '#f1f5f9', icon: Zap },
    growth: { label: 'Growth', color: '#7c3aed', bg: '#ede9fe', icon: Star },
    professional: { label: 'Professional', color: '#d97706', bg: '#fef3c7', icon: Crown },
};

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
                        const isSelected = (editData.subscription_tier || 'starter') === key;
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
                        <h3 style={{ ...font.sectionSubtitle, margin: '0 0 4px' }}>Founder Pricing</h3>
                        <p style={{ fontSize: '12px', color: colors.text.muted, margin: 0 }}>Lock in special pricing for early adopters</p>
                    </div>
                    <button
                        onClick={() => updateField('is_founder_pricing', !editData.is_founder_pricing)}
                        style={{
                            width: '48px', height: '28px', borderRadius: '14px',
                            background: editData.is_founder_pricing ? colors.accent : colors.border,
                            border: 'none', cursor: 'pointer', position: 'relative',
                            transition: 'background 0.2s',
                        }}
                    >
                        <div style={{
                            width: '22px', height: '22px', borderRadius: '11px',
                            background: '#fff', position: 'absolute', top: '3px',
                            left: editData.is_founder_pricing ? '23px' : '3px',
                            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                        }} />
                    </button>
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

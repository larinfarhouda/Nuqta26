'use client';

import { useState, useEffect } from 'react';
import {
    X, Store, LogIn, Loader2, Eye,
    CheckCircle, XCircle, Zap, Star, Crown,
} from 'lucide-react';
import {
    getVendorFullDetails,
    updateVendorSubscription,
    updateVendorDetails,
    impersonateVendor,
} from '@/actions/admin';
import type { AdminVendorDetail } from '@/types/admin.types';
import {
    colors, overlayStyle, panelStyle, tabStyle, btnPrimary, btnGhost,
} from './admin-tokens';

// Tab components
import VendorOverviewTab from './vendor-tabs/VendorOverviewTab';
import VendorSubscriptionTab from './vendor-tabs/VendorSubscriptionTab';
import VendorStatusTab from './vendor-tabs/VendorStatusTab';
import VendorBankingTab from './vendor-tabs/VendorBankingTab';
import VendorPoliciesTab from './vendor-tabs/VendorPoliciesTab';

const TABS = ['overview', 'subscription', 'status', 'banking', 'policies'] as const;
type Tab = typeof TABS[number];

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    free: { label: 'Free', color: '#64748b', bg: '#f1f5f9' },
    starter: { label: 'Free', color: '#64748b', bg: '#f1f5f9' },
    pro: { label: 'Pro', color: '#7c3aed', bg: '#ede9fe' },
    growth: { label: 'Pro', color: '#7c3aed', bg: '#ede9fe' },
    business: { label: 'Business', color: '#d97706', bg: '#fef3c7' },
    professional: { label: 'Business', color: '#d97706', bg: '#fef3c7' },
};

export default function AdminVendorDetailModal({
    vendorId,
    onClose,
    onUpdated,
}: {
    vendorId: string;
    onClose: () => void;
    onUpdated: () => void;
}) {
    const [vendor, setVendor] = useState<AdminVendorDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [saving, setSaving] = useState(false);
    const [impersonating, setImpersonating] = useState(false);
    const [editData, setEditData] = useState<Record<string, any>>({});
    const [saveMsg, setSaveMsg] = useState('');

    useEffect(() => {
        loadVendor();
    }, [vendorId]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const loadVendor = async () => {
        setLoading(true);
        const data = await getVendorFullDetails(vendorId);
        if (data) {
            setVendor(data as AdminVendorDetail);
            setEditData(data);
        }
        setLoading(false);
    };

    const handleSave = async (updates: Record<string, any>) => {
        setSaving(true);
        setSaveMsg('');
        const result = await updateVendorDetails(vendorId, updates);
        if ('success' in result) {
            setSaveMsg('Saved!');
            await loadVendor();
            onUpdated();
            setTimeout(() => setSaveMsg(''), 2000);
        } else {
            setSaveMsg('Error saving');
        }
        setSaving(false);
    };

    const handleSubscriptionSave = async () => {
        setSaving(true);
        setSaveMsg('');
        const result = await updateVendorSubscription(
            vendorId,
            editData.subscription_tier || 'free',
            editData.billing_period || 'monthly',
        );
        if ('success' in result) {
            setSaveMsg('Subscription updated!');
            await loadVendor();
            onUpdated();
            setTimeout(() => setSaveMsg(''), 2000);
        } else {
            setSaveMsg('Error updating subscription');
        }
        setSaving(false);
    };

    const handleImpersonate = async () => {
        if (!confirm('Login as this vendor in a new tab?')) return;
        setImpersonating(true);
        const result = await impersonateVendor(vendorId);
        if ('success' in result && result.url) {
            window.open(result.url, '_blank');
        } else {
            alert(result.error || 'Failed to generate login link');
        }
        setImpersonating(false);
    };

    const updateField = (field: string, value: any) => {
        setEditData(prev => ({ ...prev, [field]: value }));
    };

    // ─── Loading / Error States ─────────────────────────────────────────────

    if (loading) {
        return (
            <div style={overlayStyle} onClick={onClose}>
                <div style={{ ...panelStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 size={32} className="animate-spin" style={{ color: colors.accent }} />
                </div>
            </div>
        );
    }

    if (!vendor) {
        return (
            <div style={overlayStyle} onClick={onClose}>
                <div style={{ ...panelStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ color: colors.text.faint }}>Vendor not found</p>
                </div>
            </div>
        );
    }

    const tierCfg = TIER_CONFIG[(vendor.subscription_tier || 'free') as keyof typeof TIER_CONFIG] || TIER_CONFIG.free;

    return (
        <div style={overlayStyle}>
            <div 
                style={panelStyle} 
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="vendor-modal-title"
            >
                {/* Header */}
                <div style={{
                    padding: '20px 24px', borderBottom: `1px solid ${colors.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: `linear-gradient(135deg, ${colors.cardAlt} 0%, ${colors.bg} 100%)`,
                    position: 'sticky', top: 0, zIndex: 10,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '14px',
                            background: colors.card, border: `2px solid ${colors.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden', flexShrink: 0,
                        }}>
                            {vendor.company_logo ? (
                                <img src={vendor.company_logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <Store size={24} style={{ color: colors.text.faint }} />
                            )}
                        </div>
                        <div>
                            <h2 id="vendor-modal-title" style={{ fontSize: '18px', fontWeight: 700, color: colors.text.primary, margin: 0 }}>
                                {vendor.business_name}
                            </h2>
                            <div style={{ fontSize: '13px', color: colors.text.muted, display: 'flex', gap: '12px', marginTop: '4px' }}>
                                <span>{vendor.email}</span>
                                <span style={{
                                    padding: '2px 8px', borderRadius: '6px', fontSize: '11px',
                                    fontWeight: 700, background: tierCfg.bg, color: tierCfg.color,
                                }}>
                                    {tierCfg.label}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                            onClick={handleImpersonate}
                            disabled={impersonating}
                            style={{
                                ...btnPrimary, background: '#1e293b',
                                fontSize: '12px', padding: '8px 14px',
                                opacity: impersonating ? 0.6 : 1,
                            }}
                        >
                            {impersonating ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                            Login As
                        </button>
                        {vendor.slug && (
                            <a
                                href={`/en/vendors/${vendor.slug}`}
                                target="_blank"
                                style={{ ...btnGhost, textDecoration: 'none' }}
                            >
                                <Eye size={14} /> View
                            </a>
                        )}
                        <button
                            onClick={onClose}
                            style={{
                                padding: '8px', borderRadius: '8px', border: 'none',
                                background: 'transparent', cursor: 'pointer', color: colors.text.faint,
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex', borderBottom: `1px solid ${colors.border}`,
                    padding: '0 24px', background: colors.card,
                    position: 'sticky', top: '97px', zIndex: 10,
                }}>
                    {TABS.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={tabStyle(activeTab === tab)}>
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Save message */}
                {saveMsg && (
                    <div style={{
                        padding: '10px 24px',
                        background: saveMsg.includes('Error') ? colors.danger.bg : colors.success.bg,
                        color: saveMsg.includes('Error') ? colors.danger.text : colors.success.text,
                        fontSize: '13px', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                        {saveMsg.includes('Error') ? <XCircle size={16} /> : <CheckCircle size={16} />}
                        {saveMsg}
                    </div>
                )}

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <VendorOverviewTab
                        editData={editData}
                        vendor={vendor}
                        updateField={updateField}
                        onSave={handleSave}
                        saving={saving}
                    />
                )}
                {activeTab === 'subscription' && (
                    <VendorSubscriptionTab
                        editData={editData}
                        vendor={vendor}
                        updateField={updateField}
                        onSave={handleSubscriptionSave}
                        saving={saving}
                    />
                )}
                {activeTab === 'status' && (
                    <VendorStatusTab vendor={vendor} />
                )}
                {activeTab === 'banking' && (
                    <VendorBankingTab
                        editData={editData}
                        vendor={vendor}
                        updateField={updateField}
                        onSave={handleSave}
                        saving={saving}
                    />
                )}
                {activeTab === 'policies' && (
                    <VendorPoliciesTab
                        editData={editData}
                        updateField={updateField}
                        onSave={handleSave}
                        saving={saving}
                    />
                )}
            </div>
        </div>
    );
}

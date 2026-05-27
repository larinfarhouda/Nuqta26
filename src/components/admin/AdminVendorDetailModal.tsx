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
import { AdminButton } from './ui/AdminButton';
import { AdminBadge } from './ui/AdminBadge';

// Tab components
import VendorOverviewTab from './vendor-tabs/VendorOverviewTab';
import VendorSubscriptionTab from './vendor-tabs/VendorSubscriptionTab';
import VendorStatusTab from './vendor-tabs/VendorStatusTab';
import VendorBankingTab from './vendor-tabs/VendorBankingTab';
import VendorPoliciesTab from './vendor-tabs/VendorPoliciesTab';

const TABS = ['overview', 'subscription', 'status', 'banking', 'policies'] as const;
type Tab = typeof TABS[number];

const TIER_CONFIG: Record<string, { label: string; variant: 'neutral' | 'accent' | 'warning' }> = {
    free: { label: 'Free', variant: 'neutral' },
    starter: { label: 'Free', variant: 'neutral' },
    pro: { label: 'Pro', variant: 'accent' },
    growth: { label: 'Pro', variant: 'accent' },
    business: { label: 'Business', variant: 'warning' },
    professional: { label: 'Business', variant: 'warning' },
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
            <div className="fixed inset-0 z-50 flex justify-end bg-zinc-900/60 backdrop-blur-sm" onClick={onClose}>
                <div className="w-[640px] max-w-full h-screen bg-white dark:bg-zinc-900 overflow-y-auto shadow-[-4px_0_24px_rgba(0,0,0,0.12)] flex items-center justify-center">
                    <Loader2 size={32} className="animate-spin text-[#2CA58D]" />
                </div>
            </div>
        );
    }

    if (!vendor) {
        return (
            <div className="fixed inset-0 z-50 flex justify-end bg-zinc-900/60 backdrop-blur-sm" onClick={onClose}>
                <div className="w-[640px] max-w-full h-screen bg-white dark:bg-zinc-900 overflow-y-auto shadow-[-4px_0_24px_rgba(0,0,0,0.12)] flex items-center justify-center">
                    <p className="text-zinc-400 dark:text-zinc-500">Vendor not found</p>
                </div>
            </div>
        );
    }

    const tierCfg = TIER_CONFIG[(vendor.subscription_tier || 'free') as keyof typeof TIER_CONFIG] || TIER_CONFIG.free;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-zinc-900/60 backdrop-blur-sm">
            <div
                className="w-[640px] max-w-full h-screen bg-white dark:bg-zinc-900 overflow-y-auto shadow-[-4px_0_24px_rgba(0,0,0,0.12)]"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="vendor-modal-title"
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-800/50 dark:to-zinc-900 sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                            {vendor.company_logo ? (
                                <img src={vendor.company_logo} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <Store size={24} className="text-zinc-400 dark:text-zinc-500" />
                            )}
                        </div>
                        <div>
                            <h2 id="vendor-modal-title" className="text-lg font-bold text-zinc-900 dark:text-white m-0">
                                {vendor.business_name}
                            </h2>
                            <div className="text-[13px] text-zinc-500 dark:text-zinc-400 flex items-center gap-3 mt-1">
                                <span>{vendor.email}</span>
                                <AdminBadge variant={tierCfg.variant}>
                                    {tierCfg.label}
                                </AdminBadge>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 items-center">
                        <AdminButton
                            onClick={handleImpersonate}
                            disabled={impersonating}
                            size="sm"
                            className="bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white text-xs px-3.5"
                        >
                            {impersonating ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                            Login As
                        </AdminButton>
                        {vendor.slug && (
                            <a
                                href={`/en/vendors/${vendor.slug}`}
                                target="_blank"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-xs font-semibold no-underline hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                            >
                                <Eye size={14} /> View
                            </a>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg border-none bg-transparent cursor-pointer text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-6 bg-white dark:bg-zinc-900 sticky top-[97px] z-10">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-3 text-[13px] capitalize bg-transparent cursor-pointer border-t-0 border-l-0 border-r-0 transition-all duration-200 ${
                                activeTab === tab
                                    ? 'font-semibold text-[#2CA58D] border-b-2 border-b-[#2CA58D]'
                                    : 'font-normal text-zinc-500 dark:text-zinc-400 border-b-2 border-b-transparent hover:text-zinc-700 dark:hover:text-zinc-300'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Save message */}
                {saveMsg && (
                    <div className={`px-6 py-2.5 text-[13px] font-semibold flex items-center gap-2 ${
                        saveMsg.includes('Error')
                            ? 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400'
                    }`}>
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

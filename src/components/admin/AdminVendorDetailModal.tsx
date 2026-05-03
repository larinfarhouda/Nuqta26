'use client';

import { useState, useEffect } from 'react';
import {
    X, Store, Globe, Phone, Instagram, MapPin, CreditCard,
    Shield, Crown, Zap, Star, ExternalLink, LogIn, Loader2,
    Calendar, Mail, CheckCircle, XCircle, Eye, Save, Building
} from 'lucide-react';
import {
    getVendorFullDetails,
    updateVendorSubscription,
    updateVendorDetails,
    impersonateVendor,
} from '@/actions/admin';
import type { AdminVendorDetail } from '@/types/admin.types';

const TABS = ['overview', 'subscription', 'status', 'banking', 'policies'] as const;
type Tab = typeof TABS[number];

const TIER_CONFIG = {
    starter: { label: 'Starter', color: '#64748b', bg: '#f1f5f9', icon: Zap },
    growth: { label: 'Growth', color: '#7c3aed', bg: '#ede9fe', icon: Star },
    professional: { label: 'Professional', color: '#d97706', bg: '#fef3c7', icon: Crown },
};

const CATEGORIES = [
    'workshops', 'concerts', 'conferences', 'exhibitions', 'festivals',
    'sports', 'theater', 'comedy', 'food', 'networking', 'education', 'other',
];

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
            editData.subscription_tier || 'starter',
            editData.is_founder_pricing || false,
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

    // ─── Styles ──────────────────────────────────────────────────────────────
    const overlay: React.CSSProperties = {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
        display: 'flex', justifyContent: 'flex-end',
    };
    const panel: React.CSSProperties = {
        width: '640px', maxWidth: '100vw', height: '100vh', background: '#fff',
        overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
    };
    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '10px 14px', borderRadius: '10px',
        border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none',
        transition: 'border-color 0.2s',
    };
    const labelStyle: React.CSSProperties = {
        fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px',
        display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em',
    };
    const sectionStyle: React.CSSProperties = {
        padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
    };

    if (loading) {
        return (
            <div style={overlay} onClick={onClose}>
                <div style={{ ...panel, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 size={32} className="animate-spin" style={{ color: '#8b5cf6' }} />
                </div>
            </div>
        );
    }

    if (!vendor) {
        return (
            <div style={overlay} onClick={onClose}>
                <div style={{ ...panel, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ color: '#94a3b8' }}>Vendor not found</p>
                </div>
            </div>
        );
    }

    const tierCfg = TIER_CONFIG[(vendor.subscription_tier || 'starter') as keyof typeof TIER_CONFIG] || TIER_CONFIG.starter;

    return (
        <div style={overlay}>
            <div style={panel} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    position: 'sticky', top: 0, zIndex: 10,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '14px',
                            background: '#fff', border: '2px solid #e2e8f0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden', flexShrink: 0,
                        }}>
                            {vendor.company_logo ? (
                                <img src={vendor.company_logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <Store size={24} style={{ color: '#94a3b8' }} />
                            )}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                {vendor.business_name}
                            </h2>
                            <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', gap: '12px', marginTop: '4px' }}>
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
                        {/* Login As Button */}
                        <button
                            onClick={handleImpersonate}
                            disabled={impersonating}
                            style={{
                                padding: '8px 14px', borderRadius: '10px', border: 'none',
                                background: '#1e293b', color: '#fff', fontSize: '12px',
                                fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                opacity: impersonating ? 0.6 : 1,
                            }}
                        >
                            {impersonating ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                            Login As
                        </button>
                        {/* View Profile */}
                        {vendor.slug && (
                            <a
                                href={`/en/vendors/${vendor.slug}`}
                                target="_blank"
                                style={{
                                    padding: '8px 14px', borderRadius: '10px', border: '1px solid #e2e8f0',
                                    background: '#fff', color: '#475569', fontSize: '12px',
                                    fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                    textDecoration: 'none',
                                }}
                            >
                                <Eye size={14} /> View
                            </a>
                        )}
                        <button
                            onClick={onClose}
                            style={{
                                padding: '8px', borderRadius: '8px', border: 'none',
                                background: 'transparent', cursor: 'pointer', color: '#94a3b8',
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex', borderBottom: '1px solid #e2e8f0',
                    padding: '0 24px', background: '#fff', position: 'sticky', top: '97px', zIndex: 10,
                }}>
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '12px 16px', fontSize: '13px', fontWeight: 600,
                                color: activeTab === tab ? '#8b5cf6' : '#64748b',
                                background: 'none', cursor: 'pointer',
                                borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                                borderBottom: activeTab === tab ? '2px solid #8b5cf6' : '2px solid transparent',
                                textTransform: 'capitalize', transition: 'all 0.2s',
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Save message */}
                {saveMsg && (
                    <div style={{
                        padding: '10px 24px', background: saveMsg.includes('Error') ? '#fef2f2' : '#f0fdf4',
                        color: saveMsg.includes('Error') ? '#991b1b' : '#166534',
                        fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                        {saveMsg.includes('Error') ? <XCircle size={16} /> : <CheckCircle size={16} />}
                        {saveMsg}
                    </div>
                )}

                {/* ─── Overview Tab ─── */}
                {activeTab === 'overview' && (
                    <div>
                        <div style={sectionStyle}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>Business Information</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={labelStyle}>Business Name</label>
                                    <input style={inputStyle} value={editData.business_name || ''} onChange={e => updateField('business_name', e.target.value)} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Category</label>
                                    <select style={inputStyle} value={editData.category || ''} onChange={e => updateField('category', e.target.value)}>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Slug</label>
                                    <input style={inputStyle} value={editData.slug || ''} onChange={e => updateField('slug', e.target.value)} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Country</label>
                                    <input style={inputStyle} value={editData.country || ''} onChange={e => updateField('country', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <div style={sectionStyle}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>Contact & Social</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={labelStyle}><Phone size={12} style={{ display: 'inline', marginRight: '4px' }} />WhatsApp</label>
                                    <input style={inputStyle} value={editData.whatsapp_number || ''} onChange={e => updateField('whatsapp_number', e.target.value)} />
                                </div>
                                <div>
                                    <label style={labelStyle}><Globe size={12} style={{ display: 'inline', marginRight: '4px' }} />Website</label>
                                    <input style={inputStyle} value={editData.website || ''} onChange={e => updateField('website', e.target.value)} />
                                </div>
                                <div>
                                    <label style={labelStyle}><Instagram size={12} style={{ display: 'inline', marginRight: '4px' }} />Instagram</label>
                                    <input style={inputStyle} value={editData.instagram || ''} onChange={e => updateField('instagram', e.target.value)} />
                                </div>
                                <div>
                                    <label style={labelStyle}><Mail size={12} style={{ display: 'inline', marginRight: '4px' }} />Email (read-only)</label>
                                    <input style={{ ...inputStyle, background: '#f8fafc' }} value={vendor.email || ''} disabled />
                                </div>
                            </div>
                        </div>

                        <div style={sectionStyle}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>Location</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={labelStyle}>Location Name</label>
                                    <input style={inputStyle} value={editData.location_name || ''} onChange={e => updateField('location_name', e.target.value)} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Location Details</label>
                                    <input style={inputStyle} value={editData.location_details || ''} onChange={e => updateField('location_details', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <div style={sectionStyle}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>Arabic Description</h3>
                            <textarea
                                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                                value={editData.description_ar || ''}
                                onChange={e => updateField('description_ar', e.target.value)}
                            />
                        </div>

                        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => handleSave({
                                    business_name: editData.business_name,
                                    category: editData.category,
                                    slug: editData.slug,
                                    country: editData.country,
                                    whatsapp_number: editData.whatsapp_number,
                                    website: editData.website,
                                    instagram: editData.instagram,
                                    location_name: editData.location_name,
                                    location_details: editData.location_details,
                                    description_ar: editData.description_ar,
                                })}
                                disabled={saving}
                                style={{
                                    padding: '10px 20px', borderRadius: '10px', border: 'none',
                                    background: '#8b5cf6', color: '#fff', fontSize: '13px',
                                    fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                                    opacity: saving ? 0.6 : 1,
                                }}
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── Subscription Tab ─── */}
                {activeTab === 'subscription' && (
                    <div>
                        <div style={sectionStyle}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>Current Plan</h3>
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
                                                border: `2px solid ${isSelected ? cfg.color : '#e2e8f0'}`,
                                                background: isSelected ? cfg.bg : '#fff',
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
                                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Founder Pricing</h3>
                                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Lock in special pricing for early adopters</p>
                                </div>
                                <button
                                    onClick={() => updateField('is_founder_pricing', !editData.is_founder_pricing)}
                                    style={{
                                        width: '48px', height: '28px', borderRadius: '14px',
                                        background: editData.is_founder_pricing ? '#8b5cf6' : '#e2e8f0',
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
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>Subscription Dates</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={labelStyle}>Started At</label>
                                    <div style={{ ...inputStyle, background: '#f8fafc', color: '#64748b' }}>
                                        {vendor.subscription_starts_at ? new Date(vendor.subscription_starts_at).toLocaleDateString() : 'Not set'}
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>Expires At</label>
                                    <div style={{ ...inputStyle, background: '#f8fafc', color: '#64748b' }}>
                                        {vendor.subscription_expires_at ? new Date(vendor.subscription_expires_at).toLocaleDateString() : 'Never (Admin Override)'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleSubscriptionSave}
                                disabled={saving}
                                style={{
                                    padding: '10px 20px', borderRadius: '10px', border: 'none',
                                    background: '#8b5cf6', color: '#fff', fontSize: '13px',
                                    fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                                    opacity: saving ? 0.6 : 1,
                                }}
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Update Subscription
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── Status Tab ─── */}
                {activeTab === 'status' && (
                    <div>
                        <div style={sectionStyle}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>Account Status</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div style={{
                                    padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0',
                                    textAlign: 'center',
                                }}>
                                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>STATUS</div>
                                    <span style={{
                                        padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                                        background: vendor.status === 'approved' ? '#dcfce7' : vendor.status === 'suspended' ? '#fecaca' : '#fef9c3',
                                        color: vendor.status === 'approved' ? '#166534' : vendor.status === 'suspended' ? '#991b1b' : '#854d0e',
                                    }}>
                                        {vendor.status || 'pending'}
                                    </span>
                                </div>
                                <div style={{
                                    padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0',
                                    textAlign: 'center',
                                }}>
                                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>VERIFIED</div>
                                    <span style={{
                                        padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                                        background: vendor.is_verified ? '#dcfce7' : '#fecaca',
                                        color: vendor.is_verified ? '#166534' : '#991b1b',
                                    }}>
                                        {vendor.is_verified ? 'Yes' : 'No'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div style={{
                                    padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0',
                                    textAlign: 'center',
                                }}>
                                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>EVENTS</div>
                                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{vendor.eventCount}</div>
                                </div>
                                <div style={{
                                    padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0',
                                    textAlign: 'center',
                                }}>
                                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>BOOKINGS</div>
                                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{vendor.bookingCount}</div>
                                </div>
                            </div>

                            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
                                <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                Joined: {vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : 'Unknown'}
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Banking Tab ─── */}
                {activeTab === 'banking' && (
                    <div>
                        <div style={sectionStyle}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
                                <Building size={16} style={{ display: 'inline', marginRight: '6px' }} />
                                Bank Details
                            </h3>
                            <div style={{ display: 'grid', gap: '16px' }}>
                                <div>
                                    <label style={labelStyle}>Bank Name</label>
                                    <input style={inputStyle} value={editData.bank_name || ''} onChange={e => updateField('bank_name', e.target.value)} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Account Holder Name</label>
                                    <input style={inputStyle} value={editData.bank_account_name || ''} onChange={e => updateField('bank_account_name', e.target.value)} />
                                </div>
                                <div>
                                    <label style={labelStyle}>IBAN</label>
                                    <input style={inputStyle} value={editData.bank_iban || ''} onChange={e => updateField('bank_iban', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {vendor.tax_id_document && (
                            <div style={sectionStyle}>
                                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>Tax ID Document</h3>
                                <a href={vendor.tax_id_document} target="_blank" style={{
                                    display: 'flex', alignItems: 'center', gap: '8px', color: '#8b5cf6',
                                    fontSize: '13px', fontWeight: 500,
                                }}>
                                    <ExternalLink size={14} /> View Document
                                </a>
                            </div>
                        )}

                        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => handleSave({
                                    bank_name: editData.bank_name,
                                    bank_account_name: editData.bank_account_name,
                                    bank_iban: editData.bank_iban,
                                })}
                                disabled={saving}
                                style={{
                                    padding: '10px 20px', borderRadius: '10px', border: 'none',
                                    background: '#8b5cf6', color: '#fff', fontSize: '13px',
                                    fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                                    opacity: saving ? 0.6 : 1,
                                }}
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Save Banking
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── Policies Tab ─── */}
                {activeTab === 'policies' && (
                    <div>
                        <div style={sectionStyle}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>Cancellation Policy</h3>
                            <textarea
                                style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                                value={editData.cancellation_policy || ''}
                                onChange={e => updateField('cancellation_policy', e.target.value)}
                            />
                        </div>
                        <div style={sectionStyle}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>Return Policy</h3>
                            <textarea
                                style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                                value={editData.return_policy || ''}
                                onChange={e => updateField('return_policy', e.target.value)}
                            />
                        </div>
                        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => handleSave({
                                    cancellation_policy: editData.cancellation_policy,
                                    return_policy: editData.return_policy,
                                })}
                                disabled={saving}
                                style={{
                                    padding: '10px 20px', borderRadius: '10px', border: 'none',
                                    background: '#8b5cf6', color: '#fff', fontSize: '13px',
                                    fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                                    opacity: saving ? 0.6 : 1,
                                }}
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Save Policies
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

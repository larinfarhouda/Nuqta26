'use client';

import { useState, useTransition } from 'react';
import {
    Globe, MapPin, Building, CreditCard, ChevronRight, Plus, Trash2,
    Check, X, Loader2, ToggleLeft, ToggleRight, ArrowLeft, Edit2, DollarSign
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { getCountryFlag } from '@/utils/country-helpers';
import {
    getAdminCountryConfig, saveCountry, toggleCountryActive,
    addCity, updateCity, removeCity,
    addBank, updateBankAction, removeBank,
    addPaymentMethod, updatePaymentMethodAction, removePaymentMethod,
} from '@/actions/admin/countries';
import type { Country, City, Bank, PaymentMethod } from '@/repositories/country.repository';

// ─── Types ──────────────────────────────────────────────────────────────────

interface CountryConfig extends Country {
    cities: City[];
    banks: Bank[];
    paymentMethods: PaymentMethod[];
}

type Tab = 'general' | 'cities' | 'banks' | 'payments' | 'pricing';

// ─── Styles ─────────────────────────────────────────────────────────────────

const card = {
    background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' as const,
};
const input = {
    padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0',
    fontSize: '14px', outline: 'none', width: '100%',
};
const btnPrimary = {
    padding: '10px 20px', borderRadius: '10px', border: 'none',
    background: '#8b5cf6', color: '#fff', fontSize: '13px',
    fontWeight: 600 as const, cursor: 'pointer', display: 'flex' as const,
    alignItems: 'center' as const, gap: '6px',
};
const btnDanger = {
    padding: '6px 10px', borderRadius: '8px', border: 'none',
    background: '#fecaca', color: '#991b1b', fontSize: '12px',
    fontWeight: 600 as const, cursor: 'pointer',
};
const badge = (active: boolean) => ({
    padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 as const,
    background: active ? '#dcfce7' : '#fecaca',
    color: active ? '#166534' : '#991b1b',
});

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AdminCountriesClient({
    initialCountries,
}: {
    initialCountries: Country[];
}) {
    const [countries, setCountries] = useState(initialCountries);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [config, setConfig] = useState<CountryConfig | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const loadConfig = (countryId: string) => {
        setSelectedId(countryId);
        setActiveTab('general');
        startTransition(async () => {
            const data = await getAdminCountryConfig(countryId);
            setConfig(data as CountryConfig);
        });
    };

    const reloadConfig = () => {
        if (selectedId) {
            startTransition(async () => {
                const data = await getAdminCountryConfig(selectedId);
                setConfig(data as CountryConfig);
            });
        }
    };

    const handleToggleActive = async (countryId: string, currentState: boolean) => {
        const result = await toggleCountryActive(countryId, !currentState);
        if (result.success) {
            setCountries(prev => prev.map(c => c.id === countryId ? { ...c, is_active: !currentState } : c));
            toast('success', `Country ${!currentState ? 'activated' : 'deactivated'}`);
        } else { toast('error', result.error || 'Failed'); }
    };

    // ─── Country List View ──────────────────────────────────────────────────

    if (!selectedId) {
        return (
            <div style={{ maxWidth: '1000px' }}>
                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a' }}>Countries</h1>
                        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Manage countries, currencies, banks, and payment methods</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '12px' }}>
                    {countries.map(c => (
                        <div key={c.id} style={{ ...card, padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
                            onClick={() => loadConfig(c.id)}>
                            <div style={{ fontSize: '32px' }}>{getCountryFlag(c.id)}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '16px', color: '#0f172a' }}>{c.name_en}</div>
                                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                                    {c.name_ar} · {c.currency_symbol} {c.currency_code} · {c.phone_code}
                                </div>
                            </div>
                            <span style={badge(c.is_active)}>{c.is_active ? 'Active' : 'Inactive'}</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleToggleActive(c.id, c.is_active); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.is_active ? '#22c55e' : '#94a3b8' }}>
                                {c.is_active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                            </button>
                            <ChevronRight size={20} style={{ color: '#94a3b8' }} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ─── Country Detail View ────────────────────────────────────────────────

    if (!config) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Loader2 size={32} className="animate-spin" style={{ color: '#8b5cf6' }} /></div>;
    }

    const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
        { id: 'general', label: 'General', icon: Globe },
        { id: 'cities', label: `Cities (${config.cities.length})`, icon: MapPin },
        { id: 'banks', label: `Banks (${config.banks.length})`, icon: Building },
        { id: 'payments', label: `Payment Methods (${config.paymentMethods.length})`, icon: CreditCard },
        { id: 'pricing', label: 'Pricing', icon: DollarSign },
    ];

    return (
        <div style={{ maxWidth: '1000px' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button onClick={() => { setSelectedId(null); setConfig(null); }}
                    style={{ background: '#f1f5f9', border: 'none', borderRadius: '10px', padding: '10px', cursor: 'pointer', display: 'flex' }}>
                    <ArrowLeft size={20} style={{ color: '#475569' }} />
                </button>
                <div style={{ fontSize: '32px' }}>{getCountryFlag(config.id)}</div>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>{config.name_en}</h1>
                    <p style={{ color: '#64748b', fontSize: '13px' }}>{config.name_ar} · {config.currency_symbol} {config.currency_code}</p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '0' }}>
                {tabs.map(t => {
                    const Icon = t.icon;
                    const active = activeTab === t.id;
                    return (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                            padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
                            fontSize: '13px', fontWeight: active ? 600 : 400, color: active ? '#8b5cf6' : '#64748b',
                            borderBottom: active ? '2px solid #8b5cf6' : '2px solid transparent',
                            display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '-1px',
                        }}>
                            <Icon size={16} />{t.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div style={card}>
                {activeTab === 'general' && <GeneralTab config={config} onSave={reloadConfig} />}
                {activeTab === 'cities' && <CitiesTab cities={config.cities} countryId={config.id} onReload={reloadConfig} />}
                {activeTab === 'banks' && <BanksTab banks={config.banks} countryId={config.id} onReload={reloadConfig} />}
                {activeTab === 'payments' && <PaymentMethodsTab methods={config.paymentMethods} countryId={config.id} onReload={reloadConfig} />}
                {activeTab === 'pricing' && <PricingTab config={config} onSave={reloadConfig} />}
            </div>
        </div>
    );
}

// ─── General Tab ────────────────────────────────────────────────────────────

function GeneralTab({ config, onSave }: { config: CountryConfig; onSave: () => void }) {
    const [form, setForm] = useState({
        name_en: config.name_en, name_ar: config.name_ar,
        currency_code: config.currency_code, currency_symbol: config.currency_symbol,
        currency_name_ar: config.currency_name_ar,
        phone_code: config.phone_code, phone_placeholder: config.phone_placeholder,
        iban_regex: config.iban_regex || '', iban_placeholder: config.iban_placeholder || '',
        timezone: config.timezone,
    });
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    const handleSave = async () => {
        setSaving(true);
        const result = await saveCountry({ id: config.id, ...form });
        setSaving(false);
        if (result.success) { toast('success', 'Country updated'); onSave(); }
        else toast('error', result.error || 'Failed');
    };

    const Field = ({ label, field, dir }: { label: string; field: keyof typeof form; dir?: string }) => (
        <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'block' }}>{label}</label>
            <input style={input} dir={dir} value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} />
        </div>
    );

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Field label="Name (English)" field="name_en" />
                <Field label="Name (Arabic)" field="name_ar" dir="rtl" />
                <Field label="Currency Code" field="currency_code" />
                <Field label="Currency Symbol" field="currency_symbol" />
                <Field label="Currency Name (Arabic)" field="currency_name_ar" dir="rtl" />
                <Field label="Phone Code" field="phone_code" />
                <Field label="Phone Placeholder" field="phone_placeholder" />
                <Field label="Timezone" field="timezone" />
                <Field label="IBAN Regex" field="iban_regex" />
                <Field label="IBAN Placeholder" field="iban_placeholder" />
            </div>
            <button onClick={handleSave} disabled={saving} style={btnPrimary}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Save Changes
            </button>
        </div>
    );
}

// ─── Cities Tab ─────────────────────────────────────────────────────────────

function CitiesTab({ cities, countryId, onReload }: { cities: City[]; countryId: string; onReload: () => void }) {
    const [adding, setAdding] = useState(false);
    const [newId, setNewId] = useState('');
    const [newEn, setNewEn] = useState('');
    const [newAr, setNewAr] = useState('');
    const [pending, setPending] = useState<string | null>(null);
    const { toast } = useToast();

    const handleAdd = async () => {
        if (!newId || !newEn || !newAr) return;
        setPending('add');
        const result = await addCity(countryId, newId, newEn, newAr);
        setPending(null);
        if (result.success) { toast('success', 'City added'); setAdding(false); setNewId(''); setNewEn(''); setNewAr(''); onReload(); }
        else toast('error', result.error || 'Failed');
    };

    const handleRemove = async (cityId: string) => {
        if (!confirm('Delete this city?')) return;
        setPending(cityId);
        const result = await removeCity(cityId);
        setPending(null);
        if (result.success) { toast('success', 'City removed'); onReload(); }
        else toast('error', result.error || 'Failed');
    };

    const handleToggle = async (cityId: string, active: boolean) => {
        const result = await updateCity(cityId, { is_active: !active });
        if (result.success) { toast('success', `City ${!active ? 'activated' : 'deactivated'}`); onReload(); }
        else toast('error', result.error || 'Failed');
    };

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Cities</h3>
                <button onClick={() => setAdding(!adding)} style={btnPrimary}><Plus size={14} /> Add City</button>
            </div>

            {adding && (
                <div style={{ ...card, padding: '16px', marginBottom: '16px', background: '#f8fafc' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <input style={input} placeholder="ID (e.g. cairo)" value={newId} onChange={e => setNewId(e.target.value)} />
                        <input style={input} placeholder="Name English" value={newEn} onChange={e => setNewEn(e.target.value)} />
                        <input style={input} placeholder="Name Arabic" dir="rtl" value={newAr} onChange={e => setNewAr(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={handleAdd} disabled={pending === 'add'} style={btnPrimary}>
                            {pending === 'add' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
                        </button>
                        <button onClick={() => setAdding(false)} style={{ ...btnDanger, background: '#f1f5f9', color: '#475569' }}><X size={14} /> Cancel</button>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gap: '8px' }}>
                {cities.map(c => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '10px', background: '#f8fafc' }}>
                        <MapPin size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 500, fontSize: '14px', color: '#0f172a' }}>{c.name_en}</span>
                            <span style={{ color: '#94a3b8', margin: '0 8px' }}>·</span>
                            <span style={{ fontSize: '14px', color: '#475569' }}>{c.name_ar}</span>
                            <span style={{ color: '#94a3b8', margin: '0 8px' }}>·</span>
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{c.id}</span>
                        </div>
                        <button onClick={() => handleToggle(c.id, c.is_active)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.is_active ? '#22c55e' : '#94a3b8' }}>
                            {c.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                        </button>
                        <button onClick={() => handleRemove(c.id)} disabled={pending === c.id} style={btnDanger}>
                            {pending === c.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        </button>
                    </div>
                ))}
                {cities.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center', padding: '24px' }}>No cities yet. Add one above.</p>}
            </div>
        </div>
    );
}

// ─── Banks Tab ──────────────────────────────────────────────────────────────

function BanksTab({ banks, countryId, onReload }: { banks: Bank[]; countryId: string; onReload: () => void }) {
    const [adding, setAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [pending, setPending] = useState<string | null>(null);
    const { toast } = useToast();

    const handleAdd = async () => {
        if (!newName) return;
        setPending('add');
        const result = await addBank(countryId, newName);
        setPending(null);
        if (result.success) { toast('success', 'Bank added'); setAdding(false); setNewName(''); onReload(); }
        else toast('error', result.error || 'Failed');
    };

    const handleRemove = async (bankId: string) => {
        if (!confirm('Delete this bank?')) return;
        setPending(bankId);
        const result = await removeBank(bankId);
        setPending(null);
        if (result.success) { toast('success', 'Bank removed'); onReload(); }
        else toast('error', result.error || 'Failed');
    };

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Banks</h3>
                <button onClick={() => setAdding(!adding)} style={btnPrimary}><Plus size={14} /> Add Bank</button>
            </div>

            {adding && (
                <div style={{ ...card, padding: '16px', marginBottom: '16px', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input style={{ ...input, flex: 1 }} placeholder="Bank name" value={newName} onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()} />
                        <button onClick={handleAdd} disabled={pending === 'add'} style={btnPrimary}>
                            {pending === 'add' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Add
                        </button>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gap: '6px' }}>
                {banks.map(b => (
                    <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderRadius: '10px', background: '#f8fafc' }}>
                        <Building size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />
                        <span style={{ flex: 1, fontWeight: 500, fontSize: '14px', color: '#0f172a' }}>{b.name}</span>
                        <button onClick={() => handleRemove(b.id)} disabled={pending === b.id} style={btnDanger}>
                            {pending === b.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        </button>
                    </div>
                ))}
                {banks.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center', padding: '24px' }}>No banks yet.</p>}
            </div>
        </div>
    );
}

// ─── Payment Methods Tab ────────────────────────────────────────────────────

function PaymentMethodsTab({ methods, countryId, onReload }: { methods: PaymentMethod[]; countryId: string; onReload: () => void }) {
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({
        method_type: 'bank_transfer', label_en: '', label_ar: '',
        description_en: '', description_ar: '', icon: 'building',
        required_fields: '' // comma-separated
    });
    const [pending, setPending] = useState<string | null>(null);
    const { toast } = useToast();

    const typeOptions = [
        { value: 'bank_transfer', label: 'Bank Transfer', icon: 'building' },
        { value: 'mobile_wallet', label: 'Mobile Wallet', icon: 'smartphone' },
        { value: 'payment_link', label: 'Payment Link', icon: 'link' },
    ];

    const handleAdd = async () => {
        if (!form.label_en || !form.label_ar) return;
        setPending('add');
        const result = await addPaymentMethod({
            country_id: countryId,
            method_type: form.method_type,
            label_en: form.label_en, label_ar: form.label_ar,
            description_en: form.description_en || undefined,
            description_ar: form.description_ar || undefined,
            icon: form.icon,
            required_fields: form.required_fields.split(',').map(s => s.trim()).filter(Boolean),
        });
        setPending(null);
        if (result.success) {
            toast('success', 'Payment method added'); setAdding(false);
            setForm({ method_type: 'bank_transfer', label_en: '', label_ar: '', description_en: '', description_ar: '', icon: 'building', required_fields: '' });
            onReload();
        } else toast('error', result.error || 'Failed');
    };

    const handleRemove = async (pmId: string) => {
        if (!confirm('Delete this payment method? Vendors using it will lose access.')) return;
        setPending(pmId);
        const result = await removePaymentMethod(pmId);
        setPending(null);
        if (result.success) { toast('success', 'Payment method removed'); onReload(); }
        else toast('error', result.error || 'Failed');
    };

    const iconMap: Record<string, string> = { building: '🏦', smartphone: '📱', link: '🔗' };

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Payment Methods</h3>
                <button onClick={() => setAdding(!adding)} style={btnPrimary}><Plus size={14} /> Add Method</button>
            </div>

            {adding && (
                <div style={{ ...card, padding: '16px', marginBottom: '16px', background: '#f8fafc' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px', display: 'block' }}>Type</label>
                            <select style={input} value={form.method_type} onChange={e => {
                                const opt = typeOptions.find(o => o.value === e.target.value);
                                setForm(p => ({ ...p, method_type: e.target.value, icon: opt?.icon || 'building' }));
                            }}>
                                {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px', display: 'block' }}>Icon</label>
                            <input style={input} value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px', display: 'block' }}>Label (English)</label>
                            <input style={input} value={form.label_en} onChange={e => setForm(p => ({ ...p, label_en: e.target.value }))} />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px', display: 'block' }}>Label (Arabic)</label>
                            <input style={input} dir="rtl" value={form.label_ar} onChange={e => setForm(p => ({ ...p, label_ar: e.target.value }))} />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px', display: 'block' }}>Description (EN)</label>
                            <input style={input} value={form.description_en} onChange={e => setForm(p => ({ ...p, description_en: e.target.value }))} />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px', display: 'block' }}>Description (AR)</label>
                            <input style={input} dir="rtl" value={form.description_ar} onChange={e => setForm(p => ({ ...p, description_ar: e.target.value }))} />
                        </div>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px', display: 'block' }}>
                            Required Fields (comma-separated, e.g. bank_name, iban, account_holder)
                        </label>
                        <input style={input} placeholder="bank_name, iban, account_holder"
                            value={form.required_fields} onChange={e => setForm(p => ({ ...p, required_fields: e.target.value }))} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={handleAdd} disabled={pending === 'add'} style={btnPrimary}>
                            {pending === 'add' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
                        </button>
                        <button onClick={() => setAdding(false)} style={{ ...btnDanger, background: '#f1f5f9', color: '#475569' }}>Cancel</button>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gap: '10px' }}>
                {methods.map(m => (
                    <div key={m.id} style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '20px' }}>{iconMap[m.icon || 'building'] || '💳'}</span>
                            <div style={{ flex: 1 }}>
                                <span style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>{m.label_en}</span>
                                <span style={{ color: '#94a3b8', margin: '0 8px' }}>·</span>
                                <span style={{ fontSize: '14px', color: '#475569' }}>{m.label_ar}</span>
                            </div>
                            <span style={{ ...badge(true), background: '#ede9fe', color: '#7c3aed' }}>{m.method_type}</span>
                            <button onClick={() => handleRemove(m.id)} disabled={pending === m.id} style={btnDanger}>
                                {pending === m.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                            </button>
                        </div>
                        {m.description_en && <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>{m.description_en}</p>}
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                            Required fields: <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>
                                {Array.isArray(m.required_fields) ? m.required_fields.join(', ') : String(m.required_fields)}
                            </code>
                        </div>
                    </div>
                ))}
                {methods.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center', padding: '24px' }}>No payment methods yet.</p>}
            </div>
        </div>
    );
}

// ─── Pricing Tab ────────────────────────────────────────────────────────────

function PricingTab({ config, onSave }: { config: CountryConfig; onSave: () => void }) {
    const [form, setForm] = useState({
        subscription_pro_monthly_price: config.subscription_pro_monthly_price,
        subscription_business_monthly_price: config.subscription_business_monthly_price,
        subscription_pro_annual_price: config.subscription_pro_annual_price,
        subscription_business_annual_price: config.subscription_business_annual_price,
    });
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    const handleSave = async () => {
        setSaving(true);
        const result = await saveCountry({ id: config.id, ...form });
        setSaving(false);
        if (result.success) { toast('success', 'Pricing updated'); onSave(); }
        else toast('error', result.error || 'Failed');
    };

    const PriceField = ({ label, field }: { label: string; field: keyof typeof form }) => (
        <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'block' }}>{label}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input style={input} type="number" value={form[field]}
                    onChange={e => setForm(p => ({ ...p, [field]: Number(e.target.value) }))} />
                <span style={{ fontSize: '14px', color: '#64748b', whiteSpace: 'nowrap' as const }}>{config.currency_symbol}</span>
            </div>
        </div>
    );

    return (
        <div style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '20px' }}>Subscription Pricing</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#6d28d9', marginBottom: '16px' }}>Pro Tier</h4>
                    <PriceField label="Monthly Price" field="subscription_pro_monthly_price" />
                    <PriceField label="Annual Price" field="subscription_pro_annual_price" />
                </div>
                <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#6d28d9', marginBottom: '16px' }}>Business Tier</h4>
                    <PriceField label="Monthly Price" field="subscription_business_monthly_price" />
                    <PriceField label="Annual Price" field="subscription_business_annual_price" />
                </div>
            </div>

            <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, marginTop: '20px' }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Save Pricing
            </button>
        </div>
    );
}

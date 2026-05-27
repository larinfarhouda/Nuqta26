'use client';

import { useState, useTransition, useMemo } from 'react';
import {
    Globe, MapPin, Building, CreditCard, ChevronRight, Plus, Trash2,
    Check, X, Loader2, ToggleLeft, ToggleRight, ArrowLeft, DollarSign, Search
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { getCountryFlag } from '@/utils/country-helpers';
import {
    getAdminCountryConfig, saveCountry, toggleCountryActive,
    addCity, updateCity, removeCity,
    addBank, removeBank,
    addPaymentMethod, removePaymentMethod,
} from '@/actions/admin/countries';
import type { Country, City, Bank, PaymentMethod } from '@/repositories/country.repository';

// UI Components
import { AdminCard } from './ui/AdminCard';
import { AdminButton } from './ui/AdminButton';
import { AdminInput } from './ui/AdminInput';
import { AdminBadge } from './ui/AdminBadge';
import { AdminConfirmDialog } from './ui/AdminConfirmDialog';

interface CountryConfig extends Country {
    cities: City[];
    banks: Bank[];
    paymentMethods: PaymentMethod[];
}

type Tab = 'general' | 'cities' | 'banks' | 'payments' | 'pricing';

export default function AdminCountriesClient({ initialCountries }: { initialCountries: Country[] }) {
    const [countries, setCountries] = useState(initialCountries);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [config, setConfig] = useState<CountryConfig | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [searchQuery, setSearchQuery] = useState('');
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    // Confirm Dialog State
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDangerous?: boolean;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    const openConfirm = (title: string, message: string, onConfirm: () => void, isDangerous = false) => {
        setConfirmState({ isOpen: true, title, message, onConfirm, isDangerous });
    };
    const closeConfirm = () => setConfirmState(p => ({ ...p, isOpen: false }));

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

    const filteredCountries = useMemo(() => {
        if (!searchQuery) return countries;
        const q = searchQuery.toLowerCase();
        return countries.filter(c => 
            c.name_en.toLowerCase().includes(q) || 
            c.name_ar.includes(q) ||
            c.currency_code.toLowerCase().includes(q)
        );
    }, [countries, searchQuery]);

    // ─── Country List View ───
    if (!selectedId) {
        return (
            <div className="max-w-[1000px] pb-12">
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Countries</h1>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage countries, currencies, banks, and payment methods</p>
                    </div>
                    <div className="w-full sm:w-72">
                        <AdminInput 
                            placeholder="Search countries..." 
                            icon={<Search size={18} />} 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid gap-4">
                    {filteredCountries.map(c => (
                        <AdminCard 
                            key={c.id} 
                            hoverLift
                            className="flex items-center gap-4 cursor-pointer"
                            onClick={() => loadConfig(c.id)}
                        >
                            <div className="text-4xl">{getCountryFlag(c.id)}</div>
                            <div className="flex-1">
                                <div className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{c.name_en}</div>
                                <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    {c.name_ar} <span className="mx-2 text-zinc-300 dark:text-zinc-700">•</span> {c.currency_symbol} {c.currency_code} <span className="mx-2 text-zinc-300 dark:text-zinc-700">•</span> {c.phone_code}
                                </div>
                            </div>
                            <AdminBadge variant={c.is_active ? 'success' : 'danger'}>
                                {c.is_active ? 'Active' : 'Inactive'}
                            </AdminBadge>
                            <button
                                aria-label={c.is_active ? "Deactivate country" : "Activate country"}
                                onClick={(e) => { e.stopPropagation(); handleToggleActive(c.id, c.is_active); }}
                                className={`p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${c.is_active ? 'text-emerald-500' : 'text-zinc-400 dark:text-zinc-600'}`}
                            >
                                {c.is_active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                            </button>
                            <ChevronRight size={24} className="text-zinc-300 dark:text-zinc-600 ml-2" />
                        </AdminCard>
                    ))}
                    {filteredCountries.length === 0 && (
                        <div className="text-center py-12 text-zinc-500">No countries found matching "{searchQuery}"</div>
                    )}
                </div>
            </div>
        );
    }

    // ─── Country Detail View ───
    if (!config) {
        return <div className="flex justify-center p-20"><Loader2 size={32} className="animate-spin text-[#2CA58D]" /></div>;
    }

    const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
        { id: 'general', label: 'General', icon: Globe },
        { id: 'cities', label: `Cities (${config.cities.length})`, icon: MapPin },
        { id: 'banks', label: `Banks (${config.banks.length})`, icon: Building },
        { id: 'payments', label: `Payment Methods (${config.paymentMethods.length})`, icon: CreditCard },
        { id: 'pricing', label: 'Pricing', icon: DollarSign },
    ];

    return (
        <div className="max-w-[1000px] pb-12">
            <AdminConfirmDialog {...confirmState} onCancel={closeConfirm} />
            
            {/* Header */}
            <div className="mb-8 flex items-center gap-5">
                <AdminButton variant="ghost" size="icon" aria-label="Back to countries" onClick={() => { setSelectedId(null); setConfig(null); }}>
                    <ArrowLeft size={24} />
                </AdminButton>
                <div className="text-5xl">{getCountryFlag(config.id)}</div>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{config.name_en}</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">{config.name_ar} • {config.currency_symbol} {config.currency_code}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto no-scrollbar">
                {tabs.map(t => {
                    const Icon = t.icon;
                    const active = activeTab === t.id;
                    return (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} 
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                                active ? 'border-[#2CA58D] text-[#2CA58D]' : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:hover:text-zinc-300 dark:hover:border-zinc-700'
                            }`}
                        >
                            <Icon size={18} />{t.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <AdminCard className="p-0 sm:p-0">
                {activeTab === 'general' && <GeneralTab config={config} onSave={reloadConfig} />}
                {activeTab === 'cities' && <CitiesTab cities={config.cities} countryId={config.id} onReload={reloadConfig} openConfirm={openConfirm} closeConfirm={closeConfirm} />}
                {activeTab === 'banks' && <BanksTab banks={config.banks} countryId={config.id} onReload={reloadConfig} openConfirm={openConfirm} closeConfirm={closeConfirm} />}
                {activeTab === 'payments' && <PaymentMethodsTab methods={config.paymentMethods} countryId={config.id} onReload={reloadConfig} openConfirm={openConfirm} closeConfirm={closeConfirm} />}
                {activeTab === 'pricing' && <PricingTab config={config} onSave={reloadConfig} />}
            </AdminCard>
        </div>
    );
}

// ─── General Tab ───
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
        <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">{label}</label>
            <AdminInput dir={dir} value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} />
        </div>
    );

    return (
        <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                <AdminButton onClick={handleSave} isLoading={saving}>
                    <Check size={18} className="mr-2" /> Save Changes
                </AdminButton>
            </div>
        </div>
    );
}

// ─── Cities Tab ───
function CitiesTab({ cities, countryId, onReload, openConfirm, closeConfirm }: { cities: City[]; countryId: string; onReload: () => void; openConfirm: any; closeConfirm: any }) {
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

    const handleRemove = (cityId: string) => {
        openConfirm('Delete City', 'Are you sure you want to delete this city? This action cannot be undone.', async () => {
            closeConfirm();
            setPending(cityId);
            const result = await removeCity(cityId);
            setPending(null);
            if (result.success) { toast('success', 'City removed'); onReload(); }
            else toast('error', result.error || 'Failed');
        }, true);
    };

    const handleToggle = async (cityId: string, active: boolean) => {
        const result = await updateCity(cityId, { is_active: !active });
        if (result.success) { toast('success', `City ${!active ? 'activated' : 'deactivated'}`); onReload(); }
        else toast('error', result.error || 'Failed');
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Cities</h3>
                <AdminButton size="sm" onClick={() => setAdding(!adding)}><Plus size={16} className="mr-1.5" /> Add City</AdminButton>
            </div>

            {adding && (
                <div className="p-5 mb-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <AdminInput placeholder="ID (e.g. cairo)" value={newId} onChange={e => setNewId(e.target.value)} />
                        <AdminInput placeholder="Name English" value={newEn} onChange={e => setNewEn(e.target.value)} />
                        <AdminInput placeholder="Name Arabic" dir="rtl" value={newAr} onChange={e => setNewAr(e.target.value)} />
                    </div>
                    <div className="flex justify-end gap-3">
                        <AdminButton variant="ghost" onClick={() => setAdding(false)}>Cancel</AdminButton>
                        <AdminButton onClick={handleAdd} isLoading={pending === 'add'}>Save City</AdminButton>
                    </div>
                </div>
            )}

            <div className="grid gap-3">
                {cities.map(c => (
                    <div key={c.id} className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors">
                        <MapPin size={20} className="text-zinc-400 shrink-0" />
                        <div className="flex-1">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">{c.name_en}</span>
                            <span className="text-zinc-300 dark:text-zinc-700 mx-3">•</span>
                            <span className="font-medium text-zinc-600 dark:text-zinc-400">{c.name_ar}</span>
                            <span className="text-zinc-300 dark:text-zinc-700 mx-3">•</span>
                            <span className="text-sm text-zinc-500 font-mono">{c.id}</span>
                        </div>
                        <button aria-label={c.is_active ? "Deactivate city" : "Activate city"} onClick={() => handleToggle(c.id, c.is_active)} className={`p-1 rounded-full transition-colors ${c.is_active ? 'text-emerald-500' : 'text-zinc-400'}`}>
                            {c.is_active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                        </button>
                        <AdminButton variant="ghost" size="icon" aria-label="Delete city" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={() => handleRemove(c.id)} isLoading={pending === c.id}>
                            <Trash2 size={18} />
                        </AdminButton>
                    </div>
                ))}
                {cities.length === 0 && <p className="text-zinc-500 text-center py-8">No cities yet. Add one above.</p>}
            </div>
        </div>
    );
}

// ─── Banks Tab ───
function BanksTab({ banks, countryId, onReload, openConfirm, closeConfirm }: { banks: Bank[]; countryId: string; onReload: () => void; openConfirm: any; closeConfirm: any }) {
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

    const handleRemove = (bankId: string) => {
        openConfirm('Delete Bank', 'Are you sure you want to delete this bank?', async () => {
            closeConfirm();
            setPending(bankId);
            const result = await removeBank(bankId);
            setPending(null);
            if (result.success) { toast('success', 'Bank removed'); onReload(); }
            else toast('error', result.error || 'Failed');
        }, true);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Banks</h3>
                <AdminButton size="sm" onClick={() => setAdding(!adding)}><Plus size={16} className="mr-1.5" /> Add Bank</AdminButton>
            </div>

            {adding && (
                <div className="p-5 mb-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-top-2">
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <AdminInput placeholder="Bank name" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
                        </div>
                        <AdminButton onClick={handleAdd} isLoading={pending === 'add'}>Add Bank</AdminButton>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {banks.map(b => (
                    <div key={b.id} className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors">
                        <Building size={20} className="text-zinc-400 shrink-0" />
                        <span className="flex-1 font-bold text-zinc-900 dark:text-zinc-100">{b.name}</span>
                        <AdminButton variant="ghost" size="icon" aria-label="Delete bank" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={() => handleRemove(b.id)} isLoading={pending === b.id}>
                            <Trash2 size={18} />
                        </AdminButton>
                    </div>
                ))}
                {banks.length === 0 && <p className="text-zinc-500 text-center py-8 col-span-2">No banks yet.</p>}
            </div>
        </div>
    );
}

// ─── Payment Methods Tab ───
function PaymentMethodsTab({ methods, countryId, onReload, openConfirm, closeConfirm }: { methods: PaymentMethod[]; countryId: string; onReload: () => void; openConfirm: any; closeConfirm: any }) {
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({
        method_type: 'bank_transfer', label_en: '', label_ar: '',
        description_en: '', description_ar: '', icon: 'building',
        required_fields: ''
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

    const handleRemove = (pmId: string) => {
        openConfirm('Delete Payment Method', 'Are you sure you want to delete this payment method? Vendors using it will lose access.', async () => {
            closeConfirm();
            setPending(pmId);
            const result = await removePaymentMethod(pmId);
            setPending(null);
            if (result.success) { toast('success', 'Payment method removed'); onReload(); }
            else toast('error', result.error || 'Failed');
        }, true);
    };

    const iconMap: Record<string, string> = { building: '🏦', smartphone: '📱', link: '🔗' };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Payment Methods</h3>
                <AdminButton size="sm" onClick={() => setAdding(!adding)}><Plus size={16} className="mr-1.5" /> Add Method</AdminButton>
            </div>

            {adding && (
                <div className="p-6 mb-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Type</label>
                            <select className="w-full h-11 px-4 text-sm rounded-2xl border-2 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:border-[#2CA58D] focus:ring-4 focus:ring-[#2CA58D]/10 outline-none transition-all" value={form.method_type} onChange={e => {
                                const opt = typeOptions.find(o => o.value === e.target.value);
                                setForm(p => ({ ...p, method_type: e.target.value, icon: opt?.icon || 'building' }));
                            }}>
                                {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Icon</label>
                            <AdminInput value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Label (English)</label>
                            <AdminInput value={form.label_en} onChange={e => setForm(p => ({ ...p, label_en: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Label (Arabic)</label>
                            <AdminInput dir="rtl" value={form.label_ar} onChange={e => setForm(p => ({ ...p, label_ar: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Description (EN)</label>
                            <AdminInput value={form.description_en} onChange={e => setForm(p => ({ ...p, description_en: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Description (AR)</label>
                            <AdminInput dir="rtl" value={form.description_ar} onChange={e => setForm(p => ({ ...p, description_ar: e.target.value }))} />
                        </div>
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                            Required Fields (comma-separated, e.g. bank_name, iban, account_holder)
                        </label>
                        <AdminInput placeholder="bank_name, iban, account_holder" value={form.required_fields} onChange={e => setForm(p => ({ ...p, required_fields: e.target.value }))} />
                    </div>
                    <div className="flex justify-end gap-3">
                        <AdminButton variant="ghost" onClick={() => setAdding(false)}>Cancel</AdminButton>
                        <AdminButton onClick={handleAdd} isLoading={pending === 'add'}>Save Method</AdminButton>
                    </div>
                </div>
            )}

            <div className="grid gap-4">
                {methods.map(m => (
                    <div key={m.id} className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-start gap-4 mb-3">
                            <span className="text-3xl bg-white dark:bg-zinc-900 p-2 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm">{iconMap[m.icon || 'building'] || '💳'}</span>
                            <div className="flex-1 mt-1">
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{m.label_en}</span>
                                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                                    <span className="font-medium text-zinc-600 dark:text-zinc-400">{m.label_ar}</span>
                                    <AdminBadge variant="accent" className="ml-2">{m.method_type}</AdminBadge>
                                </div>
                                {(m.description_en || m.description_ar) && (
                                    <p className="text-sm text-zinc-500 mt-1">{m.description_en} {m.description_ar && `• ${m.description_ar}`}</p>
                                )}
                            </div>
                            <AdminButton variant="ghost" size="icon" aria-label="Delete payment method" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={() => handleRemove(m.id)} isLoading={pending === m.id}>
                                <Trash2 size={18} />
                            </AdminButton>
                        </div>
                        <div className="text-xs text-zinc-500 font-medium bg-white dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 mt-4 flex items-center gap-2">
                            <span className="uppercase tracking-wider">Required Fields:</span>
                            <code className="text-[#2CA58D] font-bold">
                                {Array.isArray(m.required_fields) ? m.required_fields.join(', ') : String(m.required_fields)}
                            </code>
                        </div>
                    </div>
                ))}
                {methods.length === 0 && <p className="text-zinc-500 text-center py-8">No payment methods yet.</p>}
            </div>
        </div>
    );
}

// ─── Pricing Tab ───
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
        <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">{label}</label>
            <div className="relative">
                <AdminInput 
                    type="number" 
                    min="0"
                    value={form[field]} 
                    onChange={e => setForm(p => ({ ...p, [field]: Number(e.target.value) }))} 
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-zinc-400">
                    {config.currency_symbol}
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6">Subscription Pricing</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-[#2CA58D]/5 border border-[#2CA58D]/20">
                    <h4 className="text-base font-bold text-[#2CA58D] mb-5">Pro Tier</h4>
                    <div className="space-y-4">
                        <PriceField label="Monthly Price" field="subscription_pro_monthly_price" />
                        <PriceField label="Annual Price" field="subscription_pro_annual_price" />
                    </div>
                </div>
                <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                    <h4 className="text-base font-bold text-amber-600 mb-5">Business Tier</h4>
                    <div className="space-y-4">
                        <PriceField label="Monthly Price" field="subscription_business_monthly_price" />
                        <PriceField label="Annual Price" field="subscription_business_annual_price" />
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                <AdminButton onClick={handleSave} isLoading={saving}>
                    <Check size={18} className="mr-2" /> Save Pricing
                </AdminButton>
            </div>
        </div>
    );
}

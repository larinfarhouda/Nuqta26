'use client';

import { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, ToggleLeft, ToggleRight, Building, Smartphone, Link as LinkIcon, CreditCard, Save, CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

// Field labels for required_fields keys
const FIELD_LABELS: Record<string, { en: string; ar: string; placeholder: string; type?: string }> = {
    bank_name: { en: 'Bank Name', ar: 'اسم البنك', placeholder: 'Select bank...' },
    iban: { en: 'IBAN', ar: 'رقم الآيبان', placeholder: 'TR00 0000 0000 0000 0000 00' },
    account_number: { en: 'Account Number', ar: 'رقم الحساب', placeholder: '1234567890' },
    account_holder: { en: 'Account Holder', ar: 'اسم صاحب الحساب', placeholder: 'Full name...' },
    phone_number: { en: 'Phone Number', ar: 'رقم الهاتف', placeholder: '+20 101 234 5678' },
    wallet_provider: { en: 'Wallet Provider', ar: 'مزود المحفظة', placeholder: 'Vodafone Cash, Fawry...' },
    payment_url: { en: 'Payment Link', ar: 'رابط الدفع', placeholder: 'https://...', type: 'url' },
    provider_name: { en: 'Provider Name', ar: 'اسم المزود', placeholder: 'InstaPay, Paymob...' },
};

const METHOD_ICONS: Record<string, React.ElementType> = {
    bank_transfer: Building,
    mobile_wallet: Smartphone,
    payment_link: LinkIcon,
};

interface PaymentMethodConfig {
    id: string;
    method_type: string;
    label_en: string;
    label_ar: string;
    icon: string | null;
    required_fields: string[];
}

interface VendorPaymentMethodData {
    id: string;
    payment_method_id: string;
    details: Record<string, string>;
    is_active: boolean;
    payment_methods?: PaymentMethodConfig;
}

interface Props {
    vendorId: string;
    vendorCountry: string;
    showAlert: (msg: string, type: 'success' | 'error') => void;
    banks?: { id: string; name: string }[];
}

export default function VendorPaymentMethodsSection({ vendorId, vendorCountry, showAlert, banks = [] }: Props) {
    const t = useTranslations('Dashboard.vendor.profile');
    const [methods, setMethods] = useState<PaymentMethodConfig[]>([]);
    const [vendorMethods, setVendorMethods] = useState<VendorPaymentMethodData[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    // Load available payment methods for vendor's country + vendor's current setup
    useEffect(() => {
        loadData();
    }, [vendorId, vendorCountry]);

    const loadData = async () => {
        setLoading(true);
        const supabase = createClient();

        // Get available methods for this country
        const { data: countryMethods } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('country_id', vendorCountry)
            .eq('is_active', true)
            .order('sort_order');

        // Get vendor's configured methods
        const { data: vendorPm } = await supabase
            .from('vendor_payment_methods')
            .select('*, payment_methods(*)')
            .eq('vendor_id', vendorId);

        setMethods((countryMethods || []) as any);
        setVendorMethods((vendorPm || []) as any);
        setLoading(false);
    };

    const getVendorMethod = (methodId: string) => {
        return vendorMethods.find(vm => vm.payment_method_id === methodId);
    };

    const handleToggle = async (method: PaymentMethodConfig) => {
        const existing = getVendorMethod(method.id);
        const supabase = createClient();

        if (existing) {
            // Toggle active state
            await supabase
                .from('vendor_payment_methods')
                .update({ is_active: !existing.is_active, updated_at: new Date().toISOString() })
                .eq('id', existing.id);
        } else {
            // Create with empty details and active
            const emptyDetails: Record<string, string> = {};
            (method.required_fields as string[]).forEach(f => { emptyDetails[f] = ''; });

            await supabase
                .from('vendor_payment_methods')
                .insert({
                    vendor_id: vendorId,
                    payment_method_id: method.id,
                    details: emptyDetails,
                    is_active: true,
                });
        }

        await loadData();
    };

    const handleSaveDetails = async (method: PaymentMethodConfig, details: Record<string, string>) => {
        setSaving(method.id);
        const supabase = createClient();
        const existing = getVendorMethod(method.id);

        if (existing) {
            await supabase
                .from('vendor_payment_methods')
                .update({ details, updated_at: new Date().toISOString() })
                .eq('id', existing.id);
        } else {
            await supabase
                .from('vendor_payment_methods')
                .insert({
                    vendor_id: vendorId,
                    payment_method_id: method.id,
                    details,
                    is_active: true,
                });
        }

        await loadData();
        setSaving(null);
        showAlert('Payment method saved', 'success');
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        );
    }

    if (methods.length === 0) {
        return (
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 pb-2 border-b border-gray-50">
                    <div className="p-2 bg-amber-50 rounded-xl text-amber-600"><CreditCard className="w-5 h-5" /></div>
                    <h3 className="font-bold text-gray-900">{t('payment_methods_title') || 'Payment Methods'}</h3>
                </div>
                <p className="text-gray-400 text-sm mt-4">No payment methods available for your country yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-gray-50">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600"><CreditCard className="w-5 h-5" /></div>
                <h3 className="font-bold text-gray-900">{t('payment_methods_title') || 'Payment Methods'}</h3>
            </div>

            <p className="text-[11px] text-gray-500 font-medium bg-gray-50 p-3 rounded-xl border border-gray-100 italic">
                {t('payment_methods_note') || 'Enable the payment methods you accept and fill in your details. Customers will see these when booking your events.'}
            </p>

            <div className="space-y-4">
                {methods.map(method => {
                    const vm = getVendorMethod(method.id);
                    const isActive = vm?.is_active || false;
                    const Icon = METHOD_ICONS[method.method_type] || CreditCard;

                    return (
                        <PaymentMethodCard
                            key={method.id}
                            method={method}
                            vendorMethod={vm}
                            isActive={isActive}
                            Icon={Icon}
                            banks={banks}
                            saving={saving === method.id}
                            onToggle={() => handleToggle(method)}
                            onSave={(details) => handleSaveDetails(method, details)}
                        />
                    );
                })}
            </div>
        </div>
    );
}

// ─── Individual Payment Method Card ─────────────────────────────────────────

function PaymentMethodCard({
    method, vendorMethod, isActive, Icon, banks, saving, onToggle, onSave,
}: {
    method: PaymentMethodConfig;
    vendorMethod?: VendorPaymentMethodData;
    isActive: boolean;
    Icon: React.ElementType;
    banks: { id: string; name: string }[];
    saving: boolean;
    onToggle: () => void;
    onSave: (details: Record<string, string>) => void;
}) {
    const fields = Array.isArray(method.required_fields) ? method.required_fields : [];
    const [details, setDetails] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        fields.forEach(f => { initial[f] = (vendorMethod?.details as Record<string, string>)?.[f] || ''; });
        return initial;
    });

    return (
        <div className={`rounded-2xl border transition-all ${isActive ? 'border-primary/30 bg-primary/5' : 'border-gray-100 bg-gray-50'}`}>
            {/* Header */}
            <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={onToggle}>
                <div className={`p-2 rounded-xl ${isActive ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <span className={`font-bold text-sm ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                        {method.label_en}
                    </span>
                    <span className="text-gray-400 mx-2">·</span>
                    <span className={`text-sm ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>{method.label_ar}</span>
                </div>
                <div className={isActive ? 'text-primary' : 'text-gray-300'}>
                    {isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </div>
            </div>

            {/* Expandable Details */}
            {isActive && fields.length > 0 && (
                <div className="px-4 pb-4 space-y-3">
                    <div className="border-t border-gray-200/50 pt-3" />
                    {fields.map(field => {
                        const label = FIELD_LABELS[field];
                        const isBankField = field === 'bank_name' && banks.length > 0;

                        return (
                            <div key={field} className="space-y-1">
                                <label className="text-xs font-bold text-gray-400 uppercase">
                                    {label?.ar || field}
                                </label>
                                {isBankField ? (
                                    <select
                                        className="input-field appearance-none cursor-pointer"
                                        value={details[field] || ''}
                                        onChange={e => setDetails(p => ({ ...p, [field]: e.target.value }))}
                                    >
                                        <option value="">{label?.placeholder || 'Select...'}</option>
                                        {banks.map(b => (
                                            <option key={b.id} value={b.name}>{b.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        className="input-field"
                                        type={label?.type || 'text'}
                                        placeholder={label?.placeholder || ''}
                                        value={details[field] || ''}
                                        onChange={e => setDetails(p => ({ ...p, [field]: e.target.value }))}
                                    />
                                )}
                            </div>
                        );
                    })}

                    <button
                        onClick={() => onSave(details)}
                        disabled={saving}
                        className="w-full py-2.5 bg-primary text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Saving...' : 'Save Details'}
                    </button>
                </div>
            )}

            {isActive && fields.length > 0 && vendorMethod && Object.values(vendorMethod.details || {}).some(v => v) && (
                <div className="px-4 pb-3">
                    <div className="flex items-center gap-1.5 text-emerald-600">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Configured</span>
                    </div>
                </div>
            )}
        </div>
    );
}

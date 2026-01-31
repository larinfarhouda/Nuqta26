'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
    Tag, Plus, Trash2,
    Percent, DollarSign,
    CheckCircle2, Loader2, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    getVendorDiscountCodes,
    createDiscountCode,
    deleteDiscountCode,
    toggleDiscountCode
} from '@/actions/vendor/discounts';
import { getVendorEvents } from '@/actions/vendor/events';
import { DiscountCodeWithEvent, CreateDiscountCodeInput } from '@/types/dto/discount.dto';

interface Props {
    showAlert: (message: string, type: 'success' | 'error') => void;
}

export default function DiscountsTab({ showAlert }: Props) {
    const t = useTranslations('Dashboard.vendor.discounts');

    const [codes, setCodes] = useState<DiscountCodeWithEvent[]>([]);
    const [events, setEvents] = useState<any[]>([]); // Keep as any - event type is complex
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<CreateDiscountCodeInput>({
        code: '',
        discount_type: 'percentage' as 'percentage' | 'fixed',
        discount_value: 0,
        event_id: '',
        min_purchase_amount: 0,
        max_uses: 0,
        expiry_date: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [codesData, eventsData] = await Promise.all([
            getVendorDiscountCodes(),
            getVendorEvents()
        ]);
        setCodes(codesData);
        setEvents(eventsData);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await createDiscountCode({
                ...formData,
                event_id: formData.event_id || undefined,
                min_purchase_amount: formData.min_purchase_amount || undefined,
                max_uses: formData.max_uses || undefined,
                expiry_date: formData.expiry_date || undefined
            });

            if (res.success) {
                showAlert(t('create_success'), 'success');
                setShowForm(false);
                setFormData({
                    code: '',
                    discount_type: 'percentage',
                    discount_value: 0,
                    event_id: '',
                    min_purchase_amount: 0,
                    max_uses: 0,
                    expiry_date: ''
                });
                fetchData();
            } else {
                showAlert(res.error || t('create_error'), 'error');
            }
        } catch (err: any) {
            showAlert(err.message || t('create_error'), 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('delete_confirm'))) return;
        try {
            const res = await deleteDiscountCode(id);
            if (res.success) {
                showAlert(t('delete_success'), 'success');
                fetchData();
            } else {
                showAlert(res.error || t('delete_error'), 'error');
            }
        } catch (err: any) {
            showAlert(err.message || t('delete_error'), 'error');
        }
    };

    const handleToggle = async (id: string, current: boolean) => {
        try {
            const res = await toggleDiscountCode(id, !current);
            if (res.success) {
                showAlert(t('toggle_success'), 'success');
                fetchData();
            } else {
                showAlert(res.error || t('toggle_error'), 'error');
            }
        } catch (err: any) {
            showAlert(err.message || t('toggle_error'), 'error');
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-black text-gray-900">{t('title')}</h2>
                    <p className="text-gray-500 font-medium mt-1">{t('subtitle')}</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-4 rounded-2xl font-bold hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    {t('new_code')}
                </button>
            </div>

            {/* Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">{t('form.code_label')}</label>
                                    <input
                                        required
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="input-field"
                                        placeholder="SAVE20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">{t('form.event_label')}</label>
                                    <select
                                        value={formData.event_id}
                                        onChange={e => setFormData({ ...formData, event_id: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="">{t('form.all_events')}</option>
                                        {events.map(event => (
                                            <option key={event.id} value={event.id}>{event.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">{t('form.type_label')}</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, discount_type: 'percentage' })}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold transition-all ${formData.discount_type === 'percentage' ? 'bg-primary/5 border-primary text-primary' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}
                                        >
                                            <Percent className="w-4 h-4" />
                                            {t('form.percentage')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, discount_type: 'fixed' })}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold transition-all ${formData.discount_type === 'fixed' ? 'bg-primary/5 border-primary text-primary' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}
                                        >
                                            <DollarSign className="w-4 h-4" />
                                            {t('form.fixed')}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">{t('form.value_label')}</label>
                                    <div className="relative">
                                        <input
                                            required
                                            type="number"
                                            value={formData.discount_value}
                                            onChange={e => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                                            className="input-field pr-12"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                                            {formData.discount_type === 'percentage' ? '%' : '₺'}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">{t('form.min_purchase_label')}</label>
                                    <input
                                        type="number"
                                        value={formData.min_purchase_amount}
                                        onChange={e => setFormData({ ...formData, min_purchase_amount: parseFloat(e.target.value) })}
                                        className="input-field"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">{t('form.expiry_label')}</label>
                                    <input
                                        type="date"
                                        value={formData.expiry_date}
                                        onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors">{t('form.cancel')}</button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    {t('new_code')}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right" dir="rtl">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-sm font-black text-gray-400 text-right">{t('code')}</th>
                                <th className="px-6 py-4 text-sm font-black text-gray-400 text-right">{t('type')}</th>
                                <th className="px-6 py-4 text-sm font-black text-gray-400 text-right">{t('value')}</th>
                                <th className="px-6 py-4 text-sm font-black text-gray-400 text-right">{t('uses')}</th>
                                <th className="px-6 py-4 text-sm font-black text-gray-400 text-right">{t('status')}</th>
                                <th className="px-6 py-4 text-sm font-black text-gray-400 text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {codes.map((code) => (
                                <tr key={code.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <div className="text-right">
                                                <span className="font-black text-gray-900 block">{code.code}</span>
                                                {code.events && <span className="text-xs text-gray-500 font-bold">{code.events.title}</span>}
                                            </div>
                                            <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                                <Tag className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-600 text-right">
                                        {code.discount_type === 'percentage' ? t('form.percentage') : t('form.fixed')}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-black text-primary text-right">
                                        {code.discount_value} {code.discount_type === 'percentage' ? '%' : '₺'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm font-bold text-gray-900">{code.used_count || 0}</span>
                                        {code.max_uses && <span className="text-xs text-gray-400 font-bold"> / {code.max_uses}</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleToggle(code.id, code.is_active ?? false)}
                                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${code.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                                        >
                                            {code.is_active ? t('active') : t('inactive')}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(code.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {codes.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-bold text-right">
                                        لا توجد أكواد خصم حالية
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
